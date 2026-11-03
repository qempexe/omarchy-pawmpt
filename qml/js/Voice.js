.pragma library

// Asking by voice, with Hex (https://anoma.ly/hex), local voice dictation. Pawmpt does not listen itself:
// it tells the running Hex to start recording, and to stop and hand over what was said
// (`hex dictation start`, `hex dictation stop --print`). The shell snippets and the messages are here,
// as plain values, so tests/test_voice.js can run them against a stand-in for hex.

// finds hex: the command as set, else the place the installer puts it. $1 is the command, $h the one used.
const FIND = 'h="$1"; command -v "$h" >/dev/null 2>&1 || { [ -x "$HOME/.local/bin/hex" ] && h="$HOME/.local/bin/hex"; }; '
    + 'command -v "$h" >/dev/null 2>&1 || { echo "Hex is not installed" >&2; exit 127; }; ';

// start recording; when Hex is not running (or not listening), start it and try once more
function startScript() {
    return FIND + '"$h" dictation start >/dev/null 2>&1 && exit 0; timeout 25 "$h" start >/dev/null 2>&1; exec "$h" dictation start';
}
// stop and print what was said (Hex waits up to 60 s for it; this gives it 75)
function stopScript() { return FIND + 'exec timeout 75 "$h" dictation stop --print'; }
function cancelScript() { return FIND + 'exec "$h" dictation cancel'; }

// argv for Process.command: sh -c <script> <name> <the hex command>
function argv(script, hexCommand) {
    const c = String(hexCommand === undefined || hexCommand === null ? "" : hexCommand).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return ["sh", "-c", script, "pawmpt", c === "" ? "hex" : c];
}

// what was said, as one tidy line (Hex may add line breaks, or control characters)
function clean(text) {
    return String(text === undefined || text === null ? "" : text)
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

// the words for a stop that gave no text, or null when there is text to use
function stopProblem(code, text, err) {
    if (code === 0 && clean(text) !== "") return null;
    if (code === 0 || code === 4) return "I didn't hear anything.";
    if (code === 124) return "Hex took too long to turn that into text.";
    if (code === 127) return startProblem(127, err);
    const e = oneLine(err);
    return "Hex could not turn that into text" + (e ? ": " + e : ".");
}

if (typeof module !== "undefined") module.exports = {
    FIND: FIND, startScript: startScript, stopScript: stopScript, cancelScript: cancelScript, argv: argv,
    clean: clean, startProblem: startProblem, stopProblem: stopProblem
};
