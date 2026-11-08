#!/usr/bin/env python3
"""Run Claude Code with its MCP permission prompt routed through Pawmpt."""
import json
import os
import queue
import select
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import uuid


def send_line(obj):
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def mcp_server(sock_path):
    def reply(obj):
        sys.stdout.write(json.dumps(obj) + "\n")
        sys.stdout.flush()

    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except Exception:
            continue
        method, ident = msg.get("method"), msg.get("id")
        if method == "initialize":
            reply({"jsonrpc": "2.0", "id": ident, "result": {"protocolVersion": msg.get("params", {}).get("protocolVersion", "2024-11-05"), "capabilities": {"tools": {}}, "serverInfo": {"name": "pawmpt", "version": "1.0"}}})
        elif method == "notifications/initialized":
            continue
        elif method == "tools/list":
            reply({"jsonrpc": "2.0", "id": ident, "result": {"tools": [{"name": "approval", "description": "Ask the user to approve a Claude Code action.", "inputSchema": {"type": "object", "properties": {"tool_name": {"type": "string"}, "input": {"type": "object"}}, "required": ["tool_name", "input"]}}]}})
        elif method == "tools/call":
            args = msg.get("params", {}).get("arguments", {})
            req = {"id": str(uuid.uuid4()), "tool": args.get("tool_name", "action"), "input": args.get("input", {})}
            try:
                with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as conn:
                    conn.connect(sock_path)
                    conn.sendall((json.dumps(req) + "\n").encode())
                    answer = json.loads(conn.makefile("r").readline())
                if answer.get("allow"):
                    value = {"behavior": "allow", "updatedInput": req["input"]}
                else:
                    value = {"behavior": "deny", "message": "The user denied this action in Pawmpt."}
                content = {"content": [{"type": "text", "text": json.dumps(value)}]}
                reply({"jsonrpc": "2.0", "id": ident, "result": content})
            except Exception as exc:
                reply({"jsonrpc": "2.0", "id": ident, "error": {"code": -32000, "message": str(exc)}})
        elif ident is not None:
            reply({"jsonrpc": "2.0", "id": ident, "error": {"code": -32601, "message": "Method not found"}})


def main():
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(SystemExit(143)))
    signal.signal(signal.SIGINT, lambda *_: (_ for _ in ()).throw(SystemExit(130)))
    try:
        request = json.loads(sys.stdin.readline())
        prompt = str(request["prompt"])
    except Exception:
        send_line({"pawmpt": "text", "text": "Pawmpt: invalid bridge request"})
        return 2
    with tempfile.TemporaryDirectory(prefix="pawmpt-claude-") as tmp:
        os.chmod(tmp, 0o700)
        sock_path = os.path.join(tmp, "approval.sock")
        server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        server.bind(sock_path)
        os.chmod(sock_path, 0o600)
        server.listen(8)
        config = os.path.join(tmp, "mcp.json")
        script = os.path.abspath(__file__)
        with open(config, "w", encoding="utf-8") as f:
            json.dump({"mcpServers": {"pawmpt": {"command": sys.executable, "args": [script, "--mcp-server", sock_path]}}}, f)
        events = queue.Queue()
        replies = {}
        reply_lock = threading.Lock()
        stopping = threading.Event()
        allow_all = threading.Event()

        def approvals():
            while not stopping.is_set():
                try:
                    conn, _ = server.accept()
                except OSError:
                    return
                with conn:
                    stream = conn.makefile("rwb")
                    try:
                        req = json.loads(stream.readline())
                        tool = str(req.get("tool", "action"))
                        detail = json.dumps(req.get("input", {}), ensure_ascii=False, indent=2)
                        if not allow_all.is_set():
                            send_line({"pawmpt": "permission", "id": req["id"], "title": "Claude needs permission: " + tool, "detail": detail[:3000]})
                        while not stopping.is_set():
                            with reply_lock:
                                answer = replies.pop(req["id"], None)
                            if answer is not None:
                                break
                            if allow_all.is_set():
                                answer = {"id": req["id"], "allow": True}
                                break
                            stopping.wait(0.1)
                        if answer is None:
                            answer = {"id": req["id"], "allow": False}
                        stream.write((json.dumps(answer) + "\n").encode())
                        stream.flush()
                    except Exception:
                        continue

        threading.Thread(target=approvals, daemon=True).start()
        proc = subprocess.Popen(["claude", "-p", "--permission-prompt-tool", "mcp__pawmpt__approval", "--mcp-config", config],
                                cwd=os.getcwd(), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, text=True, bufsize=1)
        proc.stdin.write(prompt)
        proc.stdin.close()
        def stdout_reader():
            for line in proc.stdout:
                events.put({"pawmpt": "text", "text": line})
        threading.Thread(target=stdout_reader, daemon=True).start()
        def stderr_reader():
            for line in proc.stderr:
                sys.stderr.write(line)
                sys.stderr.flush()
        threading.Thread(target=stderr_reader, daemon=True).start()
        try:
            while proc.poll() is None:
                ready, _, _ = select.select([sys.stdin], [], [], 0.1)
                if ready:
                    line = sys.stdin.readline()
                    if not line:
                        break
                    try:
                        ans = json.loads(line)
                    except Exception:
                        continue
                    if ans.get("pawmpt") == "permission_reply":
                        allow_all_now = ans.get("allowAll") is True and ans.get("allow") is True
                        if allow_all_now:
                            allow_all.set()
                        with reply_lock:
                            if not allow_all_now:
                                replies[ans.get("id")] = {"id": ans.get("id"), "allow": ans.get("allow") is True}
                while True:
                    try:
                        event = events.get_nowait()
                    except queue.Empty:
                        break
                    send_line(event)
            return proc.wait()
        finally:
            stopping.set()
            server.close()
            if proc.poll() is None:
                proc.terminate()


if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "--mcp-server":
    mcp_server(sys.argv[2])
elif __name__ == "__main__":
    sys.exit(main())
