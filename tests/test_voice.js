#!/usr/bin/env node
// Voice tests: Hex is stood in for by a small script. Run: node tests/test_voice.js
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "..");
let failed = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL " + m); failed++; } else console.log("ok   " + m); };
const eq = (a, b, m) => ok(a === b, m + (a === b ? "" : "\n  got:      " + JSON.stringify(a) + "\n  expected: " + JSON.stringify(b)));
const sb = { module: { exports: {} }, console };
vm.runInNewContext(fs.readFileSync(path.join(root, "qml", "js", "Voice.js"), "utf8").replace(/^\s*\.pragma library.*$/m, ""), sb, { filename: "Voice.js" });
const V = sb.module.exports;

// ---- the text and the messages ----
eq(V.clean("  Hello,\n world \u001b[0m  "), "Hello, world", "what was said becomes one tidy line");
eq(V.clean(null), "", "nothing said is empty");
eq(V.clean("x".repeat(9000)).length, 4000, "what was said is limited to 4000 characters");
ok(V.startProblem(127, "").includes("not installed") && V.startProblem(127, "").includes("anoma.ly/hex"), "a missing Hex says where to get it");
ok(V.startProblem(1, "error: hex is not listening\n").endsWith("hex is not listening"), "a start that failed gives Hex's own words");
ok(V.startProblem(1, "").includes("Is it running"), "a start that failed without words gives a hint");
eq(V.stopProblem(0, "hello", ""), null, "text is not a problem");
eq(V.stopProblem(0, "  \n", ""), "I didn't hear anything.", "an empty answer is no speech");
eq(V.stopProblem(4, "", ""), "I didn't hear anything.", "exit 4 is no speech");
ok(V.stopProblem(124, "", "").includes("too long"), "exit 124 is too slow");
ok(V.stopProblem(1, "", "boom").endsWith("boom"), "another failure gives Hex's words");
ok(V.stopProblem(127, "", "").includes("not installed"), "a missing Hex at the stop says so");
eq(V.argv("S", " /my path/hex ")[4], "/my path/hex", "the command is trimmed and kept whole");
eq(V.argv("S", "")[4], "hex", "no command means hex");
eq(V.argv("S", "a\nb")[4], "ab", "a command cannot carry a line break");
eq(V.argv("S", undefined).slice(0, 4).join("|"), "sh|-c|S|pawmpt", "argv starts with sh -c script name");

// ---- the scripts, run for real against a stand-in for hex ----
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pawmpt-voice-"));
const bin = path.join(dir, "bin"); fs.mkdirSync(bin);
const state = path.join(dir, "state");
fs.writeFileSync(path.join(bin, "hex"), `#!/bin/sh
echo "$@" >> "${dir}/calls"
case "$1 $2" in
  "dictation start")
    if [ -f "${dir}/running" ]; then exit 0; fi
    echo "error: Hex is not running" >&2; exit 1 ;;
  "start dictation"|"start ") touch "${dir}/running"; exit 0 ;;
esac
case "$1" in
  start) touch "${dir}/running"; exit 0 ;;
  dictation)
    case "$2" in
      stop) if [ -f "${dir}/silent" ]; then exit 4; fi; if [ -f "${dir}/crash" ]; then echo "model missing" >&2; exit 1; fi; echo "what is the weather"; exit 0 ;;
      cancel) echo cancelled >> "${dir}/calls"; exit 0 ;;
    esac ;;
esac
exit 2
`, { mode: 0o755 });
const run = (script, cmd, env) => spawnSync("sh", V.argv(script, cmd).slice(1), { encoding: "utf8", env: Object.assign({}, process.env, { HOME: dir, PATH: bin + ":" + process.env.PATH }, env || {}) });
const calls = () => fs.existsSync(path.join(dir, "calls")) ? fs.readFileSync(path.join(dir, "calls"), "utf8").trim().split("\n") : [];
const reset = () => { for (const f of ["calls", "running", "silent", "crash"]) fs.rmSync(path.join(dir, f), { force: true }); };

reset();
let r = run(V.startScript(), "hex");
eq(r.status, 0, "start: succeeds, also when Hex was not running (it is started first)");
eq(calls().join(" | "), "dictation start | start | dictation start", "start: tries, starts Hex, tries again");
reset(); fs.writeFileSync(path.join(dir, "running"), "");
r = run(V.startScript(), "hex");
eq(r.status, 0, "start: succeeds at once when Hex runs");
eq(calls().join(" | "), "dictation start", "start: one call when Hex runs");

reset();
r = run(V.stopScript(), "hex");
eq(r.status, 0, "stop: succeeds"); eq(V.clean(r.stdout), "what is the weather", "stop: the words come out on stdout");
eq(calls().join(" | "), "dictation stop --print", "stop: asks for --print");
reset(); fs.writeFileSync(path.join(dir, "silent"), "");
r = run(V.stopScript(), "hex");
eq(r.status, 4, "stop: no speech is exit 4"); eq(V.stopProblem(r.status, r.stdout, r.stderr), "I didn't hear anything.", "stop: no speech gives the message");
reset(); fs.writeFileSync(path.join(dir, "crash"), "");
r = run(V.stopScript(), "hex");
eq(r.status, 1, "stop: a failure is its exit code"); ok(V.stopProblem(r.status, r.stdout, r.stderr).endsWith("model missing"), "stop: a failure gives Hex's words");
reset();
r = run(V.cancelScript(), "hex");
eq(r.status, 0, "cancel: succeeds"); eq(calls()[0], "dictation cancel", "cancel: asks to cancel");

// hex that is not on the PATH: the installer's place is used, else a clear failure
reset();
const bare = fs.mkdtempSync(path.join(os.tmpdir(), "pawmpt-nohex-"));
r = spawnSync("sh", V.argv(V.stopScript(), "hex").slice(1), { encoding: "utf8", env: { HOME: bare, PATH: "/usr/bin:/bin" } });
eq(r.status, 127, "not installed: exit 127"); ok(r.stderr.includes("not installed"), "not installed: says so");
fs.mkdirSync(path.join(bare, ".local", "bin"), { recursive: true });
fs.copyFileSync(path.join(bin, "hex"), path.join(bare, ".local", "bin", "hex")); fs.chmodSync(path.join(bare, ".local", "bin", "hex"), 0o755);
r = spawnSync("sh", V.argv(V.stopScript(), "hex").slice(1), { encoding: "utf8", env: { HOME: bare, PATH: "/usr/bin:/bin" } });
eq(r.status, 0, "~/.local/bin/hex is used when hex is not on the PATH");
// a path with a space and shell characters is passed as one word
const odd = path.join(dir, "my bin; echo hacked"); fs.mkdirSync(odd); fs.copyFileSync(path.join(bin, "hex"), path.join(odd, "hex")); fs.chmodSync(path.join(odd, "hex"), 0o755);
reset();
r = run(V.stopScript(), path.join(odd, "hex"));
eq(r.status, 0, "a command path with spaces and a semicolon still runs"); ok(!r.stdout.includes("hacked"), "and nothing in it is run as a command");

console.log(failed ? "\n" + failed + " failed" : "\nAll good.");
process.exit(failed ? 1 : 0);
