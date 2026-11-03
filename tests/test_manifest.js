#!/usr/bin/env node
// Drift test: the manifest, Schema.js, the QML files and the docs have to agree. Run: node tests/test_manifest.js
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let failed = 0;
const ok = (cond, msg) => { if (!cond) { console.error("FAIL " + msg); failed++; } else console.log("ok   " + msg); };

const m = JSON.parse(read("manifest.json"));

// 1. the settings block is what Schema.js says
const gen = spawnSync(process.execPath, [path.join(root, "tools/gen-manifest.js"), "--check"], { encoding: "utf8" });
ok(gen.status === 0, "manifest.json barWidget settings match Schema.js" + (gen.status ? ": " + gen.stderr.trim() : ""));

// 2. every entry point exists, the id follows the pattern, the version matches the service
for (const [k, f] of Object.entries(m.entryPoints)) ok(fs.existsSync(path.join(root, f)), "entry point " + k + " -> " + f + " exists");
ok(/^io\.github\.qempexe\.[a-z0-9-]+$/.test(m.id), "plugin id " + m.id);
const svcVersion = (read("qml/Service.qml").match(/property string version: "([^"]+)"/) || read("qml/Service.qml").match(/string version: "([^"]+)"/) || [])[1];
ok(svcVersion === m.version, "Service.qml version " + svcVersion + " = manifest " + m.version);
ok(read("CHANGELOG.md").includes("## [" + m.version + "]"), "CHANGELOG.md has " + m.version);

// 3. every schema entry is well formed and defaults are inside their ranges / options
for (const e of m.barWidget.schema) {
    let good = e.key && e.label && e.defaultValue !== undefined && m.barWidget.defaults[e.key] === e.defaultValue;
    if (e.type === "enum") good = good && e.options.includes(String(e.defaultValue));
    if (e.type === "integer") good = good && e.defaultValue >= e.min && e.defaultValue <= e.max;
    if (!good) ok(false, "schema entry " + e.key);
}
ok(true, m.barWidget.schema.length + " settings entries are well formed");

// 4. the plain-text rule: no tabs, no trailing spaces in the docs
for (const f of ["README.md", "CHANGELOG.md", "CONTRIBUTING.md"]) {
    const t = read(f);
    ok(!/\t/.test(t), f + " has no tabs");
}

// 5. every QML file named in another QML file exists, and the types each folder needs are there
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith(".qml") ? [path.join(dir, e.name)] : []));
const qml = walk("qml");
for (const f of qml) {
    for (const mm of read(f).matchAll(/source: "([A-Za-z]+\.qml)"/g)) ok(fs.existsSync(path.join(root, path.dirname(f), mm[1])), f + " loads " + mm[1]);
}
const names = new Set(qml.map((f) => path.basename(f, ".qml")));
for (const n of ["Panel", "PalView", "PopoutWindow", "UiState", "SettingsView", "SettingRow", "TileArt", "AboutPage", "CharactersPage", "SkinsPage", "DressPage", "PalsPage", "Txt", "Btn", "Chip", "Sw", "Field", "PasteInput", "BarWidget", "Service", "Pal", "Critter"]) ok(names.has(n), n + ".qml exists");
for (const f of ["Schema.js", "Skins.js", "Draw.js", "Theme.js", "Prompt.js", "Glow.js", "Voice.js"]) ok(fs.existsSync(path.join(root, "qml", "js", f)), "qml/js/" + f + " exists");

console.log(failed ? "\n" + failed + " failed" : "\nAll good.");
process.exit(failed ? 1 : 0);

