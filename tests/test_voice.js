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
// A stand-in for Hex. Files in the folder set what it is like: "running" (Hex runs), "rec" (it records),
// "new" (Hex 3.3: no cancel, a usage error), "noprint" (too old for --print), "silent", "crash".
fs.writeFileSync(path.join(bin, "hex"), `#!/bin/sh
d="${dir}"
echo "$@" >> "$d/calls"
case "$1 $2" in
  "status --json")
    [ -f "$d/running" ] || { echo "hex: Hex isn't running" >&2; exit 3; }
    if [ -f "$d/rec" ]; then echo '{"version":4,"capture":{"state":"recording","recording":"dictation"}}'
    else echo '{"version":4,"capture":{"state":"idle","recording":null}}'; fi
    exit 0 ;;
  "dictation start")
    [ -f "$d/running" ] || { echo "hex: Hex isn't running" >&2; exit 3; }
    touch "$d/rec"; exit 0 ;;
  "dictation cancel")
    if [ -f "$d/new" ]; then echo "error: invalid value 'cancel' for '<ACTION>'" >&2; exit 2; fi
    rm -f "$d/rec"; echo cancelled >> "$d/calls"; exit 0 ;;
  "dictation stop")
    if [ "$3" = "--print" ] && [ -f "$d/noprint" ]; then echo "error: unexpected argument '--print' found" >&2; exit 2; fi
    [ -f "$d/running" ] || { echo "hex: Hex isn't running" >&2; exit 3; }
    if [ -f "$d/crash" ]; then echo "hex: couldn't transcribe it: model missing" >&2; exit 1; fi
    [ -f "$d/rec" ] || { echo "hex: dictation isn't recording; nothing to print" >&2; exit 1; }
    rm -f "$d/rec"
    if [ -f "$d/silent" ]; then echo "hex: no speech was recorded; nothing to print" >&2; exit 4; fi
    echo "what is the weather"; exit 0 ;;
  "start "|"start") touch "$d/running"; exit 0 ;;
esac
exit 2
`, { mode: 0o755 });
const run = (script, cmd, env) => spawnSync("sh", V.argv(script, cmd).slice(1), { encoding: "utf8", env: Object.assign({}, process.env, { HOME: dir, PATH: bin + ":" + process.env.PATH }, env || {}) });
const calls = () => fs.existsSync(path.join(dir, "calls")) ? fs.readFileSync(path.join(dir, "calls"), "utf8").trim().split("\n") : [];
const has = (f) => fs.existsSync(path.join(dir, f));
const put = (...fs_) => { for (const f of fs_) fs.writeFileSync(path.join(dir, f), ""); };
const reset = (...on) => { for (const f of ["calls", "running", "rec", "new", "noprint", "silent", "crash"]) fs.rmSync(path.join(dir, f), { force: true }); put(...on); };

// ---- starting, step by step, the way Service.qml runs them ----
const startAll = () => {
    let step = "check", r, next;
    for (let i = 0; i < 6; i++) {
        r = run(V.STEPS[step](), "hex");
        next = V.afterStep(step, r.status, r.stdout);
        if (!next.step) return { r: r, next: next };
        step = next.step;
    }
};
reset();
let s0 = startAll(), r = s0.r;
ok(s0.next.listening && has("rec"), "start: records, also when Hex was not running (it is started first)");
eq(calls().join(" | "), "status --json | start | dictation start", "start: checks, starts Hex, starts recording");
reset("running");
s0 = startAll();
ok(s0.next.listening && has("rec"), "start: records at once when Hex runs");
eq(calls().join(" | "), "status --json | dictation start", "start: a check and one start when Hex runs");
reset("running", "rec");
s0 = startAll();
ok(s0.next.busy, "start: Hex already recording (a dictation of your own) is left alone");
eq(calls().join(" | "), "status --json", "start: and nothing is sent to it");
eq(JSON.stringify(V.afterStep("check", 127, "")), '{"fail":true}', "start: not installed fails at the check");
eq(JSON.stringify(V.afterStep("check", 1, "")), '{"step":"try"}', "start: a check that fails otherwise goes on to try");
eq(JSON.stringify(V.afterStep("check", 0, "not json")), '{"step":"try"}', "start: unreadable status goes on to try");
eq(JSON.stringify(V.afterStep("try", 127)), '{"fail":true}', "start: not installed fails at once");
eq(JSON.stringify(V.afterStep("start", 1)), '{"fail":true}', "start: the last try failing fails");
ok(V.recording('{"capture":{"state":"recording"}}') && !V.recording('{"capture":{"state":"transcribing"}}') && !V.recording("{}") && !V.recording(""), "recording: only a capture that records");
ok(V.finished('{"capture":{"state":"idle"}}') && V.finished('{"capture":{"state":"transcribing"}}'), "finished: idle or transcribing");
ok(!V.finished('{"capture":{"state":"recording"}}') && !V.finished('{"capture":{"state":"unknown"}}') && !V.finished("{}") && !V.finished("garbage"), "finished: never guessed from missing or odd output");
eq(V.stopProblem(1, "", "hex: dictation isn't recording; nothing to print"), V.ENDED, "stop: a recording Hex already ended says so");
ok(V.DELIVERS.try && V.DELIVERS.start && !V.DELIVERS.check && !V.DELIVERS.boot, "only try and start can get a start through");

// every step is hex itself (or timeout waiting for it): stopping the step stops hex, with no child left
for (const step of Object.keys(V.STEPS)) {
    const slow = fs.mkdtempSync(path.join(os.tmpdir(), "pawmpt-slow-"));
    fs.writeFileSync(path.join(slow, "hex"), "#!/bin/sh\nsleep 3\necho recording > " + JSON.stringify(path.join(slow, "rec")) + "\n", { mode: 0o755 });
    const { spawn } = require("child_process");
    const p = spawn("sh", V.argv(V.STEPS[step](), path.join(slow, "hex")).slice(1), { stdio: "ignore" });
    spawnSync("sleep", ["0.5"]);
    p.kill("SIGTERM");
    spawnSync("sleep", ["3.5"]);
    ok(!fs.existsSync(path.join(slow, "rec")), "stopping the " + step + " step leaves nothing behind that still starts recording");
}

// ---- stopping ----
reset("running", "rec");
r = run(V.stopScript(), "hex");
eq(r.status, 0, "stop: succeeds"); eq(V.clean(r.stdout), "what is the weather", "stop: the words come out on stdout");
eq(calls().join(" | "), "dictation stop --print", "stop: asks for --print");
reset("running", "rec", "silent");
r = run(V.stopScript(), "hex");
eq(r.status, 4, "stop: no speech is exit 4"); eq(V.stopProblem(r.status, r.stdout, r.stderr), "I didn't hear anything.", "stop: no speech gives the message");
reset("running", "rec", "crash");
r = run(V.stopScript(), "hex");
eq(r.status, 1, "stop: a failure is its exit code"); ok(V.stopProblem(r.status, r.stdout, r.stderr).endsWith("model missing"), "stop: a failure gives Hex's words");

// ---- dropping a recording (Cancel), on every Hex ----
reset("running", "rec");
r = run(V.dropScript(), "hex");
ok(r.status === 0 && !has("rec"), "drop, Hex with cancel: the recording is gone");
eq(calls().join(" | "), "dictation cancel | cancelled", "drop, Hex with cancel: cancel is enough, nothing is transcribed");
reset("running", "rec", "new");
r = run(V.dropScript(), "hex");
ok(r.status === 0 && !has("rec"), "drop, Hex 3.3 (no cancel): the recording is gone");
eq(calls().join(" | "), "dictation cancel | dictation stop --print", "drop, Hex 3.3: stopped with --print, which never pastes");
eq(r.stdout, "", "drop, Hex 3.3: the words are thrown away");
reset("running", "rec", "new", "silent");
r = run(V.dropScript(), "hex");
ok(r.status === 0 && !has("rec"), "drop, Hex 3.3, nothing said: fine");
reset("running", "new");
r = run(V.dropScript(), "hex");
eq(r.status, 0, "drop, Hex 3.3, nothing recording: fine");
reset("new");
r = run(V.dropScript(), "hex");
eq(r.status, 0, "drop, Hex not running: fine, nothing can be recording");
reset("running", "rec", "new", "crash");
r = run(V.dropScript(), "hex");
ok(r.status !== 0, "drop that fails: says so"); ok(V.dropProblem(r.status, r.stderr).startsWith("Hex may still be recording") && V.dropProblem(r.status, r.stderr).includes("model missing"), "drop that fails: with Hex's words, and how to stop it");
reset("running", "rec", "new", "noprint");
r = run(V.dropScript(), "hex");
ok(r.status !== 0 && has("rec"), "drop, a Hex with neither cancel nor --print: reported, never pasted");
eq(V.dropProblem(0, "x"), null, "a drop that worked is no problem");
reset("running", "rec", "new");
r = run(V.lateDropScript(), "hex");
ok(r.status === 0 && !has("rec"), "late drop (shell reload): the recording is gone");

// hex that is not on the PATH: the installer's place is used, else a clear failure
reset();
const bare = fs.mkdtempSync(path.join(os.tmpdir(), "pawmpt-nohex-"));
r = spawnSync("sh", V.argv(V.stopScript(), "hex").slice(1), { encoding: "utf8", env: { HOME: bare, PATH: "/usr/bin:/bin" } });
eq(r.status, 127, "not installed: exit 127"); ok(r.stderr.includes("not installed"), "not installed: says so");
fs.mkdirSync(path.join(bare, ".local", "bin"), { recursive: true });
fs.copyFileSync(path.join(bin, "hex"), path.join(bare, ".local", "bin", "hex")); fs.chmodSync(path.join(bare, ".local", "bin", "hex"), 0o755);
reset("running", "rec");
r = spawnSync("sh", V.argv(V.stopScript(), "hex").slice(1), { encoding: "utf8", env: { HOME: bare, PATH: "/usr/bin:/bin" } });
eq(r.status, 0, "~/.local/bin/hex is used when hex is not on the PATH");
// a path with a space and shell characters is passed as one word
const odd = path.join(dir, "my bin; echo hacked"); fs.mkdirSync(odd); fs.copyFileSync(path.join(bin, "hex"), path.join(odd, "hex")); fs.chmodSync(path.join(odd, "hex"), 0o755);
reset("running", "rec");
r = run(V.stopScript(), path.join(odd, "hex"));
eq(r.status, 0, "a command path with spaces and a semicolon still runs"); ok(!r.stdout.includes("hacked"), "and nothing in it is run as a command");

console.log(failed ? "\n" + failed + " failed" : "\nAll good.");
process.exit(failed ? 1 : 0);
