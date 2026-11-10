#!/usr/bin/env python3
"""Run Claude Code with its permission prompts answered in Pawmpt.

Pawmpt writes one request line on stdin, then permission replies (see AGENT_APPROVAL_PROTOCOL.md).
Claude Code is started with `--permission-prompt-tool`, pointing at a tiny MCP server (this same
file, with --mcp-server) that passes each request to this bridge over a private socket. The bridge
shows it in Pawmpt and sends the answer back. Files that hold keys and passwords are denied
outright, by deny rules for Claude's own reading and again here for everything it asks about.
"""
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import uuid

from bridge_common import (Replies, clip, emit, is_secret_path, mentions_secret, on_signals, read_request,
                           secret_patterns, spawn, stop_tree)

PATH_KEYS = ("file_path", "path", "notebook_path")
KEPT_OUT = "Pawmpt keeps files with keys and passwords out of reach."


def mcp_server(sock_path):
    """The MCP server Claude Code talks to: one tool, `approval`, answered by the bridge."""
    def reply(obj):
        sys.stdout.write(json.dumps(obj) + "\n")
        sys.stdout.flush()

    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        if not isinstance(msg, dict):
            continue
        method, ident = msg.get("method"), msg.get("id")
        if method == "initialize":
            reply({"jsonrpc": "2.0", "id": ident, "result": {
                "protocolVersion": (msg.get("params") or {}).get("protocolVersion", "2024-11-05"),
                "capabilities": {"tools": {}}, "serverInfo": {"name": "pawmpt", "version": "1.0"}}})
        elif method == "notifications/initialized":
            continue
        elif method == "tools/list":
            reply({"jsonrpc": "2.0", "id": ident, "result": {"tools": [{
                "name": "approval", "description": "Ask the user to approve a Claude Code action.",
                "inputSchema": {"type": "object", "properties": {"tool_name": {"type": "string"}, "input": {"type": "object"}},
                                "required": ["tool_name", "input"]}}]}})
        elif method == "tools/call":
            args = (msg.get("params") or {}).get("arguments") or {}
            given = args.get("input") if isinstance(args.get("input"), dict) else {}
            req = {"id": str(uuid.uuid4()), "tool": str(args.get("tool_name", "action")), "input": given}
            # anything that goes wrong on the way is a no
            value = {"behavior": "deny", "message": "Pawmpt could not ask you, so this was not allowed."}
            try:
                with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as conn:
                    conn.connect(sock_path)
                    conn.sendall((json.dumps(req) + "\n").encode())
                    answer = json.loads(conn.makefile("r").readline())
                if isinstance(answer, dict) and answer.get("allow") is True:
                    value = {"behavior": "allow", "updatedInput": given}
                elif isinstance(answer, dict):
                    value = {"behavior": "deny", "message": str(answer.get("message") or "The user denied this action in Pawmpt.")}
            except Exception:
                pass
            reply({"jsonrpc": "2.0", "id": ident, "result": {"content": [{"type": "text", "text": json.dumps(value)}]}})
        elif ident is not None:
            reply({"jsonrpc": "2.0", "id": ident, "error": {"code": -32601, "message": "Method not found"}})


def deny_rules(patterns):
    """Pawmpt's key and password patterns as Claude Code deny rules, so it can't read them
    without asking either: `**/…` for the work folder, `//**/…` for anywhere else."""
    rules = []
    for pattern in patterns:
        rest = pattern[2:] if pattern.startswith("*/") else pattern
        if rest.endswith("/*"):
            rest = rest[:-2] + "/**"
        if "(" in rest or ")" in rest or not rest:
            continue
        for tool in ("Read", "Edit"):
            rules.append("%s(**/%s)" % (tool, rest))
            rules.append("%s(//**/%s)" % (tool, rest))
    return rules


def describe(tool, given):
    """What a request is, for the card: a command as it is, anything else as its fields."""
    if isinstance(given.get("command"), str):
        lines = [given["command"]]
        if given.get("description"):
            lines.append("# " + str(given["description"]))
        return "\n".join(lines)
    for key in PATH_KEYS:
        if isinstance(given.get(key), str):
            rest = {k: v for k, v in given.items() if k != key}
            return given[key] + ("\n" + json.dumps(rest, ensure_ascii=False, indent=2) if rest else "")
    return json.dumps(given, ensure_ascii=False, indent=2)


def main():
    on_signals()
    try:
        request = read_request()
        prompt = request["prompt"]
    except Exception:
        emit({"pawmpt": "text", "text": "Pawmpt: the request to the Claude bridge could not be read."})
        return 2
    patterns = secret_patterns(request)
    cwd = os.getcwd()

    with tempfile.TemporaryDirectory(prefix="pawmpt-claude-") as tmp:
        os.chmod(tmp, 0o700)
        sock_path = os.path.join(tmp, "approval.sock")
        server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        server.bind(sock_path)
        os.chmod(sock_path, 0o600)
        server.listen(16)
        config = os.path.join(tmp, "mcp.json")
        with open(config, "w", encoding="utf-8") as f:
            json.dump({"mcpServers": {"pawmpt": {"command": sys.executable,
                                                 "args": [os.path.abspath(__file__), "--mcp-server", sock_path]}}}, f)
        settings = json.dumps({"permissions": {"deny": deny_rules(patterns)}})

        answers = {}                     # request id -> True / False, once you clicked
        waiting = {}                     # request id -> Event
        lock = threading.Lock()
        stopping = threading.Event()
        allow_all = threading.Event()
        denied = []

        def decide(req):
            """(allow, message) for one request from Claude Code."""
            tool = str(req.get("tool", "action"))[:80]
            given = req.get("input") if isinstance(req.get("input"), dict) else {}
            for key in PATH_KEYS:
                if is_secret_path(given.get(key), patterns, cwd):
                    emit({"pawmpt": "activity", "text": "✗ " + tool + ": a key or password file, not allowed"})
                    return False, KEPT_OUT
            risky = any(mentions_secret(v, patterns, cwd) for v in given.values() if isinstance(v, str))
            if allow_all.is_set() and not risky:
                return True, ""
            ident = str(req.get("id") or uuid.uuid4())
            event = threading.Event()
            with lock:
                waiting[ident] = event
            detail = describe(tool, given)
            if risky:
                detail = "This names a file that holds keys or passwords.\n" + detail
            # a request that names a key file is always asked on its own, never part of Allow all
            emit({"pawmpt": "permission", "id": ident, "title": "Claude wants to use " + tool,
                  "detail": clip(detail), "allowAll": not risky})
            while not stopping.is_set():
                if event.wait(0.1):
                    break
                if allow_all.is_set() and not risky:
                    return True, ""
            with lock:
                waiting.pop(ident, None)
                allowed = answers.pop(ident, False)
            if not allowed:
                denied.append(tool)
            return allowed, ""

        def handle(conn):
            with conn:
                try:
                    conn.settimeout(None)
                    stream = conn.makefile("rwb")
                    req = json.loads(stream.readline())
                    allowed, message = decide(req if isinstance(req, dict) else {})
                    stream.write((json.dumps({"allow": allowed, "message": message}) + "\n").encode())
                    stream.flush()
                except Exception:
                    pass

        def approvals():
            while not stopping.is_set():
                try:
                    conn, _ = server.accept()
                except OSError:
                    return
                threading.Thread(target=handle, args=(conn,), daemon=True).start()

        try:
            proc = spawn(["claude", "-p", "--output-format", "stream-json", "--verbose",
                          "--permission-prompt-tool", "mcp__pawmpt__approval", "--mcp-config", config,
                          "--settings", settings],
                         cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                         text=True, bufsize=1)
        except FileNotFoundError:
            server.close()
            emit({"pawmpt": "text", "text": "Claude Code is not installed, or not on the PATH. Install it, or pick another agent in Settings › Agent."})
            return 127
        threading.Thread(target=approvals, daemon=True).start()
        replies = Replies()
        said = []
        last_error = []

        def stdout_reader():
            for line in proc.stdout:
                try:
                    event = json.loads(line)
                except ValueError:
                    event = None
                if not isinstance(event, dict):
                    if line.strip():
                        said.append(True)
                        emit({"pawmpt": "text", "text": line})
                    continue
                kind = event.get("type")
                if kind == "assistant":
                    for part in (event.get("message") or {}).get("content") or []:
                        if not isinstance(part, dict):
                            continue
                        if part.get("type") == "text" and part.get("text"):
                            emit({"pawmpt": "text", "text": ("\n\n" if said else "") + str(part["text"])})
                            said.append(True)
                        elif part.get("type") == "tool_use":
                            given = part.get("input") if isinstance(part.get("input"), dict) else {}
                            what = given.get("command") or given.get("file_path") or given.get("path") or given.get("pattern") or given.get("url") or given.get("query") or ""
                            emit({"pawmpt": "activity", "text": ("› " + str(part.get("name", "tool")) +
                                                                 (": " + str(what).split("\n")[0][:90] if what else ""))[:200]})
                elif kind == "result":
                    if not said and isinstance(event.get("result"), str) and event["result"].strip():
                        said.append(True)
                        emit({"pawmpt": "text", "text": event["result"]})
                    usage = event.get("usage") or {}
                    tokens = sum(int(usage.get(k) or 0) for k in ("input_tokens", "output_tokens")) if isinstance(usage, dict) else 0
                    if tokens > 0:
                        emit({"pawmpt": "usage", "tokens": tokens, "cost": float(event.get("total_cost_usd") or 0)})
                    if event.get("is_error") and not said:
                        last_error.append(str(event.get("result") or event.get("subtype") or "Claude Code stopped with an error.")[:800])

        def stderr_reader():
            for line in proc.stderr:
                sys.stderr.write(line[:2000])
                sys.stderr.flush()

        reader = threading.Thread(target=stdout_reader, daemon=True)
        reader.start()
        threading.Thread(target=stderr_reader, daemon=True).start()
        try:
            try:
                proc.stdin.write(prompt)
                proc.stdin.close()
            except OSError:
                pass
            while proc.poll() is None:
                try:
                    answer = replies.get(timeout=0.1)
                except EOFError:
                    return 143           # Pawmpt went away: stop Claude Code too
                if not answer or answer.get("pawmpt") != "permission_reply":
                    continue
                ident = str(answer.get("id", ""))
                allowed = answer.get("allow") is True
                with lock:
                    event = waiting.get(ident)
                    if event is None:
                        continue         # not something that was asked, or answered already
                    answers[ident] = allowed
                if allowed and answer.get("allowAll") is True:
                    allow_all.set()
                event.set()
            code = proc.wait()
            reader.join(timeout=2)
            if last_error:
                emit({"pawmpt": "error", "text": last_error[0]})
            elif denied and not said:
                emit({"pawmpt": "text", "text": "Stopped: you denied " + ", ".join(dict.fromkeys(denied)) + "."})
            return code
        finally:
            stopping.set()
            try:
                server.close()
            except OSError:
                pass
            stop_tree(proc)


if __name__ == "__main__" and len(sys.argv) > 2 and sys.argv[1] == "--mcp-server":
    mcp_server(sys.argv[2])
elif __name__ == "__main__":
    sys.exit(main())
