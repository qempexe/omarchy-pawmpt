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
// opencode's rules in Service.qml: a search reads every file under its folder, hidden ones included,
// and opencode checks it apart from reading, so it always goes to the bridge, which checks the folder
const service = fs.readFileSync(path.join(__dirname, "..", "qml", "Service.qml"), "utf8");
const rules = service.slice(service.indexOf("readonly property var opencodeRules"), service.indexOf("readonly property string opencodeConfig"));
ok((rules.match(/grep: "ask"/g) || []).length === 2 && !/grep: "allow"/.test(rules), "opencode: a search asks the bridge, with Let it act off and on");
ok((rules.match(/lsp: "ask"/g) || []).length === 2 && !/lsp: "allow"/.test(rules), "opencode: so does the language server");
// file rules are matched against the path from the project's top folder, so ".ssh/x" must be caught too
const secretList = JSON.parse(service.match(/readonly property var secretFiles: (\[[^\]]*\])/)[1].replace(/\s+/g, " "));
const relative = secretList.filter((f) => f.startsWith("*/")).map((f) => f.slice(2));
ok(relative.length > 5 && /if \(f\.startsWith\("\*\/"\)\) out\.push\(f\.slice\(2\)\)/.test(service) && /for \(const f of secretRules\) read\[f\] = "deny"/.test(service),
    "opencode: key files are kept from reading also by their path from the project's top folder (" + relative.slice(0, 2).join(", ") + ", ...)");
ok(/for \(const f of secretRules\) edit\[f\] = "deny"/.test(service) && (rules.match(/edit: edit/g) || []).length === 2,
    "opencode: and from editing, with Let it act off and on");
const config = service.slice(service.indexOf("readonly property string opencodeConfig"), service.indexOf("readonly property string opencodeConfig") + 600);
ok(["build", "plan", "general", "explore"].every((a) => config.includes(a + ": { permission: opencodeRules }")),
    "opencode: the rules are set for the agents it starts too");
const bridgeSrc = fs.readFileSync(path.join(tools, "opencode_bridge.py"), "utf8");
ok(/action in \("grep", "lsp"\)/.test(bridgeSrc) && bridgeSrc.includes("search_reaches_secret("), "opencode bridge: decides a search by the folder");
ok(bridgeSrc.includes("family") && bridgeSrc.includes("parentID"), "opencode bridge: answers the agents a run starts");
console.log(fails ? fails + " failed" : "All good.");
process.exit(fails ? 1 : 0);
