.pragma library

// The glow, blurred here instead of with the canvas' shadowBlur. The canvas rounds the blur to whole pixels
// and leans to one side, so one glow step looked stronger or lopsided and the next one did not change at all.
// This blur takes any radius, is the same on the left and on the right, and grows evenly with the setting.

// How wide a Gaussian of this blur is, expressed as three passes of a box blur (their radius, in pixels,
// may have a fraction). `blur` is meant like the shadowBlur of a canvas: its standard deviation is half of it.
function boxRadius(blur) {
    const sigma = Math.max(0, blur) / 2;
    return (Math.sqrt(4 * sigma * sigma + 1) - 1) / 2;
}

// one pass over every row (or column) of a w x h array of numbers, nothing outside it. The window
// is 2 * floor(r) + 1 values wide, with the part of r after the point as the weight of the two next to it.
// A running sum keeps it quick, which matters: this runs in the shell's JavaScript, not in compiled code.
function pass(src, dst, w, h, r, vertical) {
    const R = Math.floor(r), f = r - R;
    const n = vertical ? h : w, lines = vertical ? w : h;
    const step = vertical ? w : 1, lineStep = vertical ? 1 : w;
    const norm = 1 / (2 * R + 1 + 2 * f);
    for (let l = 0; l < lines; l++) {
        const base = l * lineStep;
        let sum = 0, i;
        for (i = 0; i <= R && i < n; i++) sum += src[base + i * step];
        for (let j = 0; j < n; j++) {
            let v = sum;
            if (f > 0) {
                if (j - R - 1 >= 0) v += f * src[base + (j - R - 1) * step];
                if (j + R + 1 < n) v += f * src[base + (j + R + 1) * step];
            }
            dst[base + j * step] = v * norm;
            const add = j + R + 1, rem = j - R;
            if (add < n) sum += src[base + add * step];
            if (rem >= 0) sum -= src[base + rem * step];
        }
    }
}

// alpha: Float32Array of w * h values from 0 to 1. Returns a new blurred one.
function blurAlpha(alpha, w, h, blur) {
    const r = boxRadius(blur);
    const a = new Float32Array(alpha), b = new Float32Array(alpha.length);
    if (r <= 0) return a;
    for (let k = 0; k < 3; k++) {
        pass(a, b, w, h, r, false);
        pass(b, a, w, h, r, true);
    }
    return a;
}

// How strong the light is where the pal's edge is, for a glow setting. It rises with the setting, in even steps,
// as the reach does, so glow 10 is brighter than glow 5 and dimmer than glow 15, and equally wide on every side.
function gainFor(glow) {
    const g = Math.max(0, Math.min(100, Number(glow) || 0));
    return 0.9 + g * 0.03;
}

// Turns the picture in `px` (RGBA bytes, the character in any color) into the glow: the same color as the
// character, with the alpha of the blurred shape. `px` is changed in place.
// Returns false when there is nothing to glow.
function glowInPlace(px, w, h, blur, glow) {
    const gain = gainFor(glow);
    const n = w * h, alpha = new Float32Array(n);
    let cr = 255, cg = 255, cb = 255, best = -1;
    for (let i = 0; i < n; i++) {
        const a = px[i * 4 + 3];
        alpha[i] = a / 255;
        if (a > best) { best = a; cr = px[i * 4]; cg = px[i * 4 + 1]; cb = px[i * 4 + 2]; }
    }
    if (best <= 0) return false;
    const out = blurAlpha(alpha, w, h, blur);
    for (let j = 0; j < n; j++) {
        const v = out[j] * gain;
        px[j * 4] = cr; px[j * 4 + 1] = cg; px[j * 4 + 2] = cb;
        px[j * 4 + 3] = Math.round(Math.max(0, Math.min(1, v)) * 255);
    }
    return true;
}

if (typeof module !== "undefined") module.exports = { boxRadius: boxRadius, blurAlpha: blurAlpha, glowInPlace: glowInPlace, gainFor: gainFor };
