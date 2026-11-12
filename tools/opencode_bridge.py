#!/usr/bin/env python3
"""Drive opencode through a private local server and forward its permission requests to Pawmpt.

Pawmpt writes one request line on stdin, then permission replies (see AGENT_APPROVAL_PROTOCOL.md).
This bridge starts `opencode serve` on 127.0.0.1 with a random password, sends the question, and
turns opencode's events into Pawmpt's JSON lines. It speaks both server APIs: opencode 2 (/api/...)
and opencode 1 (/session, /event, /permission). The permission rules come from Pawmpt in
OPENCODE_CONFIG_CONTENT, which the server inherits.
"""
import base64
import json
import os
import queue
import re
import secrets
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from bridge_common import (Replies, clip, emit, is_secret_path, on_signals, read_request, search_reaches_secret,
                           secret_patterns, spawn, stop_tree)

SESSION_ID = re.compile(r"^ses_[A-Za-z0-9_-]{1,128}$")
# opencode's permission names, in words
ACTIONS = {"bash": "run a command", "shell": "run a command", "execute": "run code", "edit": "edit files",
           "write": "write a file", "external_directory": "work outside the work folder", "webfetch": "open a web page",
           "websearch": "search the web", "codesearch": "search code online", "task": "start another agent",
           "subagent": "start another agent", "skill": "use a skill", "read": "read a file", "doom_loop": "keep repeating itself",
           "grep": "search the files", "lsp": "ask the language server"}


KEPT_OUT = "Pawmpt keeps files with keys and passwords out of reach."

SAID = []


def text(chunk):
    if chunk:
        SAID.append(True)
        emit({"pawmpt": "text", "text": str(chunk)})


def activity(line):
    line = " ".join(str(line).split())
    if line:
        emit({"pawmpt": "activity", "text": line[:200]})


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def main():
    on_signals()
    try:
        request = read_request()
        prompt = str(request["prompt"])
        previous = str(request.get("session") or "")
        if not SESSION_ID.match(previous):
            previous = ""
        model = str(request.get("model") or "").strip()
        agent = str(request.get("agent") or "build")
        variant = str(request.get("variant") or "").strip()
        patterns = secret_patterns(request)
        cwd = os.getcwd()
    except Exception:
        text("Pawmpt: the request to the opencode bridge could not be read.")
        return 2

    password = secrets.token_urlsafe(32)
    env = os.environ.copy()
    env["OPENCODE_SERVER_USERNAME"] = "opencode"
    env["OPENCODE_SERVER_PASSWORD"] = password
    auth = "Basic " + base64.b64encode(("opencode:" + password).encode()).decode("ascii")
    try:
        server = spawn(["opencode", "serve", "--hostname", "127.0.0.1", "--port", str(free_port())],
                       cwd=os.getcwd(), env=env, stdin=subprocess.DEVNULL,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    except FileNotFoundError:
        text("opencode is not installed, or not on the PATH. Install it, or pick another agent in Settings › Agent.")
        return 127

    # The address comes from the server's own "listening on" line, never from the port picked above:
    # if something else took that port first, opencode does not listen there, and nothing is sent to it.
    found = queue.Queue()
    log = []

    def server_output():
        for line in server.stdout:
            log.append(line.rstrip())
            del log[:-20]
            m = re.search(r"listening on (http://127\.0\.0\.1:\d+)", line)
            if m:
                found.put(m.group(1))

    threading.Thread(target=server_output, daemon=True).start()
    stop = threading.Event()
    replies = Replies()

    try:
        try:
            base = found.get(timeout=60)
        except queue.Empty:
            base = None
        if not base:
            text("opencode did not start its server." + (" " + " / ".join(log[-3:]) if log else ""))
            return 1

        def api(method, path, body=None, timeout=30):
            data = None if body is None else json.dumps(body).encode()
            req = urllib.request.Request(base + path, data=data, method=method,
                                         headers={"Content-Type": "application/json", "Authorization": auth})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as res:
                    content = res.read()
                    if not content:
                        return None
                    try:
                        return json.loads(content)
                    except ValueError:
                        raise RuntimeError("opencode answered " + method + " " + path + " with something that is not JSON")
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", "replace").strip()
                raise RuntimeError("opencode API " + method + " " + path + " returned HTTP " +
                                   str(exc.code) + ": " + (detail[:600] or str(exc.reason))) from exc

        # which API this opencode has: 2 answers /api/info, 1 answers /session
        v2 = None
        deadline = time.monotonic() + 30
        while v2 is None and time.monotonic() < deadline:
            if server.poll() is not None:
                text("opencode's server stopped while starting." + (" " + " / ".join(log[-3:]) if log else ""))
                return 1
            try:
                info = api("GET", "/api/info", timeout=2)
                v2 = isinstance(info, dict)
            except Exception:
                try:
                    v2 = False if isinstance(api("GET", "/session", timeout=2), list) else None
                except Exception:
                    v2 = None
            if v2 is None:
                time.sleep(0.2)
        if v2 is None:
            text("opencode's server did not answer.")
            return 1

        events = queue.Queue()

        def event_reader():
            path = "/api/event" if v2 else "/event"
            while not stop.is_set():
                try:
                    req = urllib.request.Request(base + path, headers={"Authorization": auth, "Accept": "text/event-stream"})
                    with urllib.request.urlopen(req, timeout=600) as res:
                        data = []
                        for raw in res:
                            if stop.is_set():
                                return
                            line = raw.decode("utf-8", "replace").rstrip("\r\n")
                            if line.startswith("data:"):
                                data.append(line[5:].lstrip())
                            elif line == "" and data:
                                try:
                                    events.put(json.loads("\n".join(data)))
                                except ValueError:
                                    pass
                                data = []
                except Exception:
                    stop.wait(0.3)

        threading.Thread(target=event_reader, daemon=True).start()
        time.sleep(0.2)          # let the event stream connect before anything happens

        provider, model_id = (model.split("/", 1) + [""])[:2] if "/" in model else ("", "")
        session_id = previous
        q = urllib.parse.quote
        if v2:
            if session_id:
                api("POST", "/api/session/" + q(session_id, safe="") + "/agent", {"agent": agent})
                if provider:
                    chosen = {"providerID": provider, "id": model_id}
                    if variant:
                        chosen["variant"] = variant
                    api("POST", "/api/session/" + q(session_id, safe="") + "/model", {"model": chosen})
            else:
                body = {"title": "Pawmpt", "agent": agent}
                if provider:
                    body["model"] = {"providerID": provider, "id": model_id}
                    if variant:
                        body["model"]["variant"] = variant
                created = api("POST", "/api/session", body)
                data = created.get("data", created) if isinstance(created, dict) else {}
                session_id = str(data.get("id", ""))
        elif not session_id:
            created = api("POST", "/session", {"title": "Pawmpt"})
            session_id = str((created or {}).get("id", ""))
        if not SESSION_ID.match(session_id):
            raise RuntimeError("opencode did not give a session id")
        emit({"pawmpt": "session", "id": session_id})
        sid = q(session_id, safe="")

        prompt_error = []

        def send_prompt():
            try:
                if v2:
                    api("POST", "/api/session/" + sid + "/prompt", {"text": prompt}, timeout=86400)
                else:
                    body = {"parts": [{"type": "text", "text": prompt}], "agent": agent}
                    if provider:
                        body["model"] = {"providerID": provider, "modelID": model_id}
                    if variant:
                        body["variant"] = variant
                    api("POST", "/session/" + sid + "/prompt_async", body)
            except Exception as exc:
                prompt_error.append(exc)

        # the sessions of this run: this one, and those of the agents it starts, whose permission
        # requests and questions are answered here too (left alone, they wait for ever)
        family = {session_id}
        asked_in = {}            # permission id -> its session

        def reply_permission(pid, allow, why=None):
            decision = "once" if allow else "reject"
            if v2:
                where = q(asked_in.get(pid, session_id), safe="")
                body = {"decision": decision}
                if why:
                    body["message"] = why
                api("POST", "/api/session/" + where + "/permission/" + q(pid, safe="") + "/reply", body)
            else:
                body = {"reply": decision}
                if why:
                    body["message"] = why
                api("POST", "/permission/" + q(pid, safe="") + "/reply", body)

        def reject_question(qid, where):
            try:
                if v2:
                    api("POST", "/api/session/" + q(where, safe="") + "/question/" + q(qid, safe="") + "/reject", {})
                else:
                    api("POST", "/question/" + q(qid, safe="") + "/reject", {})
            except Exception:
                pass

        sender = threading.Thread(target=send_prompt, daemon=True)
        sender.start()

        busy = False             # the run started: an idle after it is the end
        done = False
        asked = set()            # permission ids already shown
        answered = set()         # and the ones you already answered
        asked_what = {}          # permission id -> what it was for
        denied = []              # what you turned down
        part_kind = {}           # part id -> text / reasoning / tool ...
        tools_seen = set()
        tool_names = {}          # call id -> tool name (opencode 2)
        last_text = ""
        sent_at = None
        while not done:
            if prompt_error:
                raise RuntimeError(str(prompt_error[0]))
            # The run is over when opencode says so (an execution or idle event below), never
            # because it has been quiet: a model thinks, and you read a permission card, for as
            # long as it takes. Only a server that died, or a question that never started, ends it.
            if server.poll() is not None:
                raise RuntimeError("its server stopped (exit code %s)" % server.returncode)
            if not sender.is_alive() and not busy:
                if sent_at is None:
                    sent_at = time.monotonic()
                elif time.monotonic() - sent_at > 60:
                    raise RuntimeError("it took the question but never started on it")
            # every reply that has come in, in order: two clicks in a row are two lines
            while True:
                try:
                    answer = replies.get(timeout=0)
                except EOFError:
                    return 143   # Pawmpt went away
                if answer is None:
                    break
                pid = str(answer.get("id", ""))
                if answer.get("pawmpt") == "permission_reply" and pid in asked and pid not in answered:
                    answered.add(pid)
                    allowed = answer.get("allow") is True
                    if not allowed:
                        denied.append(asked_what.get(pid, "that"))
                    reply_permission(pid, allowed)
            try:
                event = events.get(timeout=0.1)
            except queue.Empty:
                continue
            if isinstance(event.get("payload"), dict):
                event = event["payload"]
            kind = str(event.get("type", ""))
            data = event.get("properties", event.get("data", {})) or {}
            if not isinstance(data, dict):
                continue
            ev_session = str(data.get("sessionID") or (data.get("part") or {}).get("sessionID") or
                             (data.get("info") or {}).get("sessionID") or session_id)
            if kind == "session.created":
                info = data.get("info") if isinstance(data.get("info"), dict) else data
                child = str(info.get("id") or data.get("sessionID") or "")
                if str(info.get("parentID") or data.get("parentID") or "") in family and SESSION_ID.match(child):
                    family.add(child)
                continue
            if ev_session != session_id:
                # an agent this run started: only what needs an answer
                if ev_session not in family or kind not in ("permission.asked", "permission.v2.asked",
                                                            "question.asked", "question.v2.asked"):
                    continue
            status = data.get("status", {}) or {}
            if kind == "session.execution.started" or (kind == "session.status" and isinstance(status, dict) and status.get("type") == "busy"):
                busy = True
            elif kind == "session.idle" or (kind == "session.status" and isinstance(status, dict) and status.get("type") == "idle"):
                if busy:
                    done = True
            elif kind in ("session.execution.succeeded", "session.execution.interrupted"):
                done = True
            elif kind in ("session.execution.failed", "session.step.failed", "session.error"):
                err = data.get("error") or data.get("message") or "opencode stopped with an error."
                aborted = isinstance(err, dict) and (err.get("type") == "aborted" or err.get("name") == "MessageAbortedError")
                if isinstance(err, dict):
                    err = (err.get("data") or {}).get("message") or err.get("message") or err.get("name") or "error"
                # a step that ends because you denied something is not an error
                if not (aborted and denied):
                    emit({"pawmpt": "error", "text": str(err)[:800]})
                if kind != "session.step.failed":
                    done = True
            elif kind == "message.updated":
                info = data.get("info") or {}
                tokens = info.get("tokens") or {}
                if info.get("role") == "assistant" and isinstance(tokens, dict):
                    n = sum(int(tokens.get(k) or 0) for k in ("input", "output", "reasoning"))
                    if n > 0:
                        emit({"pawmpt": "usage", "tokens": n, "cost": float(info.get("cost") or 0)})
            elif kind == "session.usage.updated":
                tokens = data.get("tokens") or {}
                n = sum(int(tokens.get(k) or 0) for k in ("input", "output", "reasoning"))
                if n > 0:
                    emit({"pawmpt": "usage", "tokens": n, "cost": float(data.get("cost") or 0)})
            elif kind in ("permission.asked", "permission.v2.asked"):
                raw = data.get("permission", data)
                perm = raw if isinstance(raw, dict) else data
                pid = str(perm.get("id") or data.get("id") or "")
                action = perm.get("action") or (raw if isinstance(raw, str) else "") or perm.get("permission") or "an action"
                if pid and pid not in asked:
                    asked.add(pid)
                    asked_in[pid] = ev_session
                    asked_what[pid] = str(action)
                    resources = [str(x) for x in (perm.get("resources") or data.get("patterns") or [])]
                    meta = data.get("metadata") or {}
                    if not isinstance(meta, dict):
                        meta = {}
                    # A search reads every file under its folder, hidden ones included, and opencode
                    # checks it apart from reading: it is let through without a card only when it
                    # can't reach a key or password file, and turned down when it can.
                    if action in ("grep", "lsp"):
                        target = meta.get("path") if action == "grep" else meta.get("filePath")
                        reaches = (search_reaches_secret(target, patterns, cwd) if action == "grep"
                                   else bool(target) and is_secret_path(target, patterns, cwd))
                        if reaches is not None:
                            answered.add(pid)
                            if reaches:
                                activity("✗ " + str(action) + ": it would read files with keys or passwords, not allowed")
                                # turned down with a reason, so the agent goes on another way
                                reply_permission(pid, False, KEPT_OUT + " " + (
                                    "This search could read some: it reads every file in its folder, and searching "
                                    "a file reads the whole folder the file is in. Search a folder without them, or "
                                    "read the files you need one by one." if action == "grep" else
                                    "This file is one of them."))
                            else:
                                reply_permission(pid, True)
                            continue
                    command = meta.get("command") if isinstance(meta, dict) else None
                    lines = []
                    if action == "external_directory" and resources:
                        lines.append("Outside the work folder: " + ", ".join(resources))
                    if command:
                        lines.append(str(command))
                    elif resources and action != "external_directory":
                        lines.append(", ".join(resources))
                    if action == "grep":
                        lines.append("In " + str(meta.get("path") or cwd) + ": too many files for Pawmpt to check, and a "
                                     "search reads them all, hidden ones too (for a file, all of the folder it is in). "
                                     "Deny if keys or passwords may be in there.")
                    detail = "\n".join(lines) or json.dumps(meta, ensure_ascii=False)
                    emit({"pawmpt": "permission", "id": pid,
                          "title": "opencode wants to " + ACTIONS.get(str(action), "use " + str(action)[:60]),
                          "detail": clip(detail)})
            elif kind in ("question.asked", "question.v2.asked"):
                qid = str(data.get("id") or "")
                if qid:
                    reject_question(qid, ev_session)
            elif kind == "message.part.updated":
                part = data.get("part", {}) or {}
                pid = str(part.get("id", ""))
                ptype = part.get("type", "")
                if pid:
                    part_kind[pid] = ptype
                if ptype == "tool":
                    state = part.get("state", {}) or {}
                    inp = state.get("input", {}) or {}
                    what = state.get("title") or inp.get("command") or inp.get("filePath") or inp.get("path") or inp.get("pattern") or ""
                    key = str(part.get("callID") or pid) + ":" + str(state.get("status"))
                    if state.get("status") in ("running", "error") and key not in tools_seen:
                        tools_seen.add(key)
                        activity(("✗ " if state.get("status") == "error" else "› ") + str(part.get("tool", "tool")) +
                                 (": " + str(what).split("\n")[0][:90] if what else ""))
                elif ptype == "text" and not data.get("delta") and part.get("text") and part_kind.get(pid + ":streamed") is None:
                    # a text part that came whole, without deltas (some providers, older opencode)
                    whole = str(part.get("text"))
                    if part.get("time", {}).get("end") and whole != last_text:
                        last_text = whole
                        text(whole)
            elif kind in ("message.part.delta", "session.text.delta"):
                pid = str(data.get("partID", ""))
                if kind == "message.part.delta" and (data.get("field") != "text" or part_kind.get(pid) not in (None, "text")):
                    continue
                delta = data.get("delta", data.get("text", data.get("textDelta", "")))
                if delta:
                    part_kind[pid + ":streamed"] = True
                    text(delta)
            elif kind == "session.tool.input.started":
                tool_names[str(data.get("id", ""))] = str(data.get("name") or "tool")
            elif kind == "session.tool.called":
                inp = data.get("input") or {}
                what = (inp.get("command") or inp.get("path") or inp.get("filePath") or inp.get("pattern") or inp.get("url") or inp.get("query") or "") if isinstance(inp, dict) else ""
                activity("› " + tool_names.get(str(data.get("id", "")), str(data.get("name") or "tool")) +
                         (": " + str(what).split("\n")[0][:90] if what else ""))
            elif kind == "session.tool.failed":
                err = data.get("error") or {}
                if not (isinstance(err, dict) and err.get("type") == "aborted"):
                    activity("✗ " + tool_names.get(str(data.get("id", "")), "tool"))
        if denied and not SAID:
            text("Stopped: you denied " + ", ".join(dict.fromkeys(denied)) + ".")
        return 0
    except SystemExit:
        raise
    except Exception as exc:
        emit({"pawmpt": "error", "text": "opencode: " + str(exc)[:800]})
        return 1
    finally:
        stop.set()
        stop_tree(server)


if __name__ == "__main__":
    sys.exit(main())
