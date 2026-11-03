#!/usr/bin/env node
// Pawmpt checks. Run: node tools/check.js [--margin 0.12] [--quick]
// Loads Schema.js, Skins.js and Draw.js (the ".pragma library" line is stripped) and draws
// everything on a stub canvas that records calls. Fails on exceptions, NaN or Infinity,
// undefined colors and drawing far outside the canvas. Also checks that the files agree.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const argVal = (n, d) => { const i = args.indexOf(n); return i >= 0 ? parseFloat(args[i + 1]) : d; };
const MARGIN = argVal("--margin", 0.12);       // fraction of the canvas size
const QUICK = args.includes("--quick");

function load(file) {
    const src = fs.readFileSync(path.join(root, "qml", "js", file), "utf8").replace(/^\s*\.pragma library.*$/m, "");
    const ctx = vm.createContext({ console, Math, Object, Array, String, Number, JSON, isFinite, parseInt, parseFloat, RegExp });
    vm.runInContext(src + "\n;this.__exports = { " + exportsOf(src).join(", ") + " };", ctx, { filename: file });
    return ctx.__exports;
}
function exportsOf(src) {
    const names = new Set();
    for (const m of src.matchAll(/^(?:var|function)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
    return [...names];
}

const Schema = load("Schema.js");
const Skins = load("Skins.js");
const Draw = load("Draw.js");

// ---- the stub canvas ---------------------------------------------------------------------
const problems = new Map();
let ctxLabel = "";
let warned = 0;
function bad(msg) {
    const key = msg.replace(/[0-9.]+/g, "#") + " | " + ctxLabel.split(" ")[0];
    if (!problems.has(key)) problems.set(key, { msg, example: ctxLabel, n: 0 });
    problems.get(key).n++;
}

function makeCtx(w, h) {
    let m = [1, 0, 0, 1, 0, 0];
    const stack = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let drawn = false;
    const st = { globalCompositeOperation: "", fillStyle: "#000", strokeStyle: "#000", shadowColor: "rgba(0,0,0,0)", shadowBlur: 0, globalAlpha: 1, lineWidth: 1 };
    const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
                           a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
    const nums = (name, list) => {
        for (const v of list) if (typeof v !== "number" || !isFinite(v)) bad(name + " got a bad number (" + v + ")");
    };
    const pt = (x, y) => {
        if (st.globalCompositeOperation === "source-atop") { drawn = true; return; }   // clipped to the body
        const X = m[0] * x + m[2] * y + m[4], Y = m[1] * x + m[3] * y + m[5];
        minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y);
        drawn = true;
    };
    const colorOk = (c, what) => {
        if (c && typeof c === "object" && c.__grad) return;
        if (typeof c !== "string" || c === "" || /undefined|null|NaN/.test(c)) bad(what + " is " + String(c));
    };
    const grad = () => ({ __grad: true, addColorStop(o, c) { nums("addColorStop", [o]); colorOk(c, "gradient stop"); } });
    const ctx = {
        save() { stack.push([m.slice(), Object.assign({}, st)]); },
        restore() { const s = stack.pop(); if (s) { m = s[0]; Object.assign(st, s[1]); } },
        translate(x, y) { nums("translate", [x, y]); m = mul(m, [1, 0, 0, 1, x, y]); },
        rotate(a) { nums("rotate", [a]); m = mul(m, [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
        scale(x, y) { nums("scale", [x, y]); m = mul(m, [x, 0, 0, y, 0, 0]); },
        clearRect(x, y, a, b) { nums("clearRect", [x, y, a, b]); },
        beginPath() {}, closePath() {},
        moveTo(x, y) { nums("moveTo", [x, y]); pt(x, y); },
        lineTo(x, y) { nums("lineTo", [x, y]); pt(x, y); },
        quadraticCurveTo(a, b, x, y) { nums("quadraticCurveTo", [a, b, x, y]); pt(a, b); pt(x, y); },
        bezierCurveTo(a, b, c, d, x, y) { nums("bezierCurveTo", [a, b, c, d, x, y]); pt(a, b); pt(c, d); pt(x, y); },
        arcTo(a, b, x, y, r) { nums("arcTo", [a, b, x, y, r]); pt(a, b); pt(x, y); },
        arc(x, y, r, a0, a1) { nums("arc", [x, y, r, a0, a1]); if (r < 0) bad("arc with a negative radius"); pt(x - r, y - r); pt(x + r, y + r); },
        rect(x, y, a, b) { nums("rect", [x, y, a, b]); if (a < 0 || b < 0) bad("rect with a negative size"); pt(x, y); pt(x + a, y + b); },
        ellipse(x, y, a, b) { nums("ellipse", [x, y, a, b]); if (a < 0 || b < 0) bad("ellipse with a negative size (" + a.toFixed(2) + " x " + b.toFixed(2) + ")"); pt(x, y); pt(x + a, y + b); },
        fill() { colorOk(st.fillStyle, "fillStyle"); },
        stroke() { colorOk(st.strokeStyle, "strokeStyle"); nums("lineWidth", [st.lineWidth]); },
        createLinearGradient(a, b, c, d) { nums("createLinearGradient", [a, b, c, d]); return grad(); },
        createRadialGradient(a, b, c, d, e, f) { nums("createRadialGradient", [a, b, c, d, e, f]); return grad(); }
    };
    for (const k of ["fillStyle", "strokeStyle", "shadowColor"])
        Object.defineProperty(ctx, k, { get() { return st[k]; }, set(v) { colorOk(v, k); st[k] = v; } });
    for (const k of ["shadowBlur", "shadowOffsetX", "shadowOffsetY", "globalAlpha", "lineWidth"])
        Object.defineProperty(ctx, k, { get() { return st[k]; }, set(v) { nums(k, [v]); st[k] = v; } });
    for (const k of ["lineJoin", "lineCap"]) ctx[k] = "";
    Object.defineProperty(ctx, "globalCompositeOperation", { get() { return st.globalCompositeOperation; }, set(v) { st.globalCompositeOperation = v; } });
    ctx.bounds = () => ({ minX, minY, maxX, maxY, drawn });
    return ctx;
}

function drawCase(label, w, fn, bodyRegion) {
    ctxLabel = label;
    const ctx = makeCtx(w, w);
    try { fn(ctx); } catch (e) { bad("exception: " + e.message); return; }
    const b = ctx.bounds();
    if (!b.drawn) return;
    // the dress size and height sliders can push an item past the edge on purpose (size 160, height +-40),
    // so there it is only counted as a warning, not a failure
    const extreme = /dress=\w+ size=(?!100 )\d+ dy=|dy=(?!0 )-?\d+/.test(label);
    const mg = w * MARGIN;
    if (b.minX < -mg || b.minY < -mg || b.maxX > w + mg || b.maxY > w + mg) {
        if (extreme) { warned++; return; }
        bad("draws outside the canvas by " + Math.max(-b.minX, -b.minY, b.maxX - w, b.maxY - w).toFixed(1) + " px at " + w + " px");
    }
}

// ---- consistency ---------------------------------------------------------------------------
let fails = 0;
const note = (ok, msg) => { if (!ok) { fails++; console.log("  FAIL " + msg); } };
console.log("Consistency");
const charKeys = Skins.characters.map((c) => c.key);
note(new Set(charKeys).size === charKeys.length, "duplicate character keys");
for (const k of charKeys) {
    note(!!Draw.shapes[k], "character " + k + " has no shapes entry");
    note(!!Draw.layouts[k], "character " + k + " has no layouts entry");
}
for (const k of Object.keys(Draw.shapes)) note(charKeys.includes(k), "shapes entry " + k + " is not in Skins.characters");
for (const k of Object.keys(Draw.layouts)) if (k !== "custom") note(charKeys.includes(k), "layouts entry " + k + " is not in Skins.characters");
for (const c of Skins.characters) note(Skins.categories.includes(c.category), "character " + c.key + " is in an unknown category " + c.category);
for (const cat of Skins.categories) note(Skins.characters.some((c) => c.category === cat), "category " + cat + " is empty");
const KEPT = ["blob","ghost","cat","slime","robot","frog","bunny","penguin","owl","panda","dog","chibi","kitsune","ninja","onigiri","hero","knight","wizard","astronaut","dragon","alien","monster"];
for (const k of KEPT) note(charKeys.includes(k), "1.1 character key " + k + " was removed");
for (const d of Skins.dressItems) note(typeof Draw.dressDraw[d.id] === "function", "dress item " + d.id + " has no dressDraw entry");
for (const k of Object.keys(Draw.dressDraw)) note(Skins.dressItems.some((d) => d.id === k), "dressDraw " + k + " is not in dressItems");
for (const d of Skins.dressItems) note(Skins.slots.some((s) => s.key === d.slot), "dress item " + d.id + " has an unknown slot");
for (const p of Skins.presets) for (const k of Object.keys(p)) if (k !== "name" && k !== "theme")
    note(Schema.skinKeys.includes(k), "preset " + p.name + " uses " + k + ", which is not a skin key");
for (const p of Skins.presets) for (const k of Schema.skinKeys) if (p[k] !== undefined && !p.theme)
    note(Schema.clean(k, p[k]) === (typeof p[k] === "string" && /^#/.test(p[k]) ? p[k].toLowerCase() : p[k]), "preset " + p.name + " has an invalid value for " + k);
for (const a of Draw.animatedList || []) note(charKeys.includes(a), "animated list has an unknown key " + a);

// every settings key the QML files use
// every QML file under qml/, as a path from the repository root
function walk(dir) {
    let out = [];
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true }))
        out = out.concat(e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith(".qml") ? [path.join(dir, e.name)] : []));
    return out;
}
const qml = walk("qml");
const known = new Set(Object.keys(Schema.defaults));
const ignore = new Set(["skins", "dress", "lastShuffle", "palPos"]);
const skippedWords = new Set(["character", "skin"]);
for (const f of qml) {
    const text = fs.readFileSync(path.join(root, f), "utf8");
    for (const m of text.matchAll(/\b(?:cfg|settings)\.([A-Za-z_]\w*)/g)) {
        const k = m[1];
        if (["hasOwnProperty", "length", "toString", "json"].includes(k) || ignore.has(k)) continue;
        if (!known.has(k)) note(false, f + " uses the setting " + k + ", which is not in Schema.js");
    }
    for (const m of text.matchAll(/\b(?:svc\.set|root\.set)\(\s*"([A-Za-z_]\w*)"/g))
        note(known.has(m[1]), f + " sets " + m[1] + ", which is not in Schema.js");
}

// the QML files agree with each other: what they call on Schema.js and on the service exists, and no id is used twice in a file
{
    const service = fs.readFileSync(path.join(root, "qml", "Service.qml"), "utf8");
    const members = new Set();
    for (const m of service.matchAll(/(?:function|property(?:\s+\w+)*?)\s+(?:\w+\s+)?([A-Za-z_]\w*)\s*[(:=\n]/g)) members.add(m[1]);
    for (const m of service.matchAll(/property\s+(?:var|bool|string|int|real|double|color)\s+([A-Za-z_]\w*)/g)) members.add(m[1]);
    for (const m of service.matchAll(/(?:function|signal)\s+([A-Za-z_]\w*)/g)) members.add(m[1]);
    for (const f of qml) {
        const text = fs.readFileSync(path.join(root, f), "utf8");
        for (const m of text.matchAll(/\bSchema\.(?!js\b)([A-Za-z_]\w*)/g)) note(m[1] in Schema, f + " uses Schema." + m[1] + ", which Schema.js does not have");
        for (const m of text.matchAll(/\bSkins\.(?!js\b)([A-Za-z_]\w*)/g)) note(m[1] in Skins, f + " uses Skins." + m[1] + ", which Skins.js does not have");
        if (path.basename(f) !== "Service.qml") for (const m of text.matchAll(/\bsvc\.([A-Za-z_]\w*)/g)) note(members.has(m[1]), f + " uses svc." + m[1] + ", which Service.qml does not have");
        const ids = [...text.matchAll(/\bid:\s*([A-Za-z_]\w*)/g)].map((m) => m[1]);
        for (const id of new Set(ids)) note(ids.filter((x) => x === id).length === 1, f + " uses the id " + id + " twice");
        // every brace is closed
        const bare = text.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/gm, "");
        note((bare.match(/{/g) || []).length === (bare.match(/}/g) || []).length, f + " has unbalanced braces");
    }
    // the commands the README promises
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
    for (const m of readme.matchAll(/omarchy-shell io\.github\.qempexe\.pawmpt (\w+)/g)) note(new RegExp("function " + m[1] + "\\(").test(service), "README shows the command " + m[1] + ", which Service.qml does not have");
}

// every kind and control of a schema row is one SettingRow draws
{
    const row = fs.readFileSync(path.join(root, "qml", "controls", "SettingRow.qml"), "utf8");
    for (const g of Schema.groups) for (const it of g.items) {
        note(it.kind === "palette" || it.kind === "models" || new RegExp('"' + it.kind + '"').test(row) || it.kind === "enum" || it.kind === "int" || it.kind === "bool" || it.kind === "string", "SettingRow does not draw the kind " + it.kind);
        if (it.control && it.control !== "chips" && it.control !== "seg") note(new RegExp('"' + it.control + '"').test(row), "SettingRow does not draw the control " + it.control);
    }
    const art = fs.readFileSync(path.join(root, "qml", "controls", "TileArt.qml"), "utf8");
    for (const g of Schema.groups) for (const it of g.items) if (it.control === "tiles") note(art.indexOf('"' + it.key + '"') >= 0, "TileArt has no picture for the tiles of " + it.key);
}

// round trips and the 1.0 migration
{
    const r = Schema.resolve({});
    note(JSON.stringify(Schema.resolve(r)) === JSON.stringify(r), "resolve is not stable");
    for (const k of Object.keys(Schema.defaults)) note(JSON.stringify(Schema.clean(k, Schema.defaults[k])) === JSON.stringify(Schema.defaults[k]), "clean(" + k + ", default) changes the default");
    const junk = Schema.resolve({ size: "abc", idle: "nope", shadow: "maybe", palBody: "red", character: 12, moveSpeed: 1e9 });
    note(junk.size === 88 && junk.idle === "breathe" && junk.shadow === false && junk.palBody === Schema.defaults.palBody && junk.moveSpeed === 600, "junk values are not cleaned");
    const old = { body: "#112233", eye: "#445566", accent: "#778899", wander: true, wanderSpeed: 90, flipWhenWalking: false,
                  skins: [{ name: "Old", body: "#aabbcc", eye: "#000000", accent: "#ffffff" }] };
    note(Schema.needsMigrate(old), "1.0 settings are not detected");
    const mg = Schema.resolve(Schema.migrate(old));
    note(mg.palBody === "#112233" && mg.palEye === "#445566" && mg.palAccent === "#778899" && mg.moveMode === "stroll" && mg.moveSpeed === 90 && mg.faceMovement === false, "1.0 migration is wrong");
    note(!Schema.needsMigrate(Schema.migrate(old)), "migrated settings still look like 1.0");
}
// the panel: what changed, putting a row back, and the search over every tab
{
    const d = Schema.defaults;
    const cfg = Object.assign({}, d, { size: 120, palBody: "#000000", customBg: "#ffffff" });
    const allItems = Schema.groups.flatMap((g) => g.items);
    note(Schema.changedIn(d, "Pal") === 0 && Schema.changedIn(cfg, "Pal") === 1, "changedIn miscounts the Pal group");
    note(Schema.changedIn(cfg, "Skin") === 1 && Schema.changedIn(cfg, "Colors") === 1, "a changed palette row is not counted once");
    note(allItems.every((it) => !Schema.isChanged(d, it)), "a default value counts as changed");
    for (const it of allItems) for (const k of Schema.itemKeys(it)) note(k in d, "itemKeys gives " + k + ", which has no default");
    for (const g of Schema.groups) if (g.tab !== "none") {
        note(Schema.groupTab(g.title) === g.tab, "groupTab is wrong for " + g.title);
        note(Schema.groupOfPage(Schema.pageName(g.title)) === g.title, "page name of " + g.title + " does not round trip");
        // every key of a group is put back by its reset, and a reset leaves nothing changed
        const messy = Object.assign({}, d);
        for (const k of Schema.keysOfGroup(g.title)) messy[k] = "x";
        const back = Object.assign({}, messy);
        for (const k of Schema.keysOfGroup(g.title)) back[k] = d[k];
        note(Schema.changedIn(back, g.title) === 0, "resetting " + g.title + " leaves changes behind");
    }
    const tabs = ["settings", "wardrobe"];
    note(Schema.search("", tabs).length === 0 && Schema.search("   ", tabs).length === 0, "an empty search finds rows");
    note(Schema.search("zzqqxx", tabs).length === 0, "a nonsense search finds rows");
    note(Schema.search("glow", tabs).some((r) => r.item.key === "glow" && r.group === "Skin"), "search for glow does not find the glow row in the wardrobe");
    note(Schema.search("movement speed", ["settings"]).some((r) => r.item.key === "moveSpeed"), "search for two words misses a row that has both");
    note(Schema.search("glow", ["settings"]).every((r) => r.group !== "Skin"), "search leaks a tab it was not asked for");
    note(Schema.search("a", tabs).length <= 60, "search is not capped");
    note(!("panelSide" in d), "panelSide is a setting again, but the panel hangs off the bar and has no corner to pick");
}
console.log(fails ? "  " + fails + " consistency problems" : "  ok");

// ---- drawing --------------------------------------------------------------------------------
const SIZES = [20, 88, 260];
const baseSkin = { body: "#ff6fa8", body2: "#c4457a", eye: "#2a1020", accent: "#ffd1e3", outline: "#2a1020", outlineWidth: 0,
                   pattern: "none", patternColor: "#ffffff", patternSize: 100, fill: "flat", glow: 0, shine: true, blush: true,
                   eyeStyle: "normal", mouthStyle: "smile" };
const eyeStyles = Schema.groups.flatMap((g) => g.items).find((i) => i.key === "eyeStyle").options;
const mouthStyles = Schema.groups.flatMap((g) => g.items).find((i) => i.key === "mouthStyle").options;
const patterns = Schema.groups.flatMap((g) => g.items).find((i) => i.key === "pattern").options;
const fills = Schema.groups.flatMap((g) => g.items).find((i) => i.key === "bodyFill").options;

function skinFromPreset(p) {
    const s = Schema.resolve({});
    if (!p.theme) for (const k of Schema.skinKeys) if (p[k] !== undefined) s[k] = Schema.clean(k, p[k]);
    return { body: s.palBody, body2: s.palBody2, eye: s.palEye, accent: s.palAccent, outline: s.palOutline, outlineWidth: s.outlineWidth,
             pattern: s.pattern, patternColor: s.palPattern, patternSize: s.patternSize, fill: s.bodyFill, glow: s.glow, shine: s.shine,
             blush: s.blush, eyeStyle: s.eyeStyle, mouthStyle: s.mouthStyle };
}
const dressOpts = (kind, skin, items, t) => ({ kind, custom: false, items, t, lookX: 0.5, lookY: -0.5, blink: 0, eye: skin.eye, eyeStyle: skin.eyeStyle });
const T = [0, 0.37, 1.9];

let draws = 0;
console.log("Drawing " + charKeys.length + " characters");
for (const kind of charKeys) {
    for (const w of SIZES) {
        // every eye style x mouth style x pattern x size x fill
        for (const eyeStyle of eyeStyles) for (const mouthStyle of (QUICK ? ["smile"] : mouthStyles))
            for (const pattern of patterns) for (const fill of fills) for (const ps of (pattern === "none" ? [100] : [50, 200])) {
                const skin = Object.assign({}, baseSkin, { eyeStyle, mouthStyle, pattern, fill, patternSize: ps });
                const label = kind + " eyes=" + eyeStyle + " mouth=" + mouthStyle + " pattern=" + pattern + "/" + ps + " fill=" + fill;
                drawCase(label, w, (ctx) => { draws++; Draw.draw(ctx, w, w, Object.assign({ kind, t: 0.37, breathe: true, lookX: 0, lookY: 0, blink: 0, busy: false }, skin)); });
            }
        // outline, glow, busy, blink, asleep-ish, no shine, no blush at several times
        for (const t of T) for (const busy of [false, true]) for (const blink of [0, 1]) {
            const skin = Object.assign({}, baseSkin, { outlineWidth: 6, glow: 60, shine: false, blush: false, fill: "radial", pattern: "stars" });
            drawCase(kind + " outline+glow t=" + t + " busy=" + busy + " blink=" + blink, w, (ctx) => { draws++; Draw.draw(ctx, w, w, Object.assign({ kind, t, breathe: true, lookX: 1, lookY: -1, blink, busy }, skin)); });
        }
        // every preset
        for (const p of Skins.presets) {
            const skin = skinFromPreset(p.theme ? { theme: true } : p);
            drawCase(kind + " preset=" + p.name, w, (ctx) => { draws++; Draw.draw(ctx, w, w, Object.assign({ kind, t: 0.37, breathe: true, lookX: 0, lookY: 0, blink: 0, busy: false }, skin)); });
            // every dress item, alone, at small, normal and large sizes and the extreme heights
            for (const d of Skins.dressItems) for (const [sz, dy] of (QUICK ? [[100, 0]] : [[50, -40], [100, 0], [160, 40]]))
                for (const pass of ["back", "front"]) {
                    drawCase(kind + " dress=" + d.id + " size=" + sz + " dy=" + dy + " preset=" + p.name, w, (ctx) => {
                        draws++;
                        Draw.dress(ctx, w, w, dressOpts(kind, skin, [{ id: d.id, color: d.color, size: sz, dy }], 1.3), pass);
                    });
                }
        }
        // a picture character (custom) with every dress item
        for (const d of Skins.dressItems) drawCase("custom dress=" + d.id, w, (ctx) => {
            draws++;
            Draw.dress(ctx, w, w, Object.assign(dressOpts("custom", baseSkin, [{ id: d.id, color: d.color, size: 100, dy: 0 }], 0.5), { custom: true }), "front");
        });
    }
}

// ---- report ---------------------------------------------------------------------------------
console.log(draws + " draws" + (warned ? ", " + warned + " dress cases at the size or height extremes go past the edge (warnings only)" : ""));
const list = [...problems.values()].sort((a, b) => b.n - a.n);
if (list.length === 0 && fails === 0) { console.log("All checks passed."); process.exit(0); }
console.log(list.length + " kinds of drawing problem:");
for (const p of list.slice(0, 80)) console.log("  [" + p.n + "x] " + p.msg + "\n      e.g. " + p.example);
if (list.length > 80) console.log("  ... and " + (list.length - 80) + " more");
process.exit(1);
