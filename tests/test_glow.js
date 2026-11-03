#!/usr/bin/env node
// Glow tests: the blur has to be even on both sides and grow with the setting. Run: node tests/test_glow.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
let failed = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL " + m); failed++; } else console.log("ok   " + m); };
const load = (f) => { const sb = { module: { exports: {} }, console, Float32Array, Float64Array, Math };
    vm.runInNewContext(fs.readFileSync(path.join(root, "qml", "js", f), "utf8").replace(/^\s*\.pragma library.*$/m, ""), sb, { filename: f }); return sb.module.exports; };
const G = load("Glow.js");

const W = 64, H = 64;
const disc = () => { const a = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 31.5, y - 31.5) < 9) a[y * W + x] = 1; return a; };
const sum = (a) => a.reduce((s, v) => s + v, 0);
const asym = (a) => { let d = 0, t = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { d += Math.abs(a[y * W + x] - a[y * W + (W - 1 - x)]); t += a[y * W + x]; } return d / t; };
const asymV = (a) => { let d = 0, t = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { d += Math.abs(a[y * W + x] - a[(H - 1 - y) * W + x]); t += a[y * W + x]; } return d / t; };

ok(G.boxRadius(0) === 0, "no blur, no radius");
let prev = -1, even = true;
for (const b of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]) { const r = G.boxRadius(b); if (!(r > prev)) even = false; prev = r; }
ok(even, "the radius grows with every blur step");

// a symmetrical shape stays symmetrical: left and right, top and bottom, at whole and fractional radii
for (const b of [0.7, 1, 2.5, 3, 4.9, 7, 11.3]) {
    const o = G.blurAlpha(disc(), W, H, b);
    ok(asym(o) < 1e-6 && asymV(o) < 1e-6, "blur " + b + " is the same on both sides (" + asym(o).toExponential(1) + ")");
}
// light is not lost or made up inside the picture (the disc is far from the edges)
for (const b of [1, 3, 7]) ok(Math.abs(sum(G.blurAlpha(disc(), W, H, b)) - sum(disc())) < 1e-2 * sum(disc()), "blur " + b + " keeps the total light");
// more blur reaches further and is softer
const reach = (a) => { let m = 0; for (let x = 0; x < W; x++) if (a[32 * W + x] > 0.02) m = Math.max(m, Math.abs(x - 31.5)); return m; };
const rs = [1, 2, 3, 4, 5, 6].map((b) => reach(G.blurAlpha(disc(), W, H, b)));
ok(rs.every((v, i) => i === 0 || v >= rs[i - 1]) && rs[5] > rs[0], "the reach never shrinks as the blur grows (" + rs.join(", ") + ")");
// the glow settings 5, 10 and 15 (blur 1, 2, 3 at one size): the light outside the shape is evenly between
const outside = (b) => { const a = G.blurAlpha(disc(), W, H, b), d = disc(); let s = 0; for (let i = 0; i < a.length; i++) if (d[i] === 0) s += a[i]; return s; };
const o5 = outside(1.8), o10 = outside(3.6), o15 = outside(5.4);
ok(o5 < o10 && o10 < o15, "glow 5 < glow 10 < glow 15 in light outside the shape (" + [o5, o10, o15].map((v) => v.toFixed(1)).join(" < ") + ")");
ok(Math.abs((o10 - o5) - (o15 - o10)) < 0.12 * (o15 - o5), "glow 10 sits in the middle of 5 and 15");

// glowInPlace: same color, alpha of the blur, edges stay inside 0..255
const px = new Uint8ClampedArray(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 31.5, y - 31.5) < 9) { const i = (y * W + x) * 4; px[i] = 200; px[i + 1] = 100; px[i + 2] = 50; px[i + 3] = 255; }
ok(G.glowInPlace(px, W, H, 4, 10) === true, "glowInPlace finds the shape");
const c = (0 * W + 0) * 4;
ok(px[c] === 200 && px[c + 1] === 100 && px[c + 2] === 50, "the glow takes the color of the shape, also far from it");
ok(px[(32 * W + 31) * 4 + 3] === 255 && px[c + 3] === 0, "full light in the shape, none far away");
ok(G.glowInPlace(new Uint8ClampedArray(W * H * 4), W, H, 4, 10) === false, "an empty picture has no glow");
let mono = true; for (let x = 41; x < 62; x++) if (px[(32 * W + x + 1) * 4 + 3] > px[(32 * W + x) * 4 + 3]) mono = false;
ok(mono, "the glow fades out away from the shape");

// intensity: glow 5 < glow 10 < glow 15, and the steps are even
const g = (n) => G.gainFor(n);
ok(g(5) < g(10) && g(10) < g(15), "glow 5 is dimmer than 10, and 10 dimmer than 15 (" + [5, 10, 15].map((n) => g(n).toFixed(2)).join(", ") + ")");
ok(Math.abs((g(10) - g(5)) - (g(15) - g(10))) < 1e-9, "the intensity steps are even");
ok(g(0) > 0 && g(500) === g(100) && g(-5) === g(0), "the intensity is limited to the 0 to 100 range");
// the light that ends up on screen: peak next to the shape and the total, for glow 5, 10 and 15 at one pal size
const shown = (glow) => { const p = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 31.5, y - 31.5) < 9) { const i = (y * W + x) * 4; p[i] = 255; p[i + 1] = 255; p[i + 2] = 255; p[i + 3] = 255; }
    G.glowInPlace(p, W, H, glow * 0.36, glow); let tot = 0, peak = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 31.5, y - 31.5) >= 9) { const a = p[(y * W + x) * 4 + 3]; tot += a; peak = Math.max(peak, a); } return { tot, peak }; };
const s5 = shown(5), s10 = shown(10), s15 = shown(15);
ok(s5.peak < s10.peak && s10.peak < s15.peak, "peak light next to the shape: 5 < 10 < 15 (" + [s5, s10, s15].map((v) => v.peak).join(" < ") + ")");
ok(s5.tot < s10.tot && s10.tot < s15.tot, "total light around the shape: 5 < 10 < 15");
ok(Math.abs((s10.tot - s5.tot) - (s15.tot - s10.tot)) < 0.25 * (s15.tot - s5.tot), "glow 10 is about halfway between 5 and 15 in total light");

console.log(failed ? "\n" + failed + " failed" : "\nAll good.");
process.exit(failed ? 1 : 0);
