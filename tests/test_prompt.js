#!/usr/bin/env node
// Prompt tests: what is sent to the agent. Run: node tests/test_prompt.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
let failed = 0;
const ok = (cond, msg) => { if (!cond) { console.error("FAIL " + msg); failed++; } else console.log("ok   " + msg); };
const eq = (a, b, msg) => ok(a === b, msg + (a === b ? "" : "\n  got:      " + JSON.stringify(a) + "\n  expected: " + JSON.stringify(b)));

const load = (f) => {
    const sandbox = { module: { exports: {} }, console };
    vm.runInNewContext(fs.readFileSync(path.join(root, "qml", "js", f), "utf8").replace(/^\s*\.pragma library.*$/m, ""), sandbox, { filename: f });
    return sandbox.module.exports;
};
const P = load("Prompt.js");
const S = load("Schema.js");

// the first version of Service.launch(), kept here to prove the default prompt did not change
function legacy(o) {
    let body = o.prompt;
    if (o.quick) {
        body += "\n\n```\n" + (o.sel !== "" ? o.sel : o.clip) + "\n```";
    } else {
        if (o.sel !== "") body += "\n\n(The text I have selected:)\n```\n" + o.sel + "\n```";
        if (o.clip !== "" && o.clip !== o.sel) body += "\n\n(What I copied:)\n```\n" + o.clip + "\n```";
    }
    let prompt = (o.prefix ? o.prefix + "\n\n" : "") + body;
    if (o.tellWindow && (o.windowClass || o.windowTitle))
        prompt += "\n\n(Context from the desktop: the active window is " + (o.windowClass || "an app")
            + (o.windowTitle ? " titled \"" + o.windowTitle.slice(0, 200) + "\"" : "") + ", working folder " + o.workDir + ".)";
    return prompt;
}
const base = { prompt: "why?", quick: false, sel: "", clip: "", prefix: "", style: "normal", language: "", history: [], turns: 4, tellWindow: true, windowClass: "kitty", windowTitle: "~/code", workDir: "/home/u/code" };
for (const v of [
    {}, { prefix: "Be brief." }, { sel: "abc" }, { clip: "xyz" }, { sel: "same", clip: "same" }, { sel: "a", clip: "b" },
    { quick: true, sel: "picked" }, { quick: true, sel: "", clip: "copied" }, { tellWindow: false }, { windowClass: "", windowTitle: "" },
    { windowClass: "", windowTitle: "only title" }, { windowTitle: "x".repeat(300) }
]) {
    const o = Object.assign({}, base, v);
    eq(P.compose(o).prompt, legacy(o), "default prompt unchanged for " + JSON.stringify(v).slice(0, 60));
}

// style and language
eq(P.styleLine("normal"), "", "normal style adds nothing");
ok(P.styleLine("short") !== "" && P.styleLine("steps") !== "" && P.styleLine("simple") !== "" && P.styleLine("detailed") !== "", "every other style adds a line");
eq(P.styleLine("constructor"), "", "an unknown style (even an object key) adds nothing");
eq(P.styleLine(undefined), "", "no style adds nothing");
eq(P.languageLine(""), "", "no language adds nothing");
eq(P.languageLine("  Nederlands\n"), "Write your answer in Nederlands, whatever language I ask in.", "language is trimmed to one line");
eq(P.languageLine("a\nb"), "Write your answer in a b, whatever language I ask in.", "a language cannot carry a second line");
{
    const r = P.compose(Object.assign({}, base, { prefix: "Hi.", style: "short", language: "Français", tellWindow: false })).prompt;
    eq(r, "Hi.\nKeep the answer short and to the point.\nWrite your answer in Français, whatever language I ask in.\n\nwhy?", "prefix, style and language come first, in that order");
}

// the selection and the clipboard limit
eq(P.grab("  abc\u0000def  ", 4000), "abcdef", "control characters are removed and the text trimmed");
eq(P.grab("x".repeat(9000), 4000).length, 4000, "limited to 4000");
eq(P.grab("x".repeat(9000), 1500).length, 1500, "limited to the setting");
eq(P.grab("x".repeat(9000), undefined).length, 4000, "a missing limit means 4000");
eq(P.grab("a\tb\nc", 10), "a\tb\nc", "tabs and newlines stay");
eq(P.grab(null, 10), "", "null is empty");

// history
eq(P.historyBlock([], 4, 6000), "", "no history, no block");
eq(P.historyBlock(undefined, 4, 6000), "", "undefined history, no block");
eq(P.historyBlock([{ q: "a", a: "b" }], 0, 6000), "", "0 turns, no block");
{
    const h = [{ q: "q1", a: "a1" }, { q: "q2", a: "a2" }, { q: "q3", a: "a3" }];
    const two = P.historyBlock(h, 2, 6000);
    ok(two.indexOf("q1") < 0 && two.indexOf("q2") > 0 && two.indexOf("q3") > two.indexOf("q2"), "the newest turns are kept, oldest first");
    ok(two.startsWith("(Our conversation so far:)\n") && two.endsWith("(End of the conversation so far. My new message:)"), "the block is fenced");
    const full = P.compose(Object.assign({}, base, { history: h, turns: 4, tellWindow: false })).prompt;
    ok(full.endsWith("(End of the conversation so far. My new message:)\n\nwhy?"), "the history comes before the new question");
    const big = [{ q: "old", a: "x".repeat(1500) }, { q: "new", a: "y".repeat(1500) }, { q: "newer", a: "z".repeat(1500) }, { q: "newest", a: "w".repeat(1500) }];
    const b = P.historyBlock(big, 10, 6000);
    ok(b.length < 6300 && b.indexOf("newest") > 0 && b.indexOf("old") < 0, "the budget drops the oldest first (" + b.length + " chars)");
    const long = P.historyBlock([{ q: "q".repeat(5000), a: "a".repeat(5000) }], 4, 6000);
    ok(long.length < 3300 && long.indexOf("…") > 0, "one huge exchange is cut short (" + long.length + " chars)");
    ok(P.historyBlock([null, { q: "a", a: "b" }], 4, 6000).indexOf("Me: a") > 0, "a broken entry does not throw");
}

// quick actions
{
    const q = P.quickList({});
    eq(q.map((x) => x.key).join(","), "explain,summarize,fix,translate,reply,shorter", "six quick actions");
    eq(q[3].prompt, "Translate this into English. If it is already English, translate it into my language and say which language you picked:", "Translate as before");
    eq(P.quickList({ agentLanguage: "Nederlands" })[3].prompt, "Translate this into Nederlands:", "Translate follows the answer language");
    eq(P.quickList({ quickLabel: "Proofread" }).length, 6, "a name without a prompt adds nothing");
    eq(P.quickList({ quickPrompt: "Do it:" }).length, 6, "a prompt without a name adds nothing");
    const c = P.quickList({ quickLabel: "Proofread", quickPrompt: "Proofread this:" });
    ok(c.length === 7 && c[6].key === "custom" && c[6].label === "Proofread" && c[6].prompt === "Proofread this:", "your own quick action is the seventh");
    eq(P.quickList(undefined).length, 6, "no settings, six actions");
}
ok(P.followUps.length === 2 && P.followUps.every((f) => f.label && f.prompt), "follow-up buttons have a label and a prompt");

// the settings that go with it
const d = S.defaults;
eq(d.agentStyle, "normal", "default agentStyle"); eq(d.agentLanguage, "", "default agentLanguage");
eq(d.memoryTurns, 4, "default memoryTurns"); eq(d.contextChars, 4000, "default contextChars");
eq(d.copyAnswer, false, "default copyAnswer"); eq(d.notifyAfter, 0, "default notifyAfter");
eq(d.agentRetries, 0, "default agentRetries"); eq(d.showFollowUps, true, "default showFollowUps");
eq(d.quickLabel, "", "default quickLabel"); eq(d.quickPrompt, "", "default quickPrompt");
eq(S.clean("agentStyle", "bogus"), "normal", "an unknown style is the default");
eq(S.clean("agentStyle", "steps"), "steps", "a known style is kept");
eq(S.clean("memoryTurns", 99), 10, "memoryTurns is capped"); eq(S.clean("memoryTurns", -3), 0, "memoryTurns has a floor");
eq(S.clean("contextChars", 1), 500, "contextChars has a floor"); eq(S.clean("contextChars", "9000"), 9000, "contextChars takes a number in text");
eq(S.clean("agentRetries", 7), 3, "agentRetries is capped");
eq(S.clean("agentLanguage", "x".repeat(100)).length, 40, "the language is cut to 40 characters");
eq(S.clean("quickLabel", "y".repeat(50)).length, 16, "the quick action name is cut to 16 characters");
eq(S.clean("quickPrompt", "a\nb"), "a b", "a quick action prompt is one line");
ok(S.resolve({ agentStyle: "short" }).agentStyle === "short" && S.resolve({}).agentRetries === 0, "resolve keeps and fills the new settings");
for (const k of ["agentStyle", "agentLanguage", "memoryTurns", "contextChars", "copyAnswer", "notifyAfter", "agentRetries", "showFollowUps", "quickLabel", "quickPrompt"]) {
    const it = S.groups.flatMap((g) => g.items).find((x) => x.key === k);
    ok(it && it.hint && it.section, k + " has a hint and a section");
    ok(S.groups.some((g) => g.tab === "settings" && g.items.some((x) => x.key === k)), k + " is on the Settings tab");
}
for (const g of S.groups) for (const it of g.items) for (const w of it.when || [])
    ok(S.defaults[w.key] !== undefined, it.key + " depends on a setting that exists (" + w.key + ")");
// every style named in the schema is known to Prompt.js
{
    const it = S.groups.flatMap((g) => g.items).find((x) => x.key === "agentStyle");
    ok(it.options.every((o) => Object.prototype.hasOwnProperty.call(P.styles, o)) && Object.keys(P.styles).every((o) => it.options.includes(o)), "the style options and Prompt.js agree");
}

console.log(failed ? "\n" + failed + " failed" : "\nAll good.");
process.exit(failed ? 1 : 0);
