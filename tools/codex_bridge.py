#!/usr/bin/env python3
"""Pawmpt adapter for Codex's bidirectional app-server JSON-RPC protocol."""
import json
import os
import queue
import re
import select
import shutil
import signal
import subprocess
import sys
import threading
import time


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


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
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(SystemExit(143)))
    signal.signal(signal.SIGINT, lambda *_: (_ for _ in ()).throw(SystemExit(130)))
    first = sys.stdin.readline()
    try:
        request = json.loads(first)
        prompt = request["prompt"]
        question = request.get("question", prompt)
    except Exception:
        emit({"pawmpt": "text", "text": "Pawmpt: invalid bridge request"})
        return 2

    child = subprocess.Popen(["codex", "app-server", "--listen", "stdio://"],
                             cwd=os.getcwd(), stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             text=True, bufsize=1)
    incoming = queue.Queue()
    pending = {}

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

    try:
        init_id = send("initialize", {"clientInfo": {"name": "pawmpt", "title": "Pawmpt", "version": "1.0"}})
        ready = False
        thread_id = None
        turn_started = False
        assistant_text = ""
        allow_all = False
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
        thread_req = send("thread/start", {"cwd": os.getcwd(), "approvalPolicy": "on-request",
                                             "sandbox": "workspace-write"})
        while child.poll() is None:
            try:
                msg = incoming.get(timeout=0.1)
            except queue.Empty:
                msg = None
            if msg:
                if msg.get("id") == thread_req and "result" in msg:
                    thread_id = (msg.get("result", {}).get("thread") or {}).get("id")
                    if thread_id:
                        emit({"pawmpt": "session", "id": thread_id})
                        send("turn/start", {"threadId": thread_id, "input": [{"type": "text", "text": prompt}],
                                             "cwd": os.getcwd(), "approvalPolicy": "on-request",
                                             "sandboxPolicy": {"type": "workspaceWrite"}})
                        turn_started = True
                elif isinstance(msg.get("method"), str):
                    method = msg["method"]
                    p = msg.get("params") or {}
                    if method == "item/agentMessage/delta":
                        delta = str(p.get("delta", ""))
                        assistant_text = (assistant_text + delta)[-12000:]
                        emit({"pawmpt": "text", "text": delta})
                    elif method in ("item/commandExecution/requestApproval", "item/fileChange/requestApproval",
                                    "item/permissions/requestApproval"):
                        rid = msg.get("id")
                        req = {"method": method, "params": p}
                        if allow_all:
                            answer_approval(rid, req, True)
                        else:
                            pending[rid] = req
                            detail = p.get("command") or p.get("reason") or p.get("cwd") or "The agent requests permission."
                            emit({"pawmpt": "permission", "id": str(rid), "title": "Codex needs permission", "detail": str(detail), "allowAll": True})
                    elif method == "turn/completed":
                        launch = desktop_launch(question, assistant_text)
                        if launch:
                            app_name, argv = launch
                            pending[host_launch_id] = {"method": "pawmpt/hostLaunch", "app": app_name, "argv": argv}
                            emit({
                                "pawmpt": "permission", "id": host_launch_id,
                                "title": "Open app from desktop session?",
                                "detail": "Codex could not reach the display from its sandbox. Allow once to start " + app_name.title() + " directly in your Omarchy session. Only this app will be started; Codex will not be rerun with broader access.",
                            })
                        else:
                            break
            ready, _, _ = select.select([sys.stdin], [], [], 0)
            if ready:
                line = sys.stdin.readline()
                if not line:
                    break
                try:
                    answer = json.loads(line)
                except Exception:
                    continue
                if answer.get("pawmpt") == "permission_reply":
                    rid = answer.get("id")
                    if rid is not None:
                        try:
                            rid = int(rid)
                        except Exception:
                            pass
                        req = pending.pop(rid, {})
                        if req.get("method") == "pawmpt/hostLaunch":
                            if answer.get("allow"):
                                try:
                                    child_app = subprocess.Popen(
                                        req["argv"], cwd=os.getcwd(), start_new_session=True,
                                        stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                        stderr=subprocess.DEVNULL,
                                    )
                                    time.sleep(0.8)
                                    status = child_app.poll()
                                    if status is not None and status != 0:
                                        emit({"pawmpt": "text", "text": "\n\n" + req["app"].title() + " exited from the desktop session with code " + str(status) + "."})
                                    else:
                                        emit({"pawmpt": "text", "text": "\n\nPawmpt started " + req["app"].title() + " from the desktop session (PID " + str(child_app.pid) + ")."})
                                except Exception as exc:
                                    emit({"pawmpt": "text", "text": "\n\nPawmpt could not start " + req["app"].title() + " from the desktop session: " + str(exc)})
                            else:
                                emit({"pawmpt": "text", "text": "\n\nPawmpt did not start the app."})
                            break
                        elif req.get("method") == "item/permissions/requestApproval":
                            allowed = answer.get("allow") is True
                            if allowed and answer.get("allowAll") is True:
                                allow_all = True
                            answer_approval(rid, req, allowed)
                        else:
                            allowed = answer.get("allow") is True
                            if allowed and answer.get("allowAll") is True:
                                allow_all = True
                            answer_approval(rid, req, allowed)
            if not turn_started and msg and msg.get("error"):
                emit({"pawmpt": "text", "text": "Codex app-server: " + str(msg["error"].get("message", "startup failed"))})
                break
        if child.poll() is None:
            child.terminate()
        return child.wait(timeout=3)
    finally:
        if child.poll() is None:
            child.terminate()


if __name__ == "__main__":
    sys.exit(main())
