.pragma library

// What is sent to the agent, built from plain values so it can be tested without the shell
// (tests/test_prompt.js). Service.qml gathers the values (settings, selection, window) and
// asks compose() for the text.

// how an answer is asked to be written (Settings > Agent > Answers); "normal" adds nothing
const styles = {
    normal: "",
    short: "Keep the answer short and to the point.",
    detailed: "Give a thorough, detailed answer.",
    steps: "Explain it step by step.",
    simple: "Explain it simply, as to someone new to the subject, without jargon."
};

function oneLine(s, n) {
    return String(s === undefined || s === null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n || 80);
}

function styleLine(style) {
    return Object.prototype.hasOwnProperty.call(styles, style) ? styles[style] : "";
}

function languageLine(language) {
    const l = oneLine(language, 40);
    return l ? "Write your answer in " + l + ", whatever language I ask in." : "";
}

// text taken from the selection or the clipboard: no control characters, not too long
function grab(text, limit) {
    let n = parseInt(limit, 10);
    if (!isFinite(n) || n < 1) n = 4000;
    return String(text === undefined || text === null ? "" : text)
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
}

function cut(s, n) {
    const t = String(s === undefined || s === null ? "" : s).trim();
    return t.length > n ? t.slice(0, n) + "…" : t;
}

// The last few exchanges, for agents that have no conversation of their own (Ollama, your own
// command). history is [{ q, a }], oldest first. The newest exchanges win when there is not room.
function historyBlock(history, maxTurns, maxChars) {
    const turns = parseInt(maxTurns, 10);
    if (!Array.isArray(history) || history.length === 0 || !isFinite(turns) || turns < 1) return "";
    let budget = maxChars > 0 ? maxChars : 6000;
    const picked = [];
    const from = Math.max(0, history.length - turns);
    for (let i = history.length - 1; i >= from; i--) {
        const h = history[i] || {};
        const piece = "Me: " + cut(h.q, 1500) + "\nYou: " + cut(h.a, 1500);
        if (picked.length > 0 && piece.length > budget) break;
        budget -= piece.length;
        picked.unshift(piece);
    }
    if (picked.length === 0) return "";
    return "(Our conversation so far:)\n" + picked.join("\n\n") + "\n(End of the conversation so far. My new message:)";
}

// o: { prompt, quick, sel, clip, prefix, style, language, history, turns, windowClass, windowTitle,
//      workDir, tellWindow }
// Returns { prompt: what is sent, body: the question with its quoted text, for the history }.
function compose(o) {
    let body = String(o.prompt || "");
    const sel = String(o.sel || "");
    const clip = String(o.clip || "");
    if (o.quick) {
        body += "\n\n```\n" + (sel !== "" ? sel : clip) + "\n```";
    } else {
        if (sel !== "") body += "\n\n(The text I have selected:)\n```\n" + sel + "\n```";
        if (clip !== "" && clip !== sel) body += "\n\n(What I copied:)\n```\n" + clip + "\n```";
    }
    const lines = [];
    if (o.prefix) lines.push(String(o.prefix));
    const st = styleLine(o.style);
    if (st) lines.push(st);
    const lg = languageLine(o.language);
    if (lg) lines.push(lg);
    let out = lines.length ? lines.join("\n") + "\n\n" : "";
    const hist = historyBlock(o.history, o.turns, 6000);
    if (hist) out += hist + "\n\n";
    out += body;
    if (o.tellWindow && (o.windowClass || o.windowTitle))
        out += "\n\n(Context from the desktop: the active window is " + (o.windowClass || "an app")
            + (o.windowTitle ? " titled \"" + String(o.windowTitle).slice(0, 200) + "\"" : "") + ", working folder " + o.workDir + ".)";
    return { prompt: out, body: body };
}

// ---- quick actions ----------------------------------------------------------------------------
function translatePrompt(language) {
    const l = oneLine(language, 40);
    return l ? "Translate this into " + l + ":"
        : "Translate this into English. If it is already English, translate it into my language and say which language you picked:";
}

// the buttons under the question box: the six that are always there, and one of your own
function quickList(settings) {
    const s = settings || {};
    const list = [
        { key: "explain", label: "Explain", prompt: "Explain this simply:" },
        { key: "summarize", label: "Summarize", prompt: "Summarize this in a few short points:" },
        { key: "fix", label: "Fix it", prompt: "Find what is wrong with this and show the fix:" },
        { key: "translate", label: "Translate", prompt: translatePrompt(s.agentLanguage) },
        { key: "reply", label: "Reply", prompt: "Write a short, friendly reply to this message:" },
        { key: "shorter", label: "Shorter", prompt: "Rewrite this shorter and clearer, keeping the meaning:" }
    ];
    const label = oneLine(s.quickLabel, 16);
    const text = String(s.quickPrompt || "").trim();
    if (label && text) list.push({ key: "custom", label: label, prompt: text });
    return list;
}

// the buttons that continue an answer (shown under it when the conversation is remembered)
const followUps = [
    { label: "Go on", prompt: "Go on." },
    { label: "Simpler", prompt: "Say that again, simpler and shorter." }
];

if (typeof module !== "undefined") module.exports = {
    styles: styles, styleLine: styleLine, languageLine: languageLine, grab: grab, historyBlock: historyBlock,
    compose: compose, translatePrompt: translatePrompt, quickList: quickList, followUps: followUps
};
