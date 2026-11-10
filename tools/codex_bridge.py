#!/usr/bin/env python3
"""Run Codex with its approval requests answered in Pawmpt.

Pawmpt writes one request line on stdin, then permission replies (see AGENT_APPROVAL_PROTOCOL.md).
Codex runs as `codex app-server`, in a read-only sandbox that also can't read the files that hold
keys and passwords: whatever needs more than that is asked for, and shown in Pawmpt.
"""
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import time

from bridge_common import (Replies, clip, emit, mentions_secret, on_signals, read_request, secret_patterns,
                           spawn, stop_tree)


def permission_profile(patterns, home):
    """A Codex permissions profile: read-only, and no reading of the key and password files at
    all, not by a command either. Paths under your home are named outright, the rest as patterns
    under the work folder."""
    filesystem = {}
    project = {}
    for pattern in patterns:
        if pattern.startswith("*/") and "*" not in pattern[2:].rstrip("*").rstrip("/"):
            # "*/.ssh/*" and "*/.netrc": the one in your home
            path = os.path.join(home, pattern[2:].rstrip("*").rstrip("/"))
            if os.path.exists(path):
                filesystem[path] = "none"
        if pattern.startswith("*/"):
            project["**/" + pattern[2:]] = "none"
        elif pattern.startswith("*"):
            project["**/" + pattern] = "none"
    if project:
        filesystem[":project_roots"] = project
    filesystem["glob_scan_max_depth"] = 4
    return {"default_permissions": "pawmpt",
            "permissions": {"pawmpt": {"extends": ":read-only", "filesystem": filesystem}}}


def desktop_launch(question, answer):
    """Return one allowlisted app command after Codex reports a display/sandbox failure."""
    question = str(question or "").lower()
    answer = str(answer or "").lower().replace("’", "'").replace("‘", "'")
    if not re.match(r"^(?:(?:please\s+)?(?:open|launch|start)\b|(?:(?:could|can|would) you\s+)(?:please\s+)?(?:open|launch|start)\b|(?:i want|i need|i'd like) you to\s+(?:open|launch|start)\b)", question):
        return None
    if not re.search(r"(failed to open display|couldn't connect to a display|cannot open display|can't open display|wayland.{0,80}(blocked|denied|unavailable|could not connect|couldn't connect)|crashpad.{0,100}(permission|not permitted|status 133))", answer):
        return None
    apps = {
        "strata": ["strata"], "brave": ["brave"], "brave-browser": ["brave"],
        "firefox": ["firefox"], "chromium": ["chromium"], "foot": ["foot"],
        "glances": ["omarchy-launch-tui", "glances"],
    }
    match = re.search(r"\b(?:open|launch|start|run)\s+(?:the\s+)?(strata|brave-browser|brave|firefox|chromium|foot|glances)\b", question)
    if not match:
        return None
    argv = apps[match.group(1)]
    return (match.group(1), argv) if shutil.which(argv[0]) else None


def main():
    on_signals()
    try:
        request = read_request()
        prompt = request["prompt"]
        question = request.get("question", prompt)
    except Exception:
        emit({"pawmpt": "text", "text": "Pawmpt: the request to the Codex bridge could not be read."})
        return 2
    patterns = secret_patterns(request)
    cwd = os.getcwd()

    try:
        child = spawn(["codex", "app-server", "--listen", "stdio://"],
                      cwd=cwd, stdin=subprocess.PIPE,
                      stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                      text=True, bufsize=1)
    except FileNotFoundError:
        emit({"pawmpt": "text", "text": "Codex is not installed, or not on the PATH. Install it, or pick another agent in Settings › Agent."})
        return 127
    incoming = queue.Queue()
    pending = {}             # request id -> (id as Codex gave it, the request, names a key file)
    denied = []

    def reader():
        for raw in child.stdout:
            try:
                incoming.put(json.loads(raw))
            except Exception:
                continue

    threading.Thread(target=reader, daemon=True).start()
    def error_reader():
        for line in child.stderr:
            sys.stderr.write(line)
            sys.stderr.flush()
    threading.Thread(target=error_reader, daemon=True).start()
    counter = 0

    def send(method, params=None, ident=None):
        nonlocal counter
        if ident is None:
            counter += 1
            ident = counter
        child.stdin.write(json.dumps({"id": ident, "method": method, "params": params or {}}) + "\n")
        child.stdin.flush()
        return ident

    def notify(method, params=None):
        child.stdin.write(json.dumps({"method": method, "params": params or {}}) + "\n")
        child.stdin.flush()

    def answer_approval(rid, req, allow):
        if req.get("method") == "item/permissions/requestApproval":
            result = {"permissions": req.get("params", {}).get("permissions", {}) if allow else {}, "scope": "turn"}
        else:
            result = {"decision": "accept" if allow else "decline"}
        child.stdin.write(json.dumps({"id": rid, "result": result}) + "\n")
        child.stdin.flush()

    def describe(method, p):
        """(detail, names a key file) for one approval request."""
        command = p.get("command")
        if isinstance(command, list):
            command = " ".join(str(c) for c in command)
        lines = []
        if command:
            lines.append(str(command))
        if p.get("reason"):
            lines.append("# " + str(p["reason"]))
        if method == "item/permissions/requestApproval" and p.get("permissions"):
            lines.append(json.dumps(p["permissions"], ensure_ascii=False, indent=2))
        if method == "item/fileChange/requestApproval" and p.get("grantRoot"):
            lines.append("Write access to: " + str(p["grantRoot"]))
        if p.get("cwd") and command:
            lines.append("in " + str(p["cwd"]))
        detail = "\n".join(lines) or "Codex asks for permission."
        risky = mentions_secret(detail, patterns, cwd)
        if risky:
            detail = "This names a file that holds keys or passwords.\n" + detail
        return detail, risky

    replies = Replies()
    try:
        init_id = send("initialize", {"clientInfo": {"name": "pawmpt", "title": "Pawmpt", "version": "1.0"}})
        thread_id = None
        turn_started = False
        assistant_text = ""
        allow_all = False
        legacy = False           # a Codex without permission profiles: read-only sandbox only
        said = False
        host_launch_id = "pawmpt-host-desktop-launch"
        while child.poll() is None:
            try:
                msg = incoming.get(timeout=0.2)
            except queue.Empty:
                continue
            if msg.get("id") == init_id:
                if "error" in msg:
                    emit({"pawmpt": "text", "text": "Codex app-server: " + str(msg["error"].get("message", "initialization failed"))})
                    return 1
                break
        notify("initialized")
        # Read-only, so editing files and running commands that change things ask first, through
        # the approval requests below; and the key and password files can't be read at all.
        thread_req = send("thread/start", {"cwd": cwd, "approvalPolicy": "on-request",
                                             "config": permission_profile(patterns, os.path.expanduser("~"))})
        ending = False
        completed = False
        while child.poll() is None and not ending:
            try:
                msg = incoming.get(timeout=0.1)
            except queue.Empty:
                msg = None
            if msg:
                if msg.get("id") == thread_req and "error" in msg and not legacy:
                    # an older Codex that doesn't know permission profiles: its read-only sandbox
                    legacy = True
                    emit({"pawmpt": "activity", "text": "This Codex is too old to keep key files from its commands; update it"})
                    thread_req = send("thread/start", {"cwd": cwd, "approvalPolicy": "on-request", "sandbox": "read-only"})
                elif msg.get("id") == thread_req and "error" in msg:
                    err = msg["error"]
                    emit({"pawmpt": "error", "text": "Codex: " + str(err.get("message") if isinstance(err, dict) else err)[:800]})
                    break
                elif msg.get("id") == thread_req and "result" in msg:
                    thread_id = (msg.get("result", {}).get("thread") or {}).get("id")
                    if thread_id:
                        emit({"pawmpt": "session", "id": thread_id})
                        turn = {"threadId": thread_id, "input": [{"type": "text", "text": prompt}],
                                "cwd": cwd, "approvalPolicy": "on-request"}
                        if legacy:
                            turn["sandboxPolicy"] = {"type": "readOnly"}
                        send("turn/start", turn)
                        turn_started = True
                elif isinstance(msg.get("method"), str):
                    method = msg["method"]
                    p = msg.get("params") or {}
                    if not isinstance(p, dict):
                        p = {}
                    if method == "item/agentMessage/delta":
                        delta = str(p.get("delta", ""))
                        assistant_text = (assistant_text + delta)[-12000:]
                        if delta:
                            said = True
                            emit({"pawmpt": "text", "text": delta})
                    elif method in ("item/commandExecution/requestApproval", "item/fileChange/requestApproval",
                                    "item/permissions/requestApproval"):
                        rid = msg.get("id")
                        req = {"method": method, "params": p}
                        detail, risky = describe(method, p)
                        # a request that names a key file is always asked on its own
                        if allow_all and not risky:
                            answer_approval(rid, req, True)
                        else:
                            pending[str(rid)] = (rid, req, risky)
                            what = {"item/commandExecution/requestApproval": "run a command",
                                    "item/fileChange/requestApproval": "change files"}.get(method, "have more access")
                            emit({"pawmpt": "permission", "id": str(rid), "title": "Codex wants to " + what,
                                  "detail": clip(detail), "allowAll": not risky})
                    elif method == "item/started":
                        item = p.get("item") if isinstance(p.get("item"), dict) else {}
                        if item.get("type") == "commandExecution" and item.get("command"):
                            command = item["command"]
                            if isinstance(command, list):
                                command = " ".join(str(c) for c in command)
                            emit({"pawmpt": "activity", "text": ("› shell: " + str(command).split("\n")[0])[:120]})
                        elif item.get("type") in ("fileChange", "webSearch", "mcpToolCall"):
                            emit({"pawmpt": "activity", "text": "› " + str(item.get("type"))})
                    elif method == "thread/tokenUsage/updated":
                        total = ((p.get("tokenUsage") or {}).get("total") or {}) if isinstance(p.get("tokenUsage"), dict) else {}
                        tokens = int(total.get("totalTokens") or 0) if isinstance(total, dict) else 0
                        if tokens > 0:
                            emit({"pawmpt": "usage", "tokens": tokens, "cost": 0})
                    elif method == "error" and not p.get("willRetry"):
                        err = p.get("error") or {}
                        emit({"pawmpt": "error", "text": str(err.get("message") if isinstance(err, dict) else err)[:800]})
                    elif "id" in msg:
                        # a request Pawmpt has no answer for (a question back to you, an MCP form): turn it
                        # down, so the run goes on instead of waiting for a reply that never comes
                        child.stdin.write(json.dumps({"id": msg["id"], "error": {"code": -32601, "message": "Pawmpt can't answer " + method}}) + "\n")
                        child.stdin.flush()
                    elif method == "turn/completed":
                        turn = p.get("turn") or {}
                        if turn.get("status") == "failed":
                            terr = turn.get("error") or {}
                            emit({"pawmpt": "error", "text": str(terr.get("message") if isinstance(terr, dict) else terr or "Codex stopped with an error.")[:800]})
                        launch = desktop_launch(question, assistant_text)
                        if launch:
                            app_name, argv = launch
                            pending[host_launch_id] = (host_launch_id, {"method": "pawmpt/hostLaunch", "app": app_name, "argv": argv}, True)
                            emit({
                                "pawmpt": "permission", "id": host_launch_id,
                                "title": "Open app from desktop session?",
                                "detail": "Codex could not reach the display from its sandbox. Allow once to start " + app_name.title() + " directly in your Omarchy session. Only this app will be started; Codex will not be rerun with broader access.",
                            })
                        else:
                            completed = True
                            break
                if not turn_started and msg.get("error") and msg.get("id") != thread_req:
                    emit({"pawmpt": "text", "text": "Codex app-server: " + str(msg["error"].get("message", "startup failed"))})
                    break
            # every reply that has come in, in order: two clicks in a row are two lines
            while True:
                try:
                    answer = replies.get(timeout=0)
                except EOFError:
                    return 143   # Pawmpt went away: stop Codex too
                if answer is None:
                    break
                if answer.get("pawmpt") != "permission_reply":
                    continue
                entry = pending.pop(str(answer.get("id", "")), None)
                if entry is None:
                    continue     # not something that was asked, or answered already
                rid, req, _risky = entry
                allowed = answer.get("allow") is True
                if req.get("method") == "pawmpt/hostLaunch":
                    if allowed:
                        try:
                            child_app = subprocess.Popen(
                                req["argv"], cwd=cwd, start_new_session=True,
                                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                            )
                            time.sleep(0.8)
                            status = child_app.poll()
                            if status is not None and status != 0:
                                emit({"pawmpt": "text", "text": "\n\n" + req["app"].title() + " exited from the desktop session with code " + str(status) + "."})
                            else:
                                emit({"pawmpt": "text", "text": "\n\nPawmpt started " + req["app"].title() + " from the desktop session."})
                        except Exception as exc:
                            emit({"pawmpt": "text", "text": "\n\nPawmpt could not start " + req["app"].title() + " from the desktop session: " + str(exc)[:200]})
                    else:
                        emit({"pawmpt": "text", "text": "\n\nPawmpt did not start the app."})
                    ending = completed = True
                    break
                if allowed and answer.get("allowAll") is True:
                    allow_all = True
                    # and the ones already waiting, except those that name a key file
                    for key in [k for k, (_r, _q, risky) in pending.items() if not risky and k != host_launch_id]:
                        other_rid, other_req, _ = pending.pop(key)
                        answer_approval(other_rid, other_req, True)
                if not allowed:
                    denied.append("that")
                answer_approval(rid, req, allowed)
        if not completed and child.poll() is not None:
            emit({"pawmpt": "error", "text": "Codex stopped before it answered (exit code %s)." % child.poll()})
            return 1
        if denied and not said:
            emit({"pawmpt": "text", "text": "Stopped: you denied what Codex asked for."})
        return 0
    finally:
        stop_tree(child)


if __name__ == "__main__":
    sys.exit(main())
