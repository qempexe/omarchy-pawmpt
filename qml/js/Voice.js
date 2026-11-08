.pragma library

// Asking by voice, with Hex (https://anoma.ly/hex), local voice dictation. Pawmpt does not listen itself:
// it tells the running Hex to start recording, and to stop and hand over what was said
// (`hex dictation start`, `hex dictation stop --print`). The shell snippets and the messages are here,
// as plain values, so tests/test_voice.js can run them against a stand-in for hex.

// finds hex: the command as set, else the place the installer puts it. $1 is the command, $h the one used.
const FIND = 'h="$1"; command -v "$h" >/dev/null 2>&1 || { [ -x "$HOME/.local/bin/hex" ] && h="$HOME/.local/bin/hex"; }; '
    + 'command -v "$h" >/dev/null 2>&1 || { echo "Hex is not installed" >&2; exit 127; }; ';

// Starting to record takes up to four steps, each its own process:
//   check  `hex status --json`: when Hex is already recording (a dictation of your own, from its
//          shortcut), Pawmpt leaves it alone instead of taking it over and asking with your words
//   try    `hex dictation start`
//   boot   when Hex is not running (or not listening): `hex start`, which waits until it answers
//   start  `hex dictation start` once more
// Every step ends in exec, so the process Pawmpt runs is hex itself (or timeout, which waits for hex):
// when Cancel stops a step, there is no child left behind that could still start recording after it.
function checkScript() { return FIND + 'exec timeout 15 "$h" status --json 2>/dev/null'; }
function tryScript() { return FIND + 'exec "$h" dictation start >/dev/null 2>&1'; }
function bootScript() { return FIND + 'exec timeout 25 "$h" start >/dev/null 2>&1'; }
function startScript() { return FIND + 'exec "$h" dictation start >/dev/null'; }
const STEPS = { check: checkScript, "try": tryScript, boot: bootScript, start: startScript };
// the steps that may have got a start through to Hex, so a cancel during them has something to drop
const DELIVERS = { "try": true, start: true };

// whether `hex status --json` says Hex is recording right now (unreadable or older output: no)
function recording(statusJson) {
    try {
        const s = JSON.parse(String(statusJson || ""));
        return !!s && !!s.capture && s.capture.state === "recording";
    } catch (e) {
        return false;
    }
}

// whether `hex status --json` says plainly that nothing is recording: idle, or already transcribing.
// Missing or unreadable output says nothing, so it is never taken for finished.
function finished(statusJson) {
    try {
        const s = JSON.parse(String(statusJson || ""));
        return !!s && !!s.capture && (s.capture.state === "idle" || s.capture.state === "transcribing");
    } catch (e) {
        return false;
    }
}

// what comes after a start step ended with this exit code (and, for check, this output):
// { listening: true }, { fail: true } (the code says why), { busy: true }, or { step: <the next step> }
function afterStep(step, code, out) {
    if (step === "check") {
        if (code === 127) return { fail: true };
        if (code === 0 && recording(out)) return { busy: true };
        return code === 3 ? { step: "boot" } : { step: "try" };
    }
    if (step === "try") return code === 0 ? { listening: true } : code === 127 ? { fail: true } : { step: "boot" };
    if (step === "boot") return code === 127 ? { fail: true } : { step: "start" };
    return code === 0 ? { listening: true } : { fail: true };
}
// stop and print what was said (Hex waits up to 60 s for it; this gives it 75)
function stopScript() { return FIND + 'exec timeout 75 "$h" dictation stop --print'; }
// Drops the recording Pawmpt started. Hex before 3.3 has `hex dictation cancel`. Hex 3.3 has no cancel
// (every dictation finishes), and rejects it as a usage error without doing anything; there the
// recording is stopped with `stop --print`, which never pastes, and the words are thrown away (Hex
// keeps them in its History as Printed). Exits 0 when nothing is left recording: dropped, no speech,
// nothing was recording, or Hex isn't running. Anything else is a failure, with Hex's words on stderr.
const DROP = '"$h" dictation cancel >/dev/null 2>&1 && exit 0; '
    + 'e=$(timeout 75 "$h" dictation stop --print 2>&1 >/dev/null); r=$?; '
    + 'case $r in 0|3|4) exit 0 ;; esac; '
    + 'case $e in *"isn\'t recording"*|*"not recording"*|*not-recording*) exit 0 ;; esac; '
    + 'printf "%s\\n" "$e" >&2; exit $r';
function dropScript() { return FIND + DROP; }
// when the shell reloads while asking by voice: the step it was on is killed with it, so the recording
// is dropped a moment later, from a process of its own, in case that step got the start through first
function lateDropScript() { return FIND + 'sleep 2; ' + DROP; }

// argv for Process.command: sh -c <script> <name> <the hex command>
function argv(script, hexCommand) {
    const c = String(hexCommand === undefined || hexCommand === null ? "" : hexCommand).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return ["sh", "-c", script, "pawmpt", c === "" ? "hex" : c];
}

// what was said, as one tidy line (Hex may add line breaks, or control characters)
function clean(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
        .replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "")
        .replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
}

function oneLine(text) {
    return String(text === undefined || text === null ? "" : text).split("\n").map(function(l) { return l.trim(); })
        .filter(function(l) { return l !== ""; }).slice(-1).join("").slice(0, 200);
}

// the words for a start that did not work
function startProblem(code, err) {
    if (code === 127) return "Hex is not installed. Get it from anoma.ly/hex, or set its path under Settings > Agent > Voice.";
    const e = oneLine(err);
    return "Hex would not start listening" + (e ? ": " + e : ". Is it running, and not disabled?");
}

// a recording Hex ended on its own: its shortcut also finishes one a command started, and then Hex
// pastes the words where you are, as it always does
const ENDED = "Hex finished that recording itself (its shortcut ends one too), so it pasted the words where you were.";

// the words for a drop that did not work, or null when nothing is left recording
function dropProblem(code, err) {
    if (code === 0) return null;
    const e = oneLine(err);
    return "Hex may still be recording" + (e ? " (" + e + ")" : "") + ". Stop it with your Hex shortcut, or run: hex dictation stop";
}

// the words for a stop that gave no text, or null when there is text to use
function stopProblem(code, text, err) {
    if (code === 0 && clean(text) !== "") return null;
    if (code === 0 || code === 4) return "I didn't hear anything.";
    if (code === 124) return "Hex took too long to turn that into text.";
    if (code === 127) return startProblem(127, err);
    const e = oneLine(err);
    if (/isn't recording|not recording|not-recording/.test(e)) return ENDED;
    return "Hex could not turn that into text" + (e ? ": " + e : ".");
}

if (typeof module !== "undefined") module.exports = {
    FIND: FIND, checkScript: checkScript, tryScript: tryScript, bootScript: bootScript, startScript: startScript,
    STEPS: STEPS, DELIVERS: DELIVERS, recording: recording, finished: finished, ENDED: ENDED, afterStep: afterStep,
    stopScript: stopScript, dropScript: dropScript, lateDropScript: lateDropScript, argv: argv,
    clean: clean, startProblem: startProblem, stopProblem: stopProblem, dropProblem: dropProblem
};
