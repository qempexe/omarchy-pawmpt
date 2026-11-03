#!/usr/bin/env node
// Writes the bar-widget settings block of manifest.json from Schema.js, like this: `barWidget.defaults` (every default) and `barWidget.schema` (key, type,
// label, options, range, default, description). Run it after you change Schema.js:
//   node tools/gen-manifest.js          writes manifest.json
//   node tools/gen-manifest.js --check  fails if manifest.json is out of date (used by tests/test_manifest.js)
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, "qml", "js", f), "utf8").replace(/^\s*\.pragma library.*$/m, "");
const S = new Function(read("Schema.js") + "\n;return { groups: groups, defaults: defaults };")();

function entry(it, key, def) {
    const e = { key, type: "string", label: it.label };
    if (it.kind === "enum" && Array.isArray(it.options) && it.options.length) { e.type = "enum"; e.options = it.options.map(String); }
    else if (it.kind === "int") { e.type = "integer"; e.min = it.min; e.max = it.max; e.step = it.step; }
    else if (it.kind === "bool") e.type = "boolean";
    e.defaultValue = def;
    if (it.hint) e.description = it.hint;
    return e;
}

function build() {
    const schema = [], seen = new Set();
    for (const g of S.groups) for (const it of g.items) {
        if (it.kind === "palette") {
            for (const t of it.targets) if (!seen.has(t.key)) { seen.add(t.key); schema.push(entry({ label: t.label, hint: it.hint, kind: "string" }, t.key, S.defaults[t.key])); }
        } else if (it.key && !seen.has(it.key)) {
            seen.add(it.key);
            schema.push(entry(it, it.key, S.defaults[it.key]));
        }
    }
    const defaults = {};
    for (const e of schema) defaults[e.key] = e.defaultValue;
    return { defaults, schema };
}

const manifestPath = path.join(root, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const built = build();
// This plugin used to be called Omapal and had all its files at the top. Run once, this also moves the
// manifest over: the new name in every text, and the entry points inside qml/.
const OLD = ["omapal", "Omapal", "OMAPAL"], NEW = ["pawmpt", "Pawmpt", "PAWMPT"];
const rename = (v) => typeof v === "string" ? OLD.reduce((s, o, i) => s.split(o).join(NEW[i]), v)
    : Array.isArray(v) ? v.map(rename)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rename(x)])) : v;
const moved = rename(manifest);
for (const [k, f] of Object.entries(moved.entryPoints || {})) if (/\.qml$/.test(f) && !f.startsWith("qml/")) moved.entryPoints[k] = "qml/" + f;
const next = JSON.parse(JSON.stringify(moved));
next.barWidget = Object.assign({}, moved.barWidget, { defaults: built.defaults, schema: built.schema });
const text = JSON.stringify(next, null, 2) + "\n";
if (process.argv.includes("--check")) {
    if (fs.readFileSync(manifestPath, "utf8") !== text) { console.error("manifest.json is out of date: run node tools/gen-manifest.js"); process.exit(1); }
    console.log("manifest.json matches Schema.js (" + built.schema.length + " settings)");
} else {
    fs.writeFileSync(manifestPath, text);
    console.log("wrote manifest.json with " + built.schema.length + " settings");
}
