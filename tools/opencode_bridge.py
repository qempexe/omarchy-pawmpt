#!/usr/bin/env python3
"""Drive OpenCode through its local API and forward permission requests to Pawmpt."""
import json
import base64
import os
import queue
import secrets
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import urllib.parse


def emit(obj):
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def main():
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(SystemExit(143)))
    signal.signal(signal.SIGINT, lambda *_: (_ for _ in ()).throw(SystemExit(130)))
    try:
        request = json.loads(sys.stdin.readline())
        prompt = str(request["prompt"])
        previous = str(request.get("session", ""))
        if previous and not previous.startswith("ses_"):
            previous = ""
        model = str(request.get("model", ""))
        agent = str(request.get("agent", "build"))
        variant = str(request.get("variant", ""))
    except Exception:
        emit({"pawmpt": "text", "text": "Pawmpt: invalid OpenCode bridge request"})
        return 2

    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    base = "http://127.0.0.1:" + str(port)
    server_password = secrets.token_urlsafe(32)
    server_env = os.environ.copy()
    # OpenCode 2.1.x currently authenticates its local API as the fixed user `opencode`.
    server_env["OPENCODE_SERVER_USERNAME"] = "opencode"
    server_env["OPENCODE_SERVER_PASSWORD"] = server_password
    server_auth = base64.b64encode(("opencode:" + server_password).encode()).decode("ascii")
    server = subprocess.Popen(["opencode", "serve", "--hostname", "127.0.0.1", "--port", str(port)],
                              cwd=os.getcwd(), env=server_env,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def api(method, path, body=None, timeout=30):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json", "Authorization": "Basic " + server_auth})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                content = res.read()
                return json.loads(content) if content else None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace").strip()
            raise RuntimeError("OpenCode API " + method + " " + path + " returned HTTP " +
                               str(exc.code) + ": " + (detail[:800] or str(exc.reason))) from exc

    events = queue.Queue()
    stop = threading.Event()
    session_id = previous

    def event_reader():
        while not stop.is_set():
            try:
                req = urllib.request.Request(base + "/api/event", headers={"Authorization": "Basic " + server_auth})
                with urllib.request.urlopen(req, timeout=120) as res:
                    data = ""
                    for raw in res:
                        if stop.is_set():
                            return
                        line = raw.decode("utf-8", "replace").rstrip("\r\n")
                        if line.startswith("data:"):
                            data = line[5:].strip()
                        elif line == "" and data:
                            try:
                                events.put(json.loads(data))
                            except Exception:
                                pass
                            data = ""
            except Exception:
                if not stop.wait(0.5):
                    continue

    try:
        startup_error = None
        for _ in range(100):
            if server.poll() is not None:
                emit({"pawmpt": "text", "text": "OpenCode server stopped during startup." +
                      (" Last health check: " + str(startup_error) if startup_error else "")})
                return 1
            try:
                api("GET", "/api/info", timeout=1)
                break
            except Exception as exc:
                startup_error = exc
                time.sleep(0.1)
        else:
            emit({"pawmpt": "text", "text": "OpenCode server did not become ready." +
                  (" Health check: " + str(startup_error)[:400] if startup_error else "")})
            return 1
        threading.Thread(target=event_reader, daemon=True).start()
        new_session = not session_id
        if new_session:
            create_body = {"title": "Pawmpt", "agent": agent}
            if model and "/" in model:
                provider, model_id = model.split("/", 1)
                create_body["model"] = {"providerID": provider, "id": model_id}
                if variant:
                    create_body["model"]["variant"] = variant
            created = api("POST", "/api/session", create_body)
            session_data = created.get("data", created) if isinstance(created, dict) else {}
            session_id = str(session_data.get("id", ""))
        if not session_id:
            raise RuntimeError("OpenCode did not return a session id")
        emit({"pawmpt": "session", "id": session_id})
        payload = {"text": prompt}
        safe_session = urllib.parse.quote(session_id, safe="")
        # New sessions get their agent and model in the create request. Only update a
        # resumed session here; setting them twice can be rejected by current OpenCode.
        if not new_session:
            api("POST", "/api/session/" + safe_session + "/agent", {"agent": agent})
        if not new_session and model and "/" in model:
            provider, model_id = model.split("/", 1)
            selected = {"providerID": provider, "id": model_id}
            if variant:
                selected["variant"] = variant
            api("POST", "/api/session/" + safe_session + "/model", {"model": selected})
        prompt_path = "/api/session/" + safe_session + "/prompt"
        prompt_error = []
        def post_prompt():
            try:
                api("POST", prompt_path, payload, 3600)
            except Exception as exc:
                prompt_error.append(exc)
        prompt_thread = threading.Thread(target=post_prompt, daemon=True)
        prompt_thread.start()
        execution_started = False
        idle_seen = False
        prompt_finished_at = None
        while not stop.is_set():
            if not prompt_thread.is_alive() and prompt_finished_at is None:
                prompt_finished_at = time.monotonic()
            if idle_seen or (prompt_finished_at is not None and prompt_error):
                break
            import select
            if select.select([sys.stdin], [], [], 0)[0]:
                line = sys.stdin.readline()
                try:
                    answer = json.loads(line)
                except Exception:
                    answer = {}
                if answer.get("pawmpt") == "permission_reply":
                    decision = "once" if answer.get("allow") else "reject"
                    permission_id = urllib.parse.quote(str(answer.get("id", "")), safe="")
                    api("POST", "/api/session/" + safe_session + "/permission/" + permission_id + "/reply",
                        {"decision": decision})
            try:
                event = events.get(timeout=0.1)
            except queue.Empty:
                continue
            if isinstance(event.get("payload"), dict):
                event = event["payload"]
            kind = event.get("type", "")
            data = event.get("properties", event.get("data", {})) or {}
            event_session = str(data.get("sessionID", session_id))
            if event_session != session_id:
                continue
            status = data.get("status", {}) or {}
            if kind == "session.execution.started":
                execution_started = True
                continue
            if execution_started and (kind == "session.idle" or
                                      (kind == "session.status" and status.get("type") == "idle")):
                idle_seen = True
                continue
            if kind == "permission.asked":
                raw_perm = data.get("permission", data)
                perm = raw_perm if isinstance(raw_perm, dict) else {}
                action = perm.get("action", raw_perm if isinstance(raw_perm, str) else "action")
                rid = str(perm.get("id", data.get("id", "")))
                if rid:
                    resources = perm.get("resources", data.get("patterns", [])) or []
                    tool = data.get("tool", {}) or {}
                    metadata = data.get("metadata", {}) or {}
                    detail = ", ".join(str(x) for x in resources) or json.dumps(metadata or tool, ensure_ascii=False)
                    emit({"pawmpt": "permission", "id": rid, "title": "OpenCode needs permission: " + str(action), "detail": detail[:3000]})
            elif kind in ("message.part.delta", "session.text.delta"):
                delta = data.get("delta", data.get("text", data.get("textDelta", "")))
                if kind == "message.part.delta" and data.get("field") != "text":
                    delta = ""
                if delta:
                    emit({"pawmpt": "text", "text": str(delta)})
            elif kind == "message.part.updated":
                part = data.get("part", {}) or {}
                if part.get("type") == "tool":
                    state = part.get("state", {}) or {}
                    tool = part.get("tool", "Agent action")
                    inp = state.get("input", {}) or {}
                    summary = state.get("title") or inp.get("command") or inp.get("filePath") or inp.get("path") or ""
                    if state.get("status") == "running":
                        emit({"pawmpt": "text", "text": "\n› " + str(tool) + (": " + str(summary) if summary else "") + "\n"})
            elif kind in ("session.tool.called", "session.tool.progress"):
                tool = data.get("tool", data.get("title", "Agent action"))
                emit({"pawmpt": "text", "text": "\n› " + str(tool) + "\n"})
            elif kind in ("session.execution.failed", "session.step.failed", "session.error"):
                message = data.get("message") or data.get("error") or "OpenCode run failed."
                if isinstance(message, dict):
                    message = message.get("message", message.get("name", str(message)))
                emit({"pawmpt": "text", "text": "\n" + str(message)})
                if execution_started and kind in ("session.execution.failed", "session.error"):
                    idle_seen = True
            elif execution_started and kind in ("session.execution.succeeded", "session.execution.interrupted"):
                idle_seen = True
        prompt_thread.join(timeout=2)
        if prompt_error:
            raise RuntimeError(str(prompt_error[0]))
        return 0
    except Exception as exc:
        emit({"pawmpt": "text", "text": "OpenCode adapter: " + str(exc)[:800]})
        return 1
    finally:
        stop.set()
        server.terminate()
        try:
            server.wait(timeout=2)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    sys.exit(main())
