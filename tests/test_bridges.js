// node tests/test_bridges.js: the agent bridges in tools/ (python3), without the agents themselves
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");
let fails = 0;
const ok = (c, m) => { if (c) console.log("ok   " + m); else { fails++; console.log("FAIL " + m); } };
const tools = path.join(__dirname, "..", "tools");
const empty = fs.mkdtempSync(path.join(os.tmpdir(), "pawmpt-nobin-"));
const py = ["/usr/bin/python3", "/bin/python3"].find((p) => fs.existsSync(p)) || "python3";
const run = (bridge, input) => spawnSync(py, [path.join(tools, bridge)], { input, encoding: "utf8", timeout: 20000, env: { PATH: empty, HOME: empty } });
for (const [bridge, name] of [["opencode_bridge.py", "opencode"], ["claude_bridge.py", "Claude Code"], ["codex_bridge.py", "Codex"]]) {
    let r = run(bridge, JSON.stringify({ pawmpt: "request", prompt: "hi" }) + "\n");
    const lines = String(r.stdout).trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } });
    ok(r.status === 127, bridge + ": a missing " + name + " is exit 127 (" + r.status + ")");
    ok(lines.length > 0 && lines.every((e) => e && e.pawmpt === "text"), bridge + ": everything it prints is a Pawmpt event");
    ok(lines.some((e) => e && e.text.includes("not installed")), bridge + ": and it says " + name + " is not installed");
    ok(!String(r.stderr).includes("Traceback"), bridge + ": no traceback");
    r = run(bridge, "not json\n");
    ok(r.status === 2 && !String(r.stderr).includes("Traceback"), bridge + ": a request it can't read is exit 2, without a traceback");
}
console.log(fails ? fails + " failed" : "All good.");
process.exit(fails ? 1 : 0);
