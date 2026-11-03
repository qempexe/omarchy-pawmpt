.pragma library

// Draws the built-in characters and the dress-up items on a canvas context, w by h.
// o: { kind, t (seconds), lookX, lookY (-1..1), blink (0..1), busy,
//      body, body2, eye, accent, outline, outlineWidth, pattern, patternColor, patternSize,
//      fill, glow, shine, blush, eyeStyle, mouthStyle }

const SCALE = 0.78;   // leaves room above the head for hats

// ---- where things are on each character (for dress and patterns) ------------------------------
function A(top, eyeY, eyeDx, eyeR, neckY, headW) {
    return { top: top, eyeY: eyeY, eyeDx: eyeDx, eyeR: eyeR, neckY: neckY, headW: headW };
}

// where the parts of a new character are, shared by its drawing and its layout
const geo = {};
geo.mahou = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.shonen = function(cx, base, s, b) { const r = s * 0.29 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.student = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.samurai = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.nekogirl = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.oni = function(cx, base, s, b) { const r = s * 0.34 * (1 + b); return { r: r, cy: base - r - s * 0.1 }; };
geo.builder = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.22 }; };
geo.speedster = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.25 }; };
geo.adventurer = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.22 }; };
geo.marine = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.18 }; };
geo.hunter = function(cx, base, s, b) { const r = s * 0.31 * (1 + b); return { r: r, cy: base - r - s * 0.16 }; };
geo.bomber = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.racer = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.17 }; };
geo.sidekick = function(cx, base, s, b) { const r = s * 0.33 * (1 + b); return { r: r, cy: base - r - s * 0.14 }; };
geo.elf = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.dwarf = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.17 }; };
geo.fairy = function(cx, base, s, b) { const r = s * 0.25 * (1 + b); return { r: r, cy: base - r - s * 0.3 }; };
geo.unicorn = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r * 1.02 - s * 0.02 }; };
geo.mermaid = function(cx, base, s, b) { const r = s * 0.23 * (1 + b); return { r: r, cy: base - s * 0.63 }; };
geo.goblin = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.phoenix = function(cx, base, s, b) { const r = s * 0.24 * (1 + b); return { r: r, cy: base - r * 1.4 - s * 0.1 }; };
geo.cyborg = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.android = function(cx, base, s, b) { const r = s * 0.27 * (1 + b); return { r: r, cy: base - r * 1.02 - s * 0.24 }; };
geo.ufo = function(cx, base, s, b) { const r = s * 0.26 * (1 + b); return { r: r, cy: base - s * 0.45 }; };
geo.spacecat = function(cx, base, s, b) { const r = s * 0.25 * (1 + b); return { r: r, cy: base - r * 1.35 - s * 0.1 }; };
geo.vampire = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.werewolf = function(cx, base, s, b) { const r = s * 0.29 * (1 + b); return { r: r, cy: base - r - s * 0.16 }; };
geo.mummy = function(cx, base, s, b) { const r = s * 0.29 * (1 + b); return { r: r, cy: base - r - s * 0.22 }; };
geo.zombie = function(cx, base, s, b) { const r = s * 0.28 * (1 + b); return { r: r, cy: base - r - s * 0.2 }; };
geo.yeti = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r * 1.15 - s * 0.1 }; };
geo.cyclops = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.17 }; };
geo.fox = function(cx, base, s, b) { const r = s * 0.29 * (1 + b); return { r: r, cy: base - r - s * 0.08 }; };
geo.bear = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r - s * 0.1 }; };
geo.hamster = function(cx, base, s, b) { const r = s * 0.33 * (1 + b); return { r: r, cy: base - r }; };
geo.sushi = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - r * 0.9 - s * 0.03 }; };
geo.ramen = function(cx, base, s, b) { const r = s * 0.26 * (1 + b); return { r: r, cy: base - r * 1.15 }; };
geo.pizza = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - s * 0.5 }; };
geo.donut = function(cx, base, s, b) { const r = s * 0.4 * (1 + b); return { r: r, cy: base - r * 0.85 - s * 0.02 }; };
geo.cupcake = function(cx, base, s, b) { const r = s * 0.26 * (1 + b); return { r: r, cy: base - r * 1.35 - s * 0.02 }; };
geo.burger = function(cx, base, s, b) { const r = s * 0.35 * (1 + b); return { r: r, cy: base - s * 0.28 - r * 0.35 }; };
geo.boba = function(cx, base, s, b) { const r = s * 0.25 * (1 + b); return { r: r, cy: base - s * 0.32 }; };
geo.dumpling = function(cx, base, s, b) { const r = s * 0.33 * (1 + b); return { r: r, cy: base - s * 0.08 - r * 0.55 }; };
geo.mushroom = function(cx, base, s, b) { const r = s * 0.32 * (1 + b); return { r: r, cy: base - s * 0.45 }; };
geo.cactus = function(cx, base, s, b) { const r = s * 0.18 * (1 + b); return { r: r, cy: base - s * 0.46 }; };
geo.sprout = function(cx, base, s, b) { const r = s * 0.27 * (1 + b); return { r: r, cy: base - s * 0.22 }; };
geo.cloud = function(cx, base, s, b) { const r = s * 0.26 * (1 + b); return { r: r, cy: base - s * 0.42 }; };
geo.sun = function(cx, base, s, b) { const r = s * 0.26 * (1 + b); return { r: r, cy: base - s * 0.5 }; };
geo.moon = function(cx, base, s, b) { const r = s * 0.32 * (1 + b); return { r: r, cy: base - s * 0.48 }; };
geo.snowman = function(cx, base, s, b) { const r = s * 0.21 * (1 + b); return { r: r, cy: base - s * 0.666 }; };
geo.invader = function(cx, base, s, b) { const u = s * 0.08 * (1 + b * 0.5); return { r: u, cy: base - s * 0.06 - 8 * u }; };
geo.chomper = function(cx, base, s, b) { const r = s * 0.32 * (1 + b); return { r: r, cy: base - r - s * 0.06 }; };
geo.pixelheart = function(cx, base, s, b) { const u = s * 0.072 * (1 + b * 0.5); return { r: u, cy: base - s * 0.03 - 10 * u }; };
geo.cartridge = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - s * 0.26 }; };
geo.joystick = function(cx, base, s, b) { const r = s * 0.2 * (1 + b); return { r: r, cy: base - s * 0.56 }; };
geo.cassette = function(cx, base, s, b) { const r = s * 0.25 * (1 + b); return { r: r, cy: base - s * 0.38 }; };
geo.duck = function(cx, base, s, b) { const r = s * 0.22 * (1 + b); return { r: r, cy: base - s * 0.56 }; };
geo.coffee = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - s * 0.32 }; };
geo.bulb = function(cx, base, s, b) { const r = s * 0.27 * (1 + b); return { r: r, cy: base - s * 0.55 }; };
geo.bug = function(cx, base, s, b) { const r = s * 0.2 * (1 + b); return { r: r, cy: base - s * 0.62 }; };
geo.terminal = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - s * 0.34 }; };
geo.floppy = function(cx, base, s, b) { const r = s * 0.3 * (1 + b); return { r: r, cy: base - s * 0.28 }; };
geo.keycat = function(cx, base, s, b) { const r = s * 0.25 * (1 + b); return { r: r, cy: base - s * 0.5 }; };
geo.paperclip = function(cx, base, s, b) { const r = s * 0.2 * (1 + b); return { r: r, cy: base - s * 0.54 }; };
geo.pencil = function(cx, base, s, b) { const r = s * 0.19 * (1 + b); return { r: r, cy: base - s * 0.4 }; };
geo.sticky = function(cx, base, s, b) { const r = s * 0.35 * (1 + b); return { r: r, cy: base - s * 0.4 }; };
geo.rocket = function(cx, base, s, b) { const r = s * 0.27 * (1 + b); return { r: r, cy: base - s * 0.55 }; };
geo.icecream = function(cx, base, s, b) { const r = s * 0.24 * (1 + b); return { r: r, cy: base - s * 0.45 }; };
geo.axolotl = function(cx, base, s, b) { const r = s * 0.34 * (1 + b); return { r: r, cy: base - s * 0.36 }; };
// @@more-geo

const layouts = {
    custom: function(cx, base, s) { return A(base - s * 0.84, base - s * 0.55, s * 0.14, s * 0.07, base - s * 0.25, s * 0.5); },
    blob: function(cx, base, s) { const ry = s * 0.38, cy = base - ry; return A(cy - ry, cy - ry * 0.1, s * 0.134, s * 0.085, cy + ry * 0.75, s * 0.84); },
    ghost: function(cx, base, s) { const r = s * 0.36, top = base - s * 0.86; return A(top, top + r * 0.95, r * 0.38, s * 0.08, top + r * 1.75, r * 2); },
    cat: function(cx, base, s) { const r = s * 0.34, cy = base - r - s * 0.02; return A(cy - r * 0.9, cy - r * 0.12, r * 0.4, s * 0.075, cy + r * 0.85, r * 2); },
    slime: function(cx, base, s) { const h = s * 0.62; return A(base - h, base - h * 0.58, s * 0.138, s * 0.08, base - h * 0.18, s * 0.8); },
    robot: function(cx, base, s) { const h = s * 0.56, y = base - h - s * 0.04; return A(y, y + h * 0.38, s * 0.154, s * 0.085, y + h, s * 0.6); },
    frog: function(cx, base, s) { const ry = s * 0.3, cy = base - ry; return A(cy - ry - s * 0.1, cy - ry - s * 0.05, s * 0.22, s * 0.09, cy + ry * 0.5, s * 0.8); },
    bunny: function(cx, base, s) { const r = s * 0.3, cy = base - r - s * 0.02; return A(cy - r, cy - r * 0.1, r * 0.45, s * 0.07, cy + r * 0.85, r * 2.2); },
    penguin: function(cx, base, s) { const ry = s * 0.38, cy = base - ry; return A(cy - ry, cy - ry * 0.35, s * 0.1, s * 0.06, cy + ry * 0.3, s * 0.54); },
    owl: function(cx, base, s) { const ry = s * 0.36, cy = base - ry; return A(cy - ry * 0.95, cy - ry * 0.3, s * 0.15, s * 0.085, cy + ry * 0.5, s * 0.6); },
    panda: function(cx, base, s) { const ry = s * 0.34, cy = base - ry - s * 0.02; return A(cy - ry, cy - ry * 0.05, s * 0.14, s * 0.06, cy + ry * 0.85, s * 0.76); },
    dog: function(cx, base, s) { const rx = s * 0.34, ry = s * 0.32, cy = base - ry - s * 0.02; return A(cy - ry, cy - ry * 0.25, rx * 0.42, s * 0.07, cy + ry * 0.8, rx * 1.9); },
    chibi: function(cx, base, s) { const r = s * 0.33, cy = base - r - s * 0.03; return A(cy - r * 1.1, cy + r * 0.2, r * 0.4, s * 0.075, cy + r * 0.9, r * 2.1); },
    kitsune: function(cx, base, s) { const rx = s * 0.36, ry = s * 0.3, cy = base - ry - s * 0.02; return A(cy - ry, cy - ry * 0.1, rx * 0.4, s * 0.07, cy + ry * 0.9, rx * 1.8); },
    ninja: function(cx, base, s) { const rx = s * 0.36, ry = s * 0.34, cy = base - ry - s * 0.02; return A(cy - ry, cy - ry * 0.05, rx * 0.38, s * 0.06, cy + ry * 0.85, rx * 1.9); },
    onigiri: function(cx, base, s) { return A(base - s * 0.74, base - s * 0.39, s * 0.08, s * 0.065, base - s * 0.186, s * 0.42); },
    hero: function(cx, base, s) { const r = s * 0.3, cy = base - r - s * 0.2; return A(cy - r, cy + r * 0.02, r * 0.4, s * 0.06, cy + r * 0.95, r * 2); },
    knight: function(cx, base, s) { const r = s * 0.32, cy = base - r - s * 0.05; return A(cy - r, cy, r * 0.3, s * 0.06, cy + r, r * 2); },
    wizard: function(cx, base, s) { const r = s * 0.26, cy = base - r - s * 0.05; return A(cy - r * 0.35, cy - r * 0.05, r * 0.42, s * 0.055, cy + r * 1.1, r * 2.2); },
    astronaut: function(cx, base, s) { const r = s * 0.34, cy = base - r - s * 0.1; return A(cy - r, cy + r * 0.05, r * 0.3, s * 0.065, cy + r, r * 2); },
    dragon: function(cx, base, s) { const rx = s * 0.36, ry = s * 0.31, cy = base - ry - s * 0.02; return A(cy - ry, cy - ry * 0.18, rx * 0.42, s * 0.075, cy + ry * 0.85, rx * 1.8); },
    alien: function(cx, base, s) { const rx = s * 0.3, ry = s * 0.38, cy = base - ry; return A(cy - ry, cy - ry * 0.05, rx * 0.45, s * 0.11, cy + ry * 0.9, rx * 2); },
    monster: function(cx, base, s) { const rx = s * 0.42, ry = s * 0.38, cy = base - ry; return A(cy - ry, cy - ry * 0.15, 0, s * 0.15, cy + ry * 0.8, rx * 1.9); },
    mahou: function(cx, base, s) { const g = geo.mahou(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.3, cy + r * 0.25, r * 0.44, s * 0.08, cy + r * 0.95, r * 2.2); },
    shonen: function(cx, base, s) { const g = geo.shonen(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy + r * 0.3, r * 0.42, s * 0.07, cy + r * 0.9, r * 2); },
    student: function(cx, base, s) { const g = geo.student(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.05, cy + r * 0.28, r * 0.4, s * 0.075, cy + r * 0.85, r * 2.3); },
    samurai: function(cx, base, s) { const g = geo.samurai(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.1, cy + r * 0.25, r * 0.4, s * 0.055, cy + r * 0.95, r * 1.9); },
    nekogirl: function(cx, base, s) { const g = geo.nekogirl(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy + r * 0.28, r * 0.42, s * 0.075, cy + r * 0.95, r * 2.2); },
    oni: function(cx, base, s) { const g = geo.oni(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.92, cy - r * 0.1, r * 0.4, s * 0.07, cy + r * 0.85, r * 2); },
    builder: function(cx, base, s) { const g = geo.builder(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.22, cy + r * 0.02, r * 0.28, s * 0.055, cy + r * 0.9, r * 2); },
    speedster: function(cx, base, s) { const g = geo.speedster(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy + r * 0.12, r * 0.4, s * 0.065, cy + r * 0.9, r * 2); },
    adventurer: function(cx, base, s) { const g = geo.adventurer(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.25, cy + r * 0.1, r * 0.38, s * 0.06, cy + r * 0.88, r * 1.9); },
    marine: function(cx, base, s) { const g = geo.marine(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.05, cy + r * 0.03, r * 0.38, s * 0.055, cy + r * 0.9, r * 2.2); },
    hunter: function(cx, base, s) { const g = geo.hunter(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.98, cy - r * 0.02, r * 0.3, s * 0.05, cy + r * 0.9, r * 2); },
    bomber: function(cx, base, s) { const g = geo.bomber(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.15, cy + r * 0.18, r * 0.38, s * 0.06, cy + r * 0.85, r * 2.1); },
    racer: function(cx, base, s) { const g = geo.racer(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.02, cy + r * 0.12, r * 0.38, s * 0.055, cy + r * 0.9, r * 2.16); },
    sidekick: function(cx, base, s) { const g = geo.sidekick(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy - r * 0.05, r * 0.36, s * 0.075, cy + r * 0.8, r * 2); },
    elf: function(cx, base, s) { const g = geo.elf(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy + r * 0.22, r * 0.38, s * 0.06, cy + r * 0.9, r * 2); },
    dwarf: function(cx, base, s) { const g = geo.dwarf(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.12, cy + r * 0.12, r * 0.36, s * 0.055, cy + r * 0.85, r * 2.04); },
    fairy: function(cx, base, s) { const g = geo.fairy(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.34, cy + r * 0.12, r * 0.38, s * 0.065, cy + r * 0.95, r * 1.8); },
    unicorn: function(cx, base, s) { const g = geo.unicorn(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.25, cy - r * 0.02, r * 0.42, s * 0.065, cy + r * 0.95, r * 1.7); },
    mermaid: function(cx, base, s) { const g = geo.mermaid(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy + r * 0.05, r * 0.4, s * 0.06, cy + r * 1.0, r * 2.0); },
    goblin: function(cx, base, s) { const g = geo.goblin(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.05, cy - r * 0.12, r * 0.42, s * 0.065, cy + r * 0.9, r * 2); },
    phoenix: function(cx, base, s) { const g = geo.phoenix(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy - r * 0.1, r * 0.4, s * 0.06, cy + r * 0.9, r * 2); },
    cyborg: function(cx, base, s) { const g = geo.cyborg(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy + r * 0.05, r * 0.38, s * 0.06, cy + r * 0.9, r * 2); },
    android: function(cx, base, s) { const g = geo.android(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.02, cy + r * 0.12, r * 0.36, s * 0.065, cy + r * 0.95, r * 1.76); },
    ufo: function(cx, base, s) { const g = geo.ufo(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.7, cy, r * 0.2, s * 0.05, cy + r * 0.4, r * 1.9); },
    spacecat: function(cx, base, s) { const g = geo.spacecat(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.25, cy, r * 0.38, s * 0.06, cy + r * 1.2, r * 2.5); },
    vampire: function(cx, base, s) { const g = geo.vampire(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy + r * 0.05, r * 0.38, s * 0.06, cy + r * 0.88, r * 2); },
    werewolf: function(cx, base, s) { const g = geo.werewolf(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy - r * 0.12, r * 0.4, s * 0.06, cy + r * 0.9, r * 2); },
    mummy: function(cx, base, s) { const g = geo.mummy(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy - r * 0.02, r * 0.38, s * 0.055, cy + r * 0.92, r * 2); },
    zombie: function(cx, base, s) { const g = geo.zombie(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy - r * 0.05, r * 0.4, s * 0.06, cy + r * 0.9, r * 2); },
    yeti: function(cx, base, s) { const g = geo.yeti(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.98, cy - r * 0.1, r * 0.36, s * 0.06, cy + r * 0.75, r * 2.1); },
    cyclops: function(cx, base, s) { const g = geo.cyclops(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.98, cy - r * 0.05, 0, s * 0.13, cy + r * 0.9, r * 2.1); },
    fox: function(cx, base, s) { const g = geo.fox(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy - r * 0.02, r * 0.42, s * 0.055, cy + r * 0.9, r * 2); },
    bear: function(cx, base, s) { const g = geo.bear(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.92, cy - r * 0.08, r * 0.42, s * 0.055, cy + r * 0.85, r * 2); },
    hamster: function(cx, base, s) { const g = geo.hamster(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.12, r * 0.56, s * 0.06, cy + r * 0.7, r * 2.5); },
    sushi: function(cx, base, s) { const g = geo.sushi(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.1, cy + r * 0.38, r * 0.4, s * 0.06, cy + r * 0.2, r * 2.3); },
    ramen: function(cx, base, s) { const g = geo.ramen(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.9, cy + r * 0.38, r * 0.5, s * 0.055, cy + r * 0.05, r * 2.6); },
    pizza: function(cx, base, s) { const g = geo.pizza(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.8, cy, s * 0.1, s * 0.055, cy + r * 0.8, s * 0.76); },
    donut: function(cx, base, s) { const g = geo.donut(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.85, cy - r * 0.32, r * 0.38, s * 0.055, cy + r * 0.7, r * 2); },
    cupcake: function(cx, base, s) { const g = geo.cupcake(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.75, cy, r * 0.42, s * 0.055, cy + r * 0.45, r * 2.6); },
    burger: function(cx, base, s) { const g = geo.burger(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.28 - r * 1.0, cy, r * 0.38, s * 0.055, base - s * 0.28, r * 2); },
    boba: function(cx, base, s) { const g = geo.boba(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.84, cy, r * 0.38, s * 0.055, base - s * 0.62, s * 0.54); },
    dumpling: function(cx, base, s) { const g = geo.dumpling(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.08 - r * 1.2, cy, r * 0.42, s * 0.06, base - s * 0.06, r * 2.5); },
    mushroom: function(cx, base, s) { const g = geo.mushroom(cx, base, s, 0), r = g.r; return A(base - s * 0.42 - r * 0.75, base - s * 0.2, r * 0.22, s * 0.05, base - s * 0.42, r * 2.4); },
    cactus: function(cx, base, s) { const g = geo.cactus(cx, base, s, 0), cy = g.cy; return A(base - s * 0.74, cy, s * 0.07, s * 0.05, base - s * 0.2, s * 0.36); },
    sprout: function(cx, base, s) { const g = geo.sprout(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.8, cy, r * 0.42, s * 0.055, base - s * 0.4, r * 2); },
    cloud: function(cx, base, s) { const g = geo.cloud(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy, r * 0.5, s * 0.06, cy + r * 0.85, r * 2.8); },
    sun: function(cx, base, s) { const g = geo.sun(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.05, r * 0.4, s * 0.06, cy + r * 0.95, r * 2); },
    moon: function(cx, base, s) { const g = geo.moon(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.05, r * 0.14, s * 0.045, cy + r * 0.9, r * 1.4); },
    snowman: function(cx, base, s) { const g = geo.snowman(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 1.0, cy - r * 0.1, r * 0.4, s * 0.045, cy + r * 0.95, r * 2); },
    invader: function(cx, base, s) { const g = geo.invader(cx, base, s, 0), u = g.r, cy = g.cy; return A(cy, cy + u * 3.5, u * 2, u * 0.55, cy + u * 6.5, u * 9); },
    chomper: function(cx, base, s) { const g = geo.chomper(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.3, r * 0.4, s * 0.06, cy + r * 0.5, r * 2); },
    pixelheart: function(cx, base, s) { const g = geo.pixelheart(cx, base, s, 0), u = g.r, cy = g.cy; return A(cy, cy + u * 3.5, u * 2, u * 0.6, cy + u * 8, u * 9); },
    cartridge: function(cx, base, s) { const g = geo.cartridge(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.8, cy, r * 0.34, s * 0.05, base - s * 0.18, s * 0.62); },
    joystick: function(cx, base, s) { const g = geo.joystick(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.05, r * 0.38, s * 0.05, cy + r * 1.0, r * 2); },
    cassette: function(cx, base, s) { const g = geo.cassette(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.62, cy, s * 0.15, s * 0.05, base - s * 0.2, s * 0.8); },
    duck: function(cx, base, s) { const g = geo.duck(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy - r * 0.12, r * 0.45, s * 0.05, cy + r * 0.9, r * 2); },
    coffee: function(cx, base, s) { const g = geo.coffee(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.6, cy, s * 0.12, s * 0.05, base - s * 0.3, s * 0.6); },
    bulb: function(cx, base, s) { const g = geo.bulb(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r, cy - r * 0.05, r * 0.4, s * 0.055, cy + r * 1.2, r * 2); },
    bug: function(cx, base, s) { const g = geo.bug(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.9, cy - r * 0.05, r * 0.42, s * 0.05, cy + r * 0.85, r * 2); },
    terminal: function(cx, base, s) { const g = geo.terminal(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.66, cy, s * 0.12, s * 0.05, base - s * 0.12, s * 0.78); },
    floppy: function(cx, base, s) { const g = geo.floppy(cx, base, s, 0), r = g.r, cy = g.cy; return A(base - s * 0.78, base - s * 0.28, s * 0.13, s * 0.05, base - s * 0.5, s * 0.74); },
    keycat: function(cx, base, s) { const g = geo.keycat(cx, base, s, 0), r = g.r, cy = g.cy; return A(cy - r * 0.95, cy - r * 0.05, r * 0.4, s * 0.055, cy + r * 0.9, r * 2); },
    paperclip: function(cx, base, s) { return A(base - s * 0.78, base - s * 0.6, s * 0.105, s * 0.065, base - s * 0.3, s * 0.42); },
    pencil: function(cx, base, s) { return A(base - s * 0.84, base - s * 0.47, s * 0.09, s * 0.055, base - s * 0.6, s * 0.38); },
    sticky: function(cx, base, s) { return A(base - s * 0.75, base - s * 0.46, s * 0.14, s * 0.06, base - s * 0.1, s * 0.7); },
    rocket: function(cx, base, s) { return A(base - s * 0.84, base - s * 0.5, s * 0.08, s * 0.045, base - s * 0.25, s * 0.5); },
    icecream: function(cx, base, s) { return A(base - s * 0.87, base - s * 0.47, s * 0.1, s * 0.05, base - s * 0.3, s * 0.5); },
    axolotl: function(cx, base, s) { return A(base - s * 0.66, base - s * 0.4, s * 0.2, s * 0.05, base - s * 0.18, s * 0.72); }
    // @@more-layouts
};

function layout(kind, w, h) {
    const s = Math.min(w, h) * SCALE, cx = w / 2, base = h * 0.94;
    const a = (layouts[kind] || layouts.custom)(cx, base, s);
    a.cx = cx; a.base = base; a.s = s;
    return a;
}

// does the character move by itself (so it needs repainting all the time)?
const animatedList = ["ghost", "slime", "robot", "nekogirl", "speedster", "bomber", "sidekick",
    "fairy", "mermaid", "phoenix", "android", "ufo", "spacecat", "mummy",
    "ramen", "cloud", "sun", "moon", "sprout",
    "invader", "chomper", "cassette", "coffee", "bulb", "bug", "terminal", "keycat", "rocket"];
function animated(kind) {
    return animatedList.indexOf(kind) >= 0;
}

// ---- small helpers ----------------------------------------------------------------------------
function oval(ctx, x, y, rx, ry) { ctx.ellipse(x - rx, y - ry, rx * 2, ry * 2); }
function poly(ctx, p) {
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath();
}
function fillOval(ctx, c, x, y, rx, ry) { ctx.fillStyle = c; ctx.beginPath(); oval(ctx, x, y, rx, ry); ctx.fill(); }
function fillPoly(ctx, c, p) { ctx.fillStyle = c; poly(ctx, p); ctx.fill(); }
function fillRect(ctx, c, x, y, w, h) { ctx.fillStyle = c; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); }

function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45, an = -Math.PI / 2 + i * Math.PI / 5;
        if (i === 0) ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
        else ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    }
    ctx.closePath(); ctx.fill();
}
function spark(ctx, x, y, r) {
    poly(ctx, [x, y - r, x + r * 0.25, y - r * 0.25, x + r, y, x + r * 0.25, y + r * 0.25,
               x, y + r, x - r * 0.25, y + r * 0.25, x - r, y, x - r * 0.25, y - r * 0.25]);
    ctx.fill();
}
function heart(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.4);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
    ctx.closePath(); ctx.fill();
}

// draws a sprite: rows of text ("." is empty), square cells of size u, top left at x0, y0.
// color(ch, column, row) gives each cell's color.
function sprite(ctx, rows, x0, y0, u, color) {
    for (let j = 0; j < rows.length; j++)
        for (let i = 0; i < rows[j].length; i++) {
            const ch = rows[j].charAt(i);
            if (ch === ".") continue;
            fillRect(ctx, color(ch, i, j), x0 + i * u - 0.2, y0 + j * u - 0.2, u + 0.4, u + 0.4);
        }
}

// n pointed tufts around an ellipse, between two angles (radians), sticking out by len
function tufts(ctx, c, cx, cy, rx, ry, n, len, a0, a1) {
    for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * (i + 0.5) / n, da = (a1 - a0) / n * 0.55;
        fillPoly(ctx, c, [cx + Math.cos(a - da) * rx, cy + Math.sin(a - da) * ry,
                          cx + Math.cos(a) * (rx + len), cy + Math.sin(a) * (ry + len),
                          cx + Math.cos(a + da) * rx, cy + Math.sin(a + da) * ry]);
    }
}

// ---- colors worked out from the skin ------------------------------------------------------------
// hair, clothes and toppings use these, so every skin (and Theme) still looks right.
function rgbOf(c) {
    if (typeof c !== "string") return null;
    let m = /^#(?:[0-9a-fA-F]{2})?([0-9a-fA-F]{6})$/.exec(c);
    if (m) return [parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16)];
    m = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(c);
    if (m) return [parseInt(m[1] + m[1], 16), parseInt(m[2] + m[2], 16), parseInt(m[3] + m[3], 16)];
    return null;
}
function mix(a, b, f) {
    const x = rgbOf(a), y = rgbOf(b);
    if (!x || !y) return a;
    const h = function(i) {
        const v = Math.max(0, Math.min(255, Math.round(x[i] + (y[i] - x[i]) * f)));
        return (v < 16 ? "0" : "") + v.toString(16);
    };
    return "#" + h(0) + h(1) + h(2);
}
function shade(c, f) { return mix(c, "#000000", f); }
function light(c, f) { return mix(c, "#ffffff", f); }
function lum(c) { const x = rgbOf(c); return x ? (0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]) / 255 : 0.5; }
// clothes: the body color, darker (or lighter when it is already dark)
function alt(o) { const c = o.bodyS || o.body; return lum(c) < 0.28 ? light(c, 0.3) : shade(c, 0.3); }
// a face and hands, from the details color
function skinTone(o) { return mix(o.accent, "#ffdcc2", 0.7); }
// a dark color for visors and screens, from the eye color
function ink(o) { return lum(o.eye) > 0.4 ? shade(o.eye, 0.78) : o.eye; }
// a small angry or worried eyebrow: t > 0 slopes down towards the right
function brow(ctx, x, y, w, t, o) {
    if (o.sil) return;
    ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, w * 0.22); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - t); ctx.lineTo(x + w / 2, y + t); ctx.stroke();
}
// a sweat drop, when it is working hard
function sweat(ctx, x, y, r, o) {
    if (o.sil || !o.busy) return;
    const c = mix(o.accent, "#8fd0ff", 0.7);
    fillPoly(ctx, c, [x, y - r * 1.5, x + r * 0.7, y, x - r * 0.7, y]);
    fillOval(ctx, c, x, y, r * 0.7, r * 0.7);
}

// ---- the whole character ----------------------------------------------------------------------
function draw(ctx, w, h, o) {
    ctx.clearRect(0, 0, w, h);
    const s = Math.min(w, h) * SCALE, cx = w / 2, base = h * 0.94;
    const breath = o.breathe === false ? 0 : Math.sin(o.t * 2.2) * 0.03;
    const fn = shapes[o.kind] || shapes.blob;
    const a = layout(o.kind, w, h);

    if ((o.glow || 0) > 0 && !o.noGlow)
        silhouette(ctx, fn, cx, base, s, breath, o, o.accent, o.glow * s / 120, 0, 0);
    if ((o.outlineWidth || 0) > 0) {
        const d = Math.max(1, o.outlineWidth * s / 80);
        // a thin outline needs only the four sides; a thick one needs the diagonals too
        const dirs = d <= 2.2 ? [[d, 0], [-d, 0], [0, d], [0, -d]]
            : [[d, 0], [-d, 0], [0, d], [0, -d], [d * 0.7, d * 0.7], [-d * 0.7, d * 0.7], [d * 0.7, -d * 0.7], [-d * 0.7, -d * 0.7]];
        for (let i = 0; i < dirs.length; i++) silhouette(ctx, fn, cx, base, s, breath, o, o.outline, 0, dirs[i][0], dirs[i][1]);
    }

    ctx.save();
    ctx.lineJoin = "round";
    let q = Object.assign({}, o, { bodyS: o.body });
    if (o.fill === "vertical") {
        const g = ctx.createLinearGradient(0, a.top, 0, base);
        g.addColorStop(0, o.body); g.addColorStop(1, o.body2);
        q = Object.assign({}, o, { body: g, bodyS: o.body });
    } else if (o.fill === "radial") {
        const g2 = ctx.createRadialGradient(cx, base - s * 0.4, 0, cx, base - s * 0.4, s * 0.55);
        g2.addColorStop(0, o.body); g2.addColorStop(1, o.body2);
        q = Object.assign({}, o, { body: g2, bodyS: o.body });
    }
    const eyes = fn(ctx, cx, base, s, breath, q);
    if (o.pattern && o.pattern !== "none") pattern(ctx, a, o, s);
    let mx = 0;
    for (let m = 0; m < eyes.length; m++) mx += eyes[m].x / Math.max(1, eyes.length);
    for (let k = 0; k < eyes.length; k++) {
        eyes[k].side = eyes.length > 1 ? (eyes[k].x < mx - 0.01 ? -1 : (eyes[k].x > mx + 0.01 ? 1 : 0)) : 0;
        eye(ctx, eyes[k], o);
    }
    ctx.restore();
}

// only the glow, on its own: drawn once into a layer of its own, so it is not redone every frame
function haloOnly(ctx, w, h, o) {
    ctx.clearRect(0, 0, w, h);
    if (!((o.glow || 0) > 0)) return;
    const s = Math.min(w, h) * SCALE, cx = w / 2, base = h * 0.94;
    const fn = shapes[o.kind] || shapes.blob;
    silhouette(ctx, fn, cx, base, s, 0, o, o.accent, Math.min(o.glow * s / 120 * (o.haloScale || 1), o.blurCap || 48), 0, 0);
}

// the shape of the character alone, in whatever colors it has: the glow is made from its alpha (see Glow.js)
function haloMask(ctx, w, h, o) {
    ctx.clearRect(0, 0, w, h);
    const s = Math.min(w, h) * SCALE, cx = w / 2, base = h * 0.94;
    const fn = shapes[o.kind] || shapes.blob;
    silhouette(ctx, fn, cx, base, s, 0, o, "rgba(0,0,0,0)", 0, 0, 0);
}

// the character drawn once more with a shadow: a glow, or one side of the outline
function silhouette(ctx, fn, cx, base, s, b, o, color, blur, dx, dy) {
    const q = Object.assign({}, o, { sil: true, bodyS: o.body });
    ctx.save();
    ctx.lineJoin = "round";
    ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy;
    fn(ctx, cx, base, s, b, q);
    ctx.restore();
}

function pattern(ctx, a, o, s) {
    const k = (o.patternSize || 100) / 100, x0 = a.cx - a.headW * 0.5, x1 = a.cx + a.headW * 0.5;
    const y0 = a.top, y1 = a.base, bw = x1 - x0, bh = y1 - y0, W = a.cx * 2;
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = o.patternColor;
    if (o.pattern === "stripes") {
        const step = s * 0.13 * k;
        for (let y = y0; y < y1 + step; y += step) fillRect(ctx, o.patternColor, 0, y, W, step * 0.45);
    } else {
        const pts = [[0.2, 0.3], [0.75, 0.22], [0.5, 0.5], [0.15, 0.68], [0.82, 0.62], [0.42, 0.82], [0.62, 0.12], [0.3, 0.5]];
        for (let i = 0; i < pts.length; i++) {
            const px = x0 + bw * pts[i][0], py = y0 + bh * pts[i][1], r = s * 0.05 * k;
            ctx.fillStyle = o.patternColor;
            if (o.pattern === "spots") { ctx.beginPath(); oval(ctx, px, py, r, r); ctx.fill(); }
            else if (o.pattern === "stars") star(ctx, px, py, r * 1.2);
            else if (o.pattern === "hearts") heart(ctx, px, py, r);
        }
    }
    ctx.restore();
}

function eye(ctx, e, o) {
    const st = (o.eyeStyle && o.eyeStyle !== "normal") ? o.eyeStyle : (e.style || "normal");
    const r = e.r * (st === "wide" ? 1.25 : 1);
    const lx = o.lookX * r * 0.45, ly = o.lookY * r * 0.35;
    const open = 1 - o.blink;
    if (st === "glossy") {
        const gy = Math.max(0.6, r * 1.3 * open);
        ctx.fillStyle = o.eye; ctx.beginPath(); oval(ctx, e.x + lx * 0.6, e.y + ly * 0.5, r * 0.95, gy); ctx.fill();
        if (open > 0.35) {
            ctx.fillStyle = light(o.eye, 0.35); ctx.beginPath(); oval(ctx, e.x + lx * 0.6, e.y + ly * 0.5 + gy * 0.45, r * 0.6, gy * 0.4); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); oval(ctx, e.x + lx * 0.6 - r * 0.32, e.y + ly * 0.5 - gy * 0.38, r * 0.3, r * 0.3); ctx.fill();
            ctx.beginPath(); oval(ctx, e.x + lx * 0.6 + r * 0.32, e.y + ly * 0.5 + gy * 0.4, r * 0.14, r * 0.14); ctx.fill();
        }
        return;
    }
    if (st === "real") {
        // a shaded eyeball, an iris with a dark rim and a pupil that follows the look, two catchlights,
        // and the shadow and the line of the upper lid
        const ew = r * 1.2, eh = Math.max(0.7, r * 0.95 * open);
        const gs = ctx.createRadialGradient(e.x, e.y - eh * 0.2, eh * 0.1, e.x, e.y, ew);
        gs.addColorStop(0, "#ffffff"); gs.addColorStop(0.7, "#f4f0ed"); gs.addColorStop(1, "#cdc5c0");
        ctx.fillStyle = gs; ctx.beginPath(); oval(ctx, e.x, e.y, ew, eh); ctx.fill();
        if (open > 0.3) {
            const ic = lum(o.eye) < 0.2 ? mix(o.eye, o.accent, 0.35) : o.eye;
            const ir = Math.min(eh * 0.98, r * 0.66), iry = Math.min(ir, eh * 0.98);
            const ix = e.x + o.lookX * (ew - ir) * 0.7, iy = e.y + o.lookY * Math.max(0, eh - iry) * 0.5;
            const gi = ctx.createRadialGradient(ix, iy, ir * 0.15, ix, iy, ir);
            gi.addColorStop(0, light(ic, 0.45)); gi.addColorStop(0.65, ic); gi.addColorStop(1, shade(ic, 0.6));
            ctx.fillStyle = gi; ctx.beginPath(); oval(ctx, ix, iy, ir, iry); ctx.fill();
            fillOval(ctx, "#0b0b10", ix, iy, ir * 0.42, iry * 0.42);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.beginPath(); oval(ctx, ix - ir * 0.35, iy - iry * 0.38, ir * 0.26, ir * 0.26); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.beginPath(); oval(ctx, ix + ir * 0.32, iy + iry * 0.36, ir * 0.12, ir * 0.12); ctx.fill();
        }
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = Math.max(1, r * 0.34);
        ctx.beginPath(); ctx.moveTo(e.x - ew * 0.92, e.y - eh * 0.1); ctx.bezierCurveTo(e.x - ew * 0.6, e.y - eh * 1.25, e.x + ew * 0.6, e.y - eh * 1.25, e.x + ew * 0.92, e.y - eh * 0.1); ctx.stroke();
        ctx.strokeStyle = ink(o); ctx.lineWidth = Math.max(1, r * 0.2);
        ctx.beginPath(); ctx.moveTo(e.x - ew, e.y); ctx.bezierCurveTo(e.x - ew * 0.65, e.y - eh * 1.3, e.x + ew * 0.65, e.y - eh * 1.3, e.x + ew, e.y); ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = Math.max(0.8, r * 0.1);
        ctx.beginPath(); ctx.moveTo(e.x - ew * 0.85, e.y + eh * 0.2); ctx.bezierCurveTo(e.x - ew * 0.5, e.y + eh * 1.1, e.x + ew * 0.5, e.y + eh * 1.1, e.x + ew * 0.85, e.y + eh * 0.2); ctx.stroke();
        return;
    }
    if (st === "angry" || st === "lashes") {
        // the normal eye, with a slanted lid over it (angry) or long lashes on the outer side (lashes)
        eye(ctx, Object.assign({}, e, { style: "normal" }), Object.assign({}, o, { eyeStyle: "normal" }));
        const sd = e.side || 0, inner = -sd;
        if (st === "angry") {
            const lidTop = e.y - r * 1.25 * open - r * 0.1;
            fillPoly(ctx, o.bodyS || o.body, [e.x - r * 1.2, lidTop, e.x + r * 1.2, lidTop,
                e.x + inner * r * 1.2, e.y - r * 0.05 + r * 0.2 * (1 - open), e.x - inner * r * 1.2, e.y - r * 0.6]);
            ctx.strokeStyle = ink(o); ctx.lineWidth = Math.max(1, r * 0.28); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(e.x - inner * r * 1.15, e.y - r * 0.6); ctx.lineTo(e.x + inner * r * 1.15, e.y - r * 0.05); ctx.stroke();
        } else {
            ctx.strokeStyle = ink(o); ctx.lineCap = "round";
            ctx.lineWidth = Math.max(1, r * 0.22);
            ctx.beginPath(); ctx.moveTo(e.x - r, e.y - r * 0.2 * open); ctx.quadraticCurveTo(e.x, e.y - r * 1.25 * open, e.x + r, e.y - r * 0.2 * open); ctx.stroke();
            ctx.lineWidth = Math.max(0.8, r * 0.16);
            const sides = sd === 0 ? [-1, 1] : [sd];
            for (let si = 0; si < sides.length; si++)
                for (let li = 0; li < 3; li++) {
                    const lx0 = e.x + sides[si] * r * (0.55 + li * 0.22), ly0 = e.y - r * (0.85 - li * 0.1) * open;
                    ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx0 + sides[si] * r * 0.38, ly0 - r * (0.42 - li * 0.06)); ctx.stroke();
                }
        }
        return;
    }
    if (st === "slit") {
        const sh = Math.max(0.7, r * 1.05 * open), sw = r * 1.1;
        const gc = ctx.createRadialGradient(e.x, e.y, sh * 0.1, e.x, e.y, sw);
        gc.addColorStop(0, light(o.accent, 0.35)); gc.addColorStop(1, mix(o.accent, o.eye, 0.35));
        ctx.fillStyle = gc; ctx.beginPath(); oval(ctx, e.x, e.y, sw, sh); ctx.fill();
        if (open > 0.3) {
            ctx.fillStyle = o.eye; ctx.beginPath(); oval(ctx, e.x + o.lookX * r * 0.3, e.y + o.lookY * r * 0.15, Math.max(0.5, r * 0.22), sh * 0.95); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); oval(ctx, e.x - r * 0.35, e.y - sh * 0.4, r * 0.18, r * 0.18); ctx.fill();
        }
        return;
    }
    if (st === "hearts" || st === "stars") {
        const hr = r * (0.55 + 0.45 * open);
        const pink = mix(o.accent, "#ff3b6b", 0.65), gold = mix(o.accent, "#ffd34d", 0.7);
        ctx.fillStyle = st === "hearts" ? pink : gold;
        if (st === "hearts") heart(ctx, e.x + lx * 0.3, e.y + ly * 0.3, hr);
        else { star(ctx, e.x + lx * 0.3, e.y + ly * 0.3, hr * 1.25); ctx.fill(); }
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); oval(ctx, e.x + lx * 0.3 - hr * 0.35, e.y + ly * 0.3 - hr * 0.35, hr * 0.2, hr * 0.2); ctx.fill();
        return;
    }
    if (st === "cross") {
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1.2, r * 0.36); ctx.lineCap = "round";
        const cr = r * 0.75;
        ctx.beginPath(); ctx.moveTo(e.x - cr, e.y - cr); ctx.lineTo(e.x + cr, e.y + cr); ctx.moveTo(e.x + cr, e.y - cr); ctx.lineTo(e.x - cr, e.y + cr); ctx.stroke();
        return;
    }
    if (st === "happy") {
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1.2, r * 0.38); ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(e.x, e.y + r * 0.35, r * 0.85, 1.12 * Math.PI, 1.88 * Math.PI); ctx.stroke();
        return;
    }
    if (st === "alien") {
        ctx.fillStyle = o.eye; ctx.beginPath(); ctx.ellipse(e.x - r * 1.1, e.y - r * 0.8 * open, r * 2.2, Math.max(0.6, r * 1.6 * open)); ctx.fill();
        if (open > 0.4) { ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); oval(ctx, e.x - r * 0.4 + lx, e.y - r * 0.3 + ly, r * 0.3, r * 0.25); ctx.fill(); }
        return;
    }
    if (st === "dots" || st === "round") {
        const dr = r * (st === "dots" ? 0.7 : 1);
        ctx.fillStyle = o.eye; ctx.beginPath(); ctx.ellipse(e.x - dr, e.y - dr * open, dr * 2, Math.max(0.6, dr * 2 * open)); ctx.fill();
        if (open > 0.4) { ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); oval(ctx, e.x - dr * 0.3 + lx * 0.4, e.y - dr * 0.35 + ly * 0.4, dr * 0.32, dr * 0.32); ctx.fill(); }
        return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    if (e.square) ctx.rect(e.x - r, e.y - r * open, r * 2, r * 2 * open);
    else ctx.ellipse(e.x - r, e.y - r * open, r * 2, Math.max(0.6, r * 2 * open));
    ctx.fill();
    if (open < 0.25) return;
    ctx.fillStyle = o.eye;
    ctx.beginPath();
    const pr = r * (st === "sparkle" ? 0.82 : (st === "wide" ? 0.4 : 0.55));
    if (e.square) ctx.rect(e.x + lx - pr, e.y + ly - pr, pr * 2, pr * 2);
    else oval(ctx, e.x + lx, e.y + ly, pr, pr);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); oval(ctx, e.x + lx - pr * 0.1 + pr * 0.1, e.y + ly - pr * 0.4, pr * 0.3, pr * 0.3); ctx.fill();
    if (st === "sparkle") { ctx.beginPath(); oval(ctx, e.x + lx + pr * 0.35, e.y + ly + pr * 0.35, pr * 0.16, pr * 0.16); ctx.fill(); }
    if (st === "sleepy") {
        ctx.fillStyle = o.body;
        ctx.beginPath(); ctx.rect(e.x - r - 1, e.y - r - 1, r * 2 + 2, r * 1.1); ctx.fill();
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, r * 0.2);
        ctx.beginPath(); ctx.moveTo(e.x - r, e.y + r * 0.1); ctx.lineTo(e.x + r, e.y + r * 0.1); ctx.stroke();
    }
}

function cheeks(ctx, x1, x2, y, r, o) {
    if (o.sil || o.blush === false) return;
    ctx.fillStyle = o.accent;
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); oval(ctx, x1, y - r * 0.6 + r * 0.6, r, r * 0.6); ctx.fill();
    ctx.beginPath(); oval(ctx, x2, y, r, r * 0.6); ctx.fill();
    ctx.globalAlpha = 1;
}

function mouth(ctx, x, y, r, o) {
    if (o.sil) return;
    const st = o.busy ? "open" : (o.mouthStyle || "smile");
    if (st === "none") return;
    ctx.strokeStyle = o.eye;
    ctx.lineWidth = Math.max(1, r * 0.35);
    ctx.lineCap = "round";
    if (st === "open") { ctx.fillStyle = o.eye; ctx.beginPath(); oval(ctx, x, y - r * 0.1, r * 0.75, r * 0.9); ctx.fill(); return; }
    if (st === "real") {
        // two lips with their own shading, the line between them, and a highlight on the lower one
        const w = r * 1.25, yy = y - r * 0.15;
        const lip = mix(o.accent, "#b03050", 0.45), dark = shade(lip, 0.55);
        ctx.fillStyle = light(lip, 0.2);
        ctx.beginPath(); ctx.moveTo(x - w * 0.88, yy + r * 0.08);
        ctx.quadraticCurveTo(x, yy + r * 1.0, x + w * 0.88, yy + r * 0.08);
        ctx.quadraticCurveTo(x, yy + r * 0.32, x - w * 0.88, yy + r * 0.08); ctx.fill();
        ctx.fillStyle = lip;
        ctx.beginPath(); ctx.moveTo(x - w, yy);
        ctx.quadraticCurveTo(x - w * 0.45, yy - r * 0.55, x, yy - r * 0.18);
        ctx.quadraticCurveTo(x + w * 0.45, yy - r * 0.55, x + w, yy);
        ctx.quadraticCurveTo(x, yy + r * 0.3, x - w, yy); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = Math.max(0.8, r * 0.15); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.quadraticCurveTo(x, yy + r * 0.34, x + w, yy); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); oval(ctx, x - w * 0.12, yy + r * 0.52, w * 0.28, r * 0.1); ctx.fill();
        return;
    }
    if (st === "grin") {
        // a wide open smile with teeth
        ctx.fillStyle = o.eye;
        ctx.beginPath(); ctx.moveTo(x - r * 1.15, y - r * 0.55); ctx.quadraticCurveTo(x, y + r * 1.25, x + r * 1.15, y - r * 0.55);
        ctx.quadraticCurveTo(x, y - r * 0.2, x - r * 1.15, y - r * 0.55); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.moveTo(x - r * 0.95, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 0.12, x + r * 0.95, y - r * 0.5);
        ctx.lineTo(x + r * 0.8, y - r * 0.2); ctx.quadraticCurveTo(x, y + r * 0.1, x - r * 0.8, y - r * 0.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(0.8, r * 0.12);
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.38); ctx.lineTo(x, y - r * 0.14); ctx.stroke();
        return;
    }
    if (st === "tongue") {
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, r * 0.3); ctx.lineCap = "round";
        const tg = mix(o.accent, "#ff6f91", 0.55);
        fillOval(ctx, tg, x + r * 0.3, y + r * 0.3, r * 0.42, r * 0.55);
        ctx.strokeStyle = shade(tg, 0.35); ctx.lineWidth = Math.max(0.8, r * 0.1);
        ctx.beginPath(); ctx.moveTo(x + r * 0.3, y + r * 0.0); ctx.lineTo(x + r * 0.3, y + r * 0.5); ctx.stroke();
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, r * 0.3);
        ctx.beginPath(); ctx.arc(x, y - r * 0.4, r, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
        return;
    }
    if (st === "smirk") {
        ctx.beginPath(); ctx.moveTo(x - r * 0.75, y - r * 0.05);
        ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.2, x + r * 0.85, y - r * 0.55); ctx.stroke();
        ctx.lineWidth = Math.max(0.8, r * 0.18);
        ctx.beginPath(); ctx.moveTo(x + r * 0.85, y - r * 0.55); ctx.lineTo(x + r * 1.0, y - r * 0.4); ctx.stroke();
        return;
    }
    if (st === "wavy") {
        ctx.beginPath(); ctx.moveTo(x - r * 1.0, y - r * 0.25);
        for (let wi = 1; wi <= 12; wi++) ctx.lineTo(x - r * 1.0 + wi * r * 2 / 12, y - r * 0.25 + Math.sin(wi * Math.PI / 2) * r * 0.22);
        ctx.stroke();
        return;
    }
    if (st === "pout") {
        const pl = mix(o.accent, "#b03050", 0.4);
        fillOval(ctx, pl, x, y - r * 0.1, r * 0.42, r * 0.36);
        ctx.strokeStyle = shade(pl, 0.5); ctx.lineWidth = Math.max(0.8, r * 0.14);
        ctx.beginPath(); oval(ctx, x, y - r * 0.1, r * 0.42, r * 0.36); ctx.stroke();
        fillOval(ctx, "rgba(255,255,255,0.4)", x - r * 0.12, y - r * 0.22, r * 0.12, r * 0.08);
        return;
    }
    ctx.beginPath();
    if (st === "flat") { ctx.moveTo(x - r * 0.8, y - r * 0.3); ctx.lineTo(x + r * 0.8, y - r * 0.3); ctx.stroke(); return; }
    if (st === "cat") {
        ctx.arc(x - r * 0.55, y - r * 0.5, r * 0.55, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + r * 0.55, y - r * 0.5, r * 0.55, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke();
        return;
    }
    ctx.arc(x, y - r * 0.4, r, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    if (st === "fang") fillPoly(ctx, "#ffffff", [x + r * 0.35, y + r * 0.2, x + r * 0.75, y + r * 0.1, x + r * 0.55, y + r * 0.75]);
}

// ---- the characters ---------------------------------------------------------------------------
// Each draws its body and returns where the eyes go: [{ x, y, r, square, style }].
var shapes = {
    blob: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.42 * (1 + b), ry = s * 0.38 * (1 - b);
        const cy = base - ry;
        fillOval(ctx, o.body, cx, cy, rx, ry);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", cx - rx * 0.4, cy - ry * 0.62, rx * 0.25, ry * 0.175);
        cheeks(ctx, cx - rx * 0.55, cx + rx * 0.55, cy + ry * 0.2, s * 0.06, o);
        mouth(ctx, cx, cy + ry * 0.3, s * 0.06, o);
        return [{ x: cx - rx * 0.32, y: cy - ry * 0.1, r: s * 0.085 }, { x: cx + rx * 0.32, y: cy - ry * 0.1, r: s * 0.085 }];
    },
    ghost: function(ctx, cx, base, s, b, o) {
        const r = s * 0.36, top = base - s * 0.86 - b * s * 0.2;
        const bottom = base - s * 0.06;
        ctx.fillStyle = o.body;
        ctx.beginPath();
        ctx.moveTo(cx - r, top + r);
        ctx.arc(cx, top + r, r, Math.PI, 0);
        ctx.lineTo(cx + r, bottom);
        const waves = 4, ww = (2 * r) / waves;
        for (let i = 0; i < waves; i++) {
            const x0 = cx + r - i * ww;
            const wob = Math.sin(o.t * 4 + i) * s * 0.03;
            ctx.quadraticCurveTo(x0 - ww / 2, bottom + s * 0.07 + wob, x0 - ww, bottom);
        }
        ctx.closePath(); ctx.fill();
        cheeks(ctx, cx - r * 0.6, cx + r * 0.6, top + r * 1.35, s * 0.05, o);
        mouth(ctx, cx, top + r * 1.45, s * 0.05, o);
        return [{ x: cx - r * 0.38, y: top + r * 0.95, r: s * 0.08 }, { x: cx + r * 0.38, y: top + r * 0.95, r: s * 0.08 }];
    },
    cat: function(ctx, cx, base, s, b, o) {
        const r = s * 0.34 * (1 + b), cy = base - r - s * 0.02;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.85, cy - r * 0.35, cx + d * r * 0.75, cy - r * 1.35, cx + d * r * 0.15, cy - r * 0.85]);
            fillPoly(ctx, o.accent, [cx + d * r * 0.7, cy - r * 0.55, cx + d * r * 0.68, cy - r * 1.1, cx + d * r * 0.3, cy - r * 0.8]);
        });
        fillOval(ctx, o.body, cx, cy, r, r * 0.9);
        if (!o.sil) {
            ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, s * 0.012); ctx.globalAlpha = 0.6;
            [-1, 1].forEach(function(d) {
                for (let k = -1; k <= 1; k++) {
                    ctx.beginPath();
                    ctx.moveTo(cx + d * r * 0.35, cy + r * 0.3 + k * s * 0.03);
                    ctx.lineTo(cx + d * r * 1.05, cy + r * 0.25 + k * s * 0.06);
                    ctx.stroke();
                }
            });
            ctx.globalAlpha = 1;
        }
        fillPoly(ctx, o.accent, [cx - s * 0.03, cy + r * 0.12, cx + s * 0.03, cy + r * 0.12, cx, cy + r * 0.2]);
        mouth(ctx, cx, cy + r * 0.38, s * 0.045, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.12, r: s * 0.075 }, { x: cx + r * 0.4, y: cy - r * 0.12, r: s * 0.075 }];
    },
    slime: function(ctx, cx, base, s, b, o) {
        const w = s * 0.46 * (1 + b * 1.5), hgt = s * 0.62 * (1 - b * 1.5);
        ctx.fillStyle = o.body;
        ctx.beginPath();
        ctx.moveTo(cx - w, base);
        ctx.bezierCurveTo(cx - w, base - hgt * 0.9, cx - w * 0.5, base - hgt * 1.15, cx, base - hgt);
        ctx.bezierCurveTo(cx + w * 0.5, base - hgt * 1.15, cx + w, base - hgt * 0.9, cx + w, base);
        ctx.closePath(); ctx.fill();
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.3)", cx - w * 0.4, base - hgt * 0.76, w * 0.15, hgt * 0.09);
        const dy = (o.t * 0.5 % 1) * s * 0.06;
        fillOval(ctx, o.accent, cx + w * 0.5, base - hgt * 0.3 + dy, s * 0.025, s * 0.035);
        mouth(ctx, cx, base - hgt * 0.32, s * 0.055, o);
        return [{ x: cx - w * 0.3, y: base - hgt * 0.58, r: s * 0.08 }, { x: cx + w * 0.3, y: base - hgt * 0.58, r: s * 0.08 }];
    },
    robot: function(ctx, cx, base, s, b, o) {
        const w = s * 0.7, hgt = s * 0.56, x = cx - w / 2, y = base - hgt - s * 0.04 - b * s * 0.3;
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - s * 0.16); ctx.stroke();
        fillOval(ctx, (Math.floor(o.t * 2) % 2 === 0 || o.busy) ? o.accent : o.eye, cx, y - s * 0.21, s * 0.05, s * 0.05);
        ctx.fillStyle = o.body;
        roundRect(ctx, x, y, w, hgt, s * 0.12); ctx.fill();
        ctx.fillStyle = o.accent;
        roundRect(ctx, x - s * 0.06, y + hgt * 0.35, s * 0.06, hgt * 0.3, s * 0.02); ctx.fill();
        roundRect(ctx, x + w, y + hgt * 0.35, s * 0.06, hgt * 0.3, s * 0.02); ctx.fill();
        if (!o.sil) {
            ctx.fillStyle = o.eye; ctx.globalAlpha = 0.85;
            roundRect(ctx, cx - w * 0.22, y + hgt * 0.68, w * 0.44, hgt * 0.12, s * 0.02); ctx.fill();
            ctx.globalAlpha = 1;
        }
        return [{ x: cx - w * 0.22, y: y + hgt * 0.38, r: s * 0.085, square: true }, { x: cx + w * 0.22, y: y + hgt * 0.38, r: s * 0.085, square: true }];
    },
    frog: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.44 * (1 + b), ry = s * 0.3 * (1 - b), cy = base - ry;
        fillOval(ctx, o.body, cx - s * 0.22, cy - ry - s * 0.05, s * 0.14, s * 0.13);
        fillOval(ctx, o.body, cx + s * 0.22, cy - ry - s * 0.05, s * 0.14, s * 0.13);
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.accent, cx, cy + ry * 0.4, rx * 0.6, ry * 0.5);
        cheeks(ctx, cx - rx * 0.7, cx + rx * 0.7, cy - ry * 0.1, s * 0.05, o);
        if (!o.sil) {
            ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, s * 0.02);
            ctx.beginPath(); ctx.moveTo(cx - rx * 0.4, cy - ry * 0.25); ctx.quadraticCurveTo(cx, cy + ry * (o.busy ? 0.3 : 0.05), cx + rx * 0.4, cy - ry * 0.25); ctx.stroke();
        }
        return [{ x: cx - s * 0.22, y: cy - ry - s * 0.05, r: s * 0.09 }, { x: cx + s * 0.22, y: cy - ry - s * 0.05, r: s * 0.09 }];
    },

    // ---- animals
    bunny: function(ctx, cx, base, s, b, o) {
        const r = s * 0.3 * (1 + b), cy = base - r - s * 0.02;
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * s * 0.14, cy - r - s * 0.08, s * 0.07, s * 0.2);
            fillOval(ctx, o.accent, cx + d * s * 0.14, cy - r - s * 0.06, s * 0.035, s * 0.14);
        });
        fillOval(ctx, o.body, cx, cy, r * 1.15, r);
        cheeks(ctx, cx - r * 0.75, cx + r * 0.75, cy + r * 0.3, s * 0.05, o);
        fillOval(ctx, o.accent, cx, cy + r * 0.12, s * 0.025, s * 0.018);
        mouth(ctx, cx, cy + r * 0.4, s * 0.04, o);
        return [{ x: cx - r * 0.45, y: cy - r * 0.1, r: s * 0.07 }, { x: cx + r * 0.45, y: cy - r * 0.1, r: s * 0.07 }];
    },
    penguin: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.3 * (1 + b), ry = s * 0.38 * (1 - b), cy = base - ry;
        fillOval(ctx, "#ffb84d", cx - s * 0.14, base - s * 0.02, s * 0.1, s * 0.04);
        fillOval(ctx, "#ffb84d", cx + s * 0.14, base - s * 0.02, s * 0.1, s * 0.04);
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.accent, cx, cy + ry * 0.2, rx * 0.68, ry * 0.72);
        fillPoly(ctx, "#ffb84d", [cx - s * 0.05, cy - ry * 0.12, cx + s * 0.05, cy - ry * 0.12, cx, cy + ry * 0.05]);
        cheeks(ctx, cx - rx * 0.62, cx + rx * 0.62, cy - ry * 0.02, s * 0.04, o);
        return [{ x: cx - s * 0.1, y: cy - ry * 0.35, r: s * 0.06 }, { x: cx + s * 0.1, y: cy - ry * 0.35, r: s * 0.06 }];
    },
    owl: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.33 * (1 + b), ry = s * 0.36 * (1 - b), cy = base - ry;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * rx * 0.9, cy - ry * 0.55, cx + d * rx * 0.55, cy - ry * 1.12, cx + d * rx * 0.2, cy - ry * 0.8]);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.accent, cx, cy + ry * 0.45, rx * 0.6, ry * 0.5);
        fillOval(ctx, o.accent, cx - s * 0.15, cy - ry * 0.3, s * 0.125, s * 0.125);
        fillOval(ctx, o.accent, cx + s * 0.15, cy - ry * 0.3, s * 0.125, s * 0.125);
        fillPoly(ctx, "#ffb84d", [cx - s * 0.04, cy - ry * 0.05, cx + s * 0.04, cy - ry * 0.05, cx, cy + ry * 0.2]);
        return [{ x: cx - s * 0.15, y: cy - ry * 0.3, r: s * 0.085 }, { x: cx + s * 0.15, y: cy - ry * 0.3, r: s * 0.085 }];
    },
    panda: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.38 * (1 + b), ry = s * 0.34 * (1 - b), cy = base - ry - s * 0.02;
        fillOval(ctx, o.eye, cx - rx * 0.75, cy - ry * 0.85, s * 0.1, s * 0.1);
        fillOval(ctx, o.eye, cx + rx * 0.75, cy - ry * 0.85, s * 0.1, s * 0.1);
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.eye, cx - s * 0.14, cy - ry * 0.05, s * 0.075, s * 0.095);
        fillOval(ctx, o.eye, cx + s * 0.14, cy - ry * 0.05, s * 0.075, s * 0.095);
        fillOval(ctx, o.eye, cx, cy + ry * 0.22, s * 0.035, s * 0.025);
        cheeks(ctx, cx - rx * 0.65, cx + rx * 0.65, cy + ry * 0.35, s * 0.045, o);
        mouth(ctx, cx, cy + ry * 0.5, s * 0.04, o);
        return [{ x: cx - s * 0.14, y: cy - ry * 0.05, r: s * 0.06 }, { x: cx + s * 0.14, y: cy - ry * 0.05, r: s * 0.06 }];
    },
    dog: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.34 * (1 + b), ry = s * 0.32 * (1 - b), cy = base - ry - s * 0.02;
        [-1, 1].forEach(function(d) {
            ctx.save(); ctx.translate(cx + d * rx * 0.85, cy - ry * 0.35); ctx.rotate(d * 0.25);
            fillOval(ctx, o.accent, 0, s * 0.07, s * 0.075, s * 0.17);
            ctx.restore();
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.accent, cx, cy + ry * 0.35, rx * 0.5, ry * 0.42);
        fillOval(ctx, o.eye, cx, cy + ry * 0.12, s * 0.04, s * 0.03);
        cheeks(ctx, cx - rx * 0.75, cx + rx * 0.75, cy + ry * 0.35, s * 0.04, o);
        mouth(ctx, cx, cy + ry * 0.58, s * 0.045, o);
        return [{ x: cx - rx * 0.42, y: cy - ry * 0.25, r: s * 0.07 }, { x: cx + rx * 0.42, y: cy - ry * 0.25, r: s * 0.07 }];
    },

    // ---- anime
    chibi: function(ctx, cx, base, s, b, o) {
        const r = s * 0.33 * (1 + b), cy = base - r - s * 0.03;
        fillOval(ctx, o.body, cx, cy - r * 0.04, r * 1.12, r * 1.1);
        fillOval(ctx, "#ffe0cc", cx, cy + r * 0.12, r * 0.95, r * 0.9);
        fillOval(ctx, o.body, cx, cy - r * 0.5, r * 1.0, r * 0.55);
        [-0.55, 0, 0.55].forEach(function(k) {
            fillPoly(ctx, o.body, [cx + k * r - r * 0.3, cy - r * 0.45, cx + k * r + r * 0.3, cy - r * 0.45, cx + k * r * 1.15, cy + r * 0.02]);
        });
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.45, s * 0.045, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.2, r: s * 0.075, style: "sparkle" }, { x: cx + r * 0.4, y: cy + r * 0.2, r: s * 0.075, style: "sparkle" }];
    },
    kitsune: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.36 * (1 + b), ry = s * 0.3 * (1 - b), cy = base - ry - s * 0.02;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * rx * 0.9, cy - ry * 0.2, cx + d * rx * 0.85, cy - ry * 1.55, cx + d * rx * 0.2, cy - ry * 0.85]);
            fillPoly(ctx, o.eye, [cx + d * rx * 0.85, cy - ry * 1.2, cx + d * rx * 0.85, cy - ry * 1.55, cx + d * rx * 0.55, cy - ry * 1.1]);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.accent, [cx + d * rx * 0.98, cy + ry * 0.15, cx + d * rx * 0.35, cy + ry * 0.55, cx + d * rx * 0.9, cy + ry * 0.8]);
        });
        fillOval(ctx, o.accent, cx, cy + ry * 0.45, rx * 0.28, ry * 0.28);
        fillOval(ctx, o.eye, cx, cy + ry * 0.32, s * 0.025, s * 0.02);
        mouth(ctx, cx, cy + ry * 0.7, s * 0.035, o);
        return [{ x: cx - rx * 0.4, y: cy - ry * 0.1, r: s * 0.07 }, { x: cx + rx * 0.4, y: cy - ry * 0.1, r: s * 0.07 }];
    },
    ninja: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.36 * (1 + b), ry = s * 0.34 * (1 - b), cy = base - ry - s * 0.02;
        fillPoly(ctx, o.accent, [cx + rx * 0.9, cy - ry * 0.5, cx + rx * 1.4, cy - ry * 0.3, cx + rx * 1.3, cy - ry * 0.75]);
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, "#f1d4b8", cx, cy - ry * 0.05, rx * 0.86, ry * 0.28);
        fillRect(ctx, o.accent, cx - rx * 0.85, cy - ry * 0.62, rx * 1.7, ry * 0.2);
        fillOval(ctx, "#c8cdd6", cx, cy - ry * 0.52, rx * 0.22, ry * 0.12);
        return [{ x: cx - rx * 0.38, y: cy - ry * 0.05, r: s * 0.06 }, { x: cx + rx * 0.38, y: cy - ry * 0.05, r: s * 0.06 }];
    },
    onigiri: function(ctx, cx, base, s, b, o) {
        const hw = s * 0.4 * (1 + b), y0 = base - s * 0.73, y1 = base - s * 0.05, H = (y1 - y0) * (1 - b);
        ctx.lineJoin = "round"; ctx.lineWidth = s * 0.1; ctx.strokeStyle = o.body; ctx.fillStyle = o.body;
        poly(ctx, [cx, y1 - H, cx + hw, y1, cx - hw, y1]); ctx.fill(); ctx.stroke();
        fillPoly(ctx, "#1f2a24", [cx - hw * 0.72, y1 - H * 0.28, cx + hw * 0.72, y1 - H * 0.28, cx + hw, y1, cx - hw, y1]);
        cheeks(ctx, cx - hw * 0.4, cx + hw * 0.4, y1 - H * 0.42, s * 0.04, o);
        mouth(ctx, cx, y1 - H * 0.4, s * 0.04, o);
        return [{ x: cx - hw * 0.2, y: y1 - H * 0.5, r: s * 0.065 }, { x: cx + hw * 0.2, y: y1 - H * 0.5, r: s * 0.065 }];
    },

    // ---- heroes
    hero: function(ctx, cx, base, s, b, o) {
        const r = s * 0.3 * (1 + b), cy = base - r - s * 0.2;
        fillPoly(ctx, o.accent, [cx - r * 0.9, cy + r * 0.5, cx + r * 0.9, cy + r * 0.5, cx + r * 1.35, base, cx - r * 1.35, base]);
        fillOval(ctx, o.body, cx, base - s * 0.13, r * 0.8, s * 0.13);
        ctx.fillStyle = o.accent; star(ctx, cx, base - s * 0.13, s * 0.05);
        fillOval(ctx, o.body, cx, cy, r, r);
        fillOval(ctx, "#ffdcc2", cx, cy + r * 0.28, r * 0.7, r * 0.62);
        fillOval(ctx, o.accent, cx - r * 0.4, cy + r * 0.02, r * 0.38, r * 0.28);
        fillOval(ctx, o.accent, cx + r * 0.4, cy + r * 0.02, r * 0.38, r * 0.28);
        mouth(ctx, cx, cy + r * 0.64, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.02, r: s * 0.06 }, { x: cx + r * 0.4, y: cy + r * 0.02, r: s * 0.06 }];
    },
    knight: function(ctx, cx, base, s, b, o) {
        const r = s * 0.32 * (1 + b), cy = base - r - s * 0.05;
        fillPoly(ctx, o.accent, [cx - r * 0.1, cy - r * 0.95, cx + r * 0.15, cy - r * 1.55, cx + r * 0.7, cy - r * 1.2, cx + r * 0.25, cy - r * 0.9]);
        fillOval(ctx, o.body, cx, base - s * 0.1, r * 0.95, s * 0.1);
        fillOval(ctx, o.body, cx, cy, r, r * 1.05);
        fillRect(ctx, o.eye, cx - r * 0.7, cy - r * 0.22, r * 1.4, r * 0.45);
        fillRect(ctx, "rgba(255,255,255,0.22)", cx - r * 0.04, cy - r * 1.0, r * 0.08, r * 0.78);
        return [{ x: cx - r * 0.3, y: cy, r: s * 0.06 }, { x: cx + r * 0.3, y: cy, r: s * 0.06 }];
    },
    wizard: function(ctx, cx, base, s, b, o) {
        const r = s * 0.26 * (1 + b), cy = base - r - s * 0.05;
        fillPoly(ctx, "#f4f4f4", [cx - r * 0.9, cy + r * 0.1, cx + r * 0.9, cy + r * 0.1, cx, base]);
        fillOval(ctx, "#ffdcc2", cx, cy, r, r * 0.95);
        fillPoly(ctx, o.body, [cx - r * 1.35, cy - r * 0.35, cx + r * 1.35, cy - r * 0.35, cx + r * 0.2, cy - r * 2.4]);
        fillOval(ctx, o.body, cx, cy - r * 0.35, r * 1.6, r * 0.2);
        ctx.fillStyle = o.accent; star(ctx, cx, cy - r * 1.1, s * 0.045);
        fillOval(ctx, "#f2b9a0", cx, cy + r * 0.2, r * 0.18, r * 0.14);
        return [{ x: cx - r * 0.42, y: cy - r * 0.05, r: s * 0.055 }, { x: cx + r * 0.42, y: cy - r * 0.05, r: s * 0.055 }];
    },
    astronaut: function(ctx, cx, base, s, b, o) {
        const r = s * 0.34 * (1 + b), cy = base - r - s * 0.1;
        fillOval(ctx, o.body, cx, base - s * 0.1, r * 0.85, s * 0.1);
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath(); ctx.moveTo(cx + r * 0.6, cy - r * 0.7); ctx.lineTo(cx + r * 0.85, cy - r * 1.15); ctx.stroke();
        fillOval(ctx, o.accent, cx + r * 0.85, cy - r * 1.18, s * 0.03, s * 0.03);
        fillOval(ctx, o.body, cx, cy, r, r);
        fillOval(ctx, "#16202e", cx, cy + r * 0.05, r * 0.78, r * 0.62);
        fillOval(ctx, "rgba(255,255,255,0.18)", cx - r * 0.3, cy - r * 0.3, r * 0.28, r * 0.12);
        fillOval(ctx, o.accent, cx, cy + r * 0.98, r * 0.55, s * 0.03);
        return [{ x: cx - r * 0.3, y: cy + r * 0.05, r: s * 0.065 }, { x: cx + r * 0.3, y: cy + r * 0.05, r: s * 0.065 }];
    },

    // ---- creatures
    dragon: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.36 * (1 + b), ry = s * 0.31 * (1 - b), cy = base - ry - s * 0.02;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.accent, [cx + d * rx * 0.55, cy - ry * 0.7, cx + d * rx * 0.35, cy - ry * 1.5, cx + d * rx * 0.15, cy - ry * 0.85]);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.accent, cx, cy + ry * 0.35, rx * 0.5, ry * 0.42);
        fillOval(ctx, o.eye, cx - rx * 0.14, cy + ry * 0.32, s * 0.017, s * 0.022);
        fillOval(ctx, o.eye, cx + rx * 0.14, cy + ry * 0.32, s * 0.017, s * 0.022);
        cheeks(ctx, cx - rx * 0.78, cx + rx * 0.78, cy + ry * 0.3, s * 0.045, o);
        mouth(ctx, cx, cy + ry * 0.66, s * 0.04, o);
        return [{ x: cx - rx * 0.42, y: cy - ry * 0.18, r: s * 0.075 }, { x: cx + rx * 0.42, y: cy - ry * 0.18, r: s * 0.075 }];
    },
    alien: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.3 * (1 + b), ry = s * 0.38 * (1 - b), cy = base - ry;
        ctx.strokeStyle = o.body; ctx.lineWidth = Math.max(1, s * 0.02);
        [-1, 1].forEach(function(d) {
            ctx.beginPath(); ctx.moveTo(cx + d * rx * 0.35, cy - ry * 0.9); ctx.lineTo(cx + d * rx * 0.65, cy - ry * 1.3); ctx.stroke();
            fillOval(ctx, o.accent, cx + d * rx * 0.65, cy - ry * 1.32, s * 0.035, s * 0.035);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        mouth(ctx, cx, cy + ry * 0.58, s * 0.035, o);
        return [{ x: cx - rx * 0.45, y: cy - ry * 0.05, r: s * 0.11, style: "alien" }, { x: cx + rx * 0.45, y: cy - ry * 0.05, r: s * 0.11, style: "alien" }];
    },
    monster: function(ctx, cx, base, s, b, o) {
        const rx = s * 0.42 * (1 + b), ry = s * 0.38 * (1 - b), cy = base - ry;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.accent, [cx + d * rx * 0.6, cy - ry * 0.75, cx + d * rx * 0.5, cy - ry * 1.35, cx + d * rx * 0.25, cy - ry * 0.92]);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, o.eye, cx, cy + ry * 0.45, rx * 0.45, ry * 0.22);
        [-0.3, -0.06, 0.18].forEach(function(k) {
            fillPoly(ctx, "#ffffff", [cx + k * rx, cy + ry * 0.3, cx + (k + 0.12) * rx, cy + ry * 0.3, cx + (k + 0.06) * rx, cy + ry * 0.43]);
        });
        return [{ x: cx, y: cy - ry * 0.15, r: s * 0.15 }];
    },
    // ---- anime (new)
    mahou: function(ctx, cx, base, s, b, o) {
        const g = geo.mahou(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.022); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 1.0, base - s * 0.03); ctx.lineTo(cx + r * 1.32, cy + r * 0.55); ctx.stroke();
        ctx.fillStyle = o.accent; star(ctx, cx + r * 1.36, cy + r * 0.4, s * 0.065);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * r * 1.0, cy + r * 0.6, r * 0.34, r * 0.95); });
        fillPoly(ctx, dk, [cx - r * 0.6, cy + r * 0.8, cx + r * 0.6, cy + r * 0.8, cx + r * 1.15, base, cx - r * 1.15, base]);
        fillRect(ctx, o.accent, cx - r * 1.15, base - s * 0.035, r * 2.3, s * 0.035);
        fillPoly(ctx, o.accent, [cx, cy + r * 1.0, cx - r * 0.4, cy + r * 0.82, cx - r * 0.4, cy + r * 1.18]);
        fillPoly(ctx, o.accent, [cx, cy + r * 1.0, cx + r * 0.4, cy + r * 0.82, cx + r * 0.4, cy + r * 1.18]);
        fillOval(ctx, dk, cx, cy + r * 1.0, r * 0.1, r * 0.1);
        fillOval(ctx, o.body, cx, cy - r * 0.08, r * 1.1, r * 1.05);
        fillOval(ctx, tn, cx, cy + r * 0.2, r * 0.92, r * 0.85);
        [-0.62, 0, 0.62].forEach(function(k) {
            fillPoly(ctx, o.body, [cx + k * r - r * 0.36, cy - r * 0.5, cx + k * r + r * 0.36, cy - r * 0.5, cx + k * r * 1.1, cy + r * 0.12]);
        });
        fillOval(ctx, o.body, cx, cy - r * 0.52, r * 1.02, r * 0.5);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.accent, cx + d * r * 1.0, cy - r * 0.05, r * 0.16, r * 0.2); });
        fillOval(ctx, o.accent, cx - r * 0.3, cy - r * 1.1, r * 0.3, r * 0.2);
        fillOval(ctx, o.accent, cx + r * 0.3, cy - r * 1.1, r * 0.3, r * 0.2);
        fillOval(ctx, dk, cx, cy - r * 1.1, r * 0.12, r * 0.12);
        ctx.fillStyle = o.accent; heart(ctx, cx, cy - r * 0.32, r * 0.14);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.52, s * 0.045, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        return [{ x: cx - r * 0.44, y: cy + r * 0.25, r: s * 0.08, style: "glossy" }, { x: cx + r * 0.44, y: cy + r * 0.25, r: s * 0.08, style: "glossy" }];
    },
    shonen: function(ctx, cx, base, s, b, o) {
        const g = geo.shonen(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        fillPoly(ctx, o.accent, [cx + r * 0.9, cy - r * 0.2, cx + r * 1.55, cy - r * 0.5, cx + r * 1.35, cy]);
        fillPoly(ctx, o.accent, [cx + r * 0.9, cy - r * 0.1, cx + r * 1.6, cy + r * 0.15, cx + r * 1.25, cy + r * 0.2]);
        fillPoly(ctx, dk, [cx - r * 0.7, cy + r * 0.85, cx + r * 0.7, cy + r * 0.85, cx + r * 1.0, base, cx - r * 1.0, base]);
        fillPoly(ctx, o.accent, [cx - r * 0.3, cy + r * 0.85, cx + r * 0.3, cy + r * 0.85, cx, cy + r * 1.35]);
        fillRect(ctx, o.accent, cx - r * 0.95, base - s * 0.12, r * 1.9, s * 0.035);
        [-1, 1].forEach(function(d) { fillOval(ctx, tn, cx + d * r * 1.02, cy + r * 1.35, r * 0.2, r * 0.2); });
        fillPoly(ctx, o.body, [cx + r * 0.2, cy - r * 0.95, cx - r * 0.1, cy - r * 1.55, cx - r * 0.5, cy - r * 0.95, cx - r * 1.0, cy - r * 1.35, cx - r * 0.95, cy - r * 0.6,
                               cx - r * 1.5, cy - r * 0.45, cx - r * 1.1, cy, cx - r * 0.9, cy + r * 0.4, cx, cy]);
        fillPoly(ctx, o.body, [cx + r * 0.2, cy - r * 0.95, cx + r * 0.55, cy - r * 1.7, cx + r * 0.7, cy - r * 0.95, cx + r * 1.15, cy - r * 1.35, cx + r * 1.0, cy - r * 0.5,
                               cx + r * 1.45, cy - r * 0.5, cx + r * 1.05, cy + r * 0.05, cx + r * 0.9, cy + r * 0.4, cx, cy]);
        fillOval(ctx, tn, cx, cy + r * 0.12, r * 0.92, r * 0.9);
        fillOval(ctx, o.body, cx, cy - r * 0.6, r * 0.98, r * 0.42);
        fillPoly(ctx, o.body, [cx - r * 0.35, cy - r * 0.45, cx - r * 0.1, cy - r * 0.3, cx - r * 0.35, cy + r * 0.05]);
        fillPoly(ctx, o.body, [cx + r * 0.35, cy - r * 0.45, cx + r * 0.1, cy - r * 0.3, cx + r * 0.35, cy + r * 0.05]);
        fillRect(ctx, o.accent, cx - r * 0.95, cy - r * 0.28, r * 1.9, r * 0.2);
        fillRect(ctx, dk, cx - r * 0.3, cy - r * 0.28, r * 0.6, r * 0.2);
        ctx.fillStyle = o.accent; star(ctx, cx, cy - r * 0.18, r * 0.07);
        brow(ctx, cx - r * 0.42, cy + r * 0.08, r * 0.5, r * 0.1, o);
        brow(ctx, cx + r * 0.42, cy + r * 0.08, r * 0.5, -r * 0.1, o);
        cheeks(ctx, cx - r * 0.65, cx + r * 0.65, cy + r * 0.58, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.7, s * 0.045, o);
        sweat(ctx, cx + r * 1.0, cy - r * 0.2, s * 0.025, o);
        return [{ x: cx - r * 0.42, y: cy + r * 0.3, r: s * 0.07, style: "glossy" }, { x: cx + r * 0.42, y: cy + r * 0.3, r: s * 0.07, style: "glossy" }];
    },
    student: function(ctx, cx, base, s, b, o) {
        const g = geo.student(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        fillPoly(ctx, dk, [cx - r * 0.7, cy + r * 0.8, cx + r * 0.7, cy + r * 0.8, cx + r * 1.05, base, cx - r * 1.05, base]);
        fillPoly(ctx, light(o.accent, 0.6), [cx - r * 0.32, cy + r * 0.8, cx + r * 0.32, cy + r * 0.8, cx, cy + r * 1.4]);
        fillPoly(ctx, o.accent, [cx - r * 0.58, cy + r * 0.78, cx - r * 0.05, cy + r * 0.82, cx - r * 0.38, cy + r * 1.22]);
        fillPoly(ctx, o.accent, [cx + r * 0.58, cy + r * 0.78, cx + r * 0.05, cy + r * 0.82, cx + r * 0.38, cy + r * 1.22]);
        fillPoly(ctx, o.body, [cx, cy + r * 1.0, cx - r * 0.3, cy + r * 0.9, cx - r * 0.3, cy + r * 1.12]);
        fillPoly(ctx, o.body, [cx, cy + r * 1.0, cx + r * 0.3, cy + r * 0.9, cx + r * 0.3, cy + r * 1.12]);
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.022); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 0.62, cy + r * 0.88); ctx.lineTo(cx - r * 0.45, base - s * 0.01); ctx.stroke();
        fillOval(ctx, o.body, cx, cy + r * 0.12, r * 1.15, r * 1.1);
        fillOval(ctx, tn, cx, cy + r * 0.2, r * 0.88, r * 0.84);
        fillOval(ctx, o.body, cx, cy - r * 0.42, r * 1.0, r * 0.58);
        [-1, 1].forEach(function(d) { fillPoly(ctx, o.body, [cx + d * r * 0.97, cy - r * 0.1, cx + d * r * 0.97, cy + r * 0.62, cx + d * r * 0.72, cy + r * 0.62, cx + d * r * 0.72, cy - r * 0.1]); });
        ctx.fillStyle = o.accent; star(ctx, cx + r * 0.7, cy - r * 0.5, s * 0.035);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.52, s * 0.045, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        sweat(ctx, cx + r * 1.05, cy - r * 0.15, s * 0.025, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.28, r: s * 0.075, style: "glossy" }, { x: cx + r * 0.4, y: cy + r * 0.28, r: s * 0.075, style: "glossy" }];
    },
    samurai: function(ctx, cx, base, s, b, o) {
        const g = geo.samurai(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1.5, s * 0.035); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 0.55, cy + r * 0.35); ctx.lineTo(cx + r * 1.25, cy - r * 0.75); ctx.stroke();
        fillOval(ctx, o.accent, cx + r * 0.55, cy + r * 0.35, s * 0.04, s * 0.04);
        fillPoly(ctx, dk, [cx - r * 0.8, cy + r * 0.8, cx + r * 0.8, cy + r * 0.8, cx + r * 0.95, base, cx - r * 0.95, base]);
        for (let k = 0; k < 3; k++) fillRect(ctx, o.accent, cx - r * 0.75, cy + r * 1.1 + k * r * 0.24, r * 1.5, r * 0.05);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * r * 1.0, cy + r * 1.0, r * 0.4, r * 0.28);
            fillOval(ctx, dk, cx + d * r * 1.0, cy + r * 1.22, r * 0.36, r * 0.2);
        });
        fillOval(ctx, tn, cx, cy + r * 0.1, r * 0.88, r * 0.9);
        fillOval(ctx, o.body, cx, cy - r * 0.55, r * 0.95, r * 0.55);
        [-1, 1].forEach(function(d) { fillPoly(ctx, o.body, [cx + d * r * 0.95, cy - r * 0.5, cx + d * r * 0.82, cy + r * 0.2, cx + d * r * 0.62, cy - r * 0.2]); });
        fillOval(ctx, o.body, cx, cy - r * 1.3, r * 0.22, r * 0.3);
        fillRect(ctx, o.accent, cx - r * 0.22, cy - r * 1.05, r * 0.44, r * 0.1);
        fillRect(ctx, o.accent, cx - r * 0.9, cy - r * 0.3, r * 1.8, r * 0.18);
        brow(ctx, cx - r * 0.4, cy + r * 0.04, r * 0.45, r * 0.07, o);
        brow(ctx, cx + r * 0.4, cy + r * 0.04, r * 0.45, -r * 0.07, o);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.5, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.25, r: s * 0.055 }, { x: cx + r * 0.4, y: cy + r * 0.25, r: s * 0.055 }];
    },
    nekogirl: function(ctx, cx, base, s, b, o) {
        const g = geo.nekogirl(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        const sway = Math.sin(o.t * 3) * s * 0.025;
        ctx.strokeStyle = o.body; ctx.lineWidth = s * 0.075; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 0.7, base - s * 0.05);
        ctx.bezierCurveTo(cx + r * 1.5, base - s * 0.02, cx + r * 1.6 + sway, cy + r * 0.9, cx + r * 1.3 + sway, cy + r * 0.45); ctx.stroke();
        fillPoly(ctx, dk, [cx - r * 0.6, cy + r * 0.8, cx + r * 0.6, cy + r * 0.8, cx + r * 0.95, base, cx - r * 0.95, base]);
        fillOval(ctx, o.body, cx, cy + r * 0.1, r * 1.12, r * 1.05);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.95, cy - r * 0.15, cx + d * r * 0.8, cy - r * 1.25, cx + d * r * 0.15, cy - r * 0.85]);
            fillPoly(ctx, o.accent, [cx + d * r * 0.82, cy - r * 0.4, cx + d * r * 0.72, cy - r * 1.0, cx + d * r * 0.3, cy - r * 0.75]);
        });
        fillOval(ctx, tn, cx, cy + r * 0.2, r * 0.88, r * 0.84);
        fillOval(ctx, o.body, cx, cy - r * 0.45, r * 0.98, r * 0.5);
        [-0.55, 0, 0.55].forEach(function(k) {
            fillPoly(ctx, o.body, [cx + k * r - r * 0.32, cy - r * 0.45, cx + k * r + r * 0.32, cy - r * 0.45, cx + k * r * 1.1, cy + r * 0.05]);
        });
        fillOval(ctx, o.accent, cx, cy + r * 0.98, r * 0.55, r * 0.1);
        fillOval(ctx, mix(o.accent, "#ffd34d", 0.6), cx, cy + r * 1.12, s * 0.032, s * 0.032);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, tn, cx + d * r * 0.62, cy + r * 1.2, r * 0.2, r * 0.17);
            fillOval(ctx, o.accent, cx + d * r * 0.62, cy + r * 1.24, r * 0.09, r * 0.07);
        });
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.55, s * 0.045, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        return [{ x: cx - r * 0.42, y: cy + r * 0.28, r: s * 0.075, style: "glossy" }, { x: cx + r * 0.42, y: cy + r * 0.28, r: s * 0.075, style: "glossy" }];
    },
    oni: function(ctx, cx, base, s, b, o) {
        const g = geo.oni(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), hair = shade(o.bodyS, 0.5);
        fillPoly(ctx, dk, [cx + r * 1.0, base - s * 0.02, cx + r * 1.2, base - s * 0.02, cx + r * 1.32, cy + r * 0.2, cx + r * 0.95, cy + r * 0.2]);
        fillOval(ctx, dk, cx + r * 1.13, cy + r * 0.05, r * 0.28, r * 0.4);
        [-0.2, 0.05, 0.3].forEach(function(k) { fillOval(ctx, o.accent, cx + r * 1.13 + (k > 0 ? r * 0.12 : -r * 0.12), cy + r * 0.05 + k * r, s * 0.016, s * 0.016); });
        fillOval(ctx, o.body, cx, base - s * 0.1, r * 0.78, s * 0.1);
        fillPoly(ctx, dk, [cx - r * 0.6, base - s * 0.15, cx + r * 0.6, base - s * 0.15, cx + r * 0.5, base - s * 0.01, cx - r * 0.5, base - s * 0.01]);
        fillPoly(ctx, o.accent, [cx - r * 0.45, base - s * 0.15, cx - r * 0.25, base - s * 0.15, cx - r * 0.35, base - s * 0.08]);
        fillPoly(ctx, o.accent, [cx - r * 0.05, base - s * 0.15, cx + r * 0.15, base - s * 0.15, cx + r * 0.05, base - s * 0.08]);
        fillPoly(ctx, o.accent, [cx + r * 0.35, base - s * 0.15, cx + r * 0.55, base - s * 0.15, cx + r * 0.45, base - s * 0.08]);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.accent, [cx + d * r * 0.72, cy - r * 0.62, cx + d * r * 0.3, cy - r * 0.88, cx + d * r * 0.55, cy - r * 1.5]);
        });
        fillOval(ctx, hair, cx, cy - r * 0.88, r * 0.5, r * 0.28);
        fillOval(ctx, o.body, cx, cy, r, r * 0.92);
        brow(ctx, cx - r * 0.4, cy - r * 0.38, r * 0.5, r * 0.14, o);
        brow(ctx, cx + r * 0.4, cy - r * 0.38, r * 0.5, -r * 0.14, o);
        cheeks(ctx, cx - r * 0.7, cx + r * 0.7, cy + r * 0.3, s * 0.045, o);
        mouth(ctx, cx, cy + r * 0.45, s * 0.07, o);
        if (!o.sil && o.mouthStyle !== "none") {
            const fy = cy + r * 0.45 + s * 0.025, ivory = mix(o.accent, "#ffffff", 0.85);
            [-1, 1].forEach(function(d) { fillPoly(ctx, ivory, [cx + d * s * 0.025, fy, cx + d * s * 0.055, fy, cx + d * s * 0.04, fy + s * 0.045]); });
        }
        return [{ x: cx - r * 0.4, y: cy - r * 0.1, r: s * 0.07 }, { x: cx + r * 0.4, y: cy - r * 0.1, r: s * 0.07 }];
    },

    // ---- game heroes (new)
    builder: function(ctx, cx, base, s, b, o) {
        const g = geo.builder(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        const glove = mix(o.accent, "#ffffff", 0.6), stache = shade(o.bodyS, 0.6);
        fillOval(ctx, o.body, cx, base - s * 0.18, r * 0.95, s * 0.17);
        fillOval(ctx, dk, cx, base - s * 0.1, r * 0.88, s * 0.1);
        fillRect(ctx, dk, cx - r * 0.45, base - s * 0.3, r * 0.9, s * 0.16);
        fillRect(ctx, dk, cx - r * 0.55, base - s * 0.34, r * 0.16, s * 0.12);
        fillRect(ctx, dk, cx + r * 0.39, base - s * 0.34, r * 0.16, s * 0.12);
        fillOval(ctx, o.accent, cx - r * 0.47, base - s * 0.31, s * 0.016, s * 0.016);
        fillOval(ctx, o.accent, cx + r * 0.47, base - s * 0.31, s * 0.016, s * 0.016);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, glove, cx + d * r * 1.05, base - s * 0.2, r * 0.22, r * 0.2);
            fillOval(ctx, shade(dk, 0.4), cx + d * r * 0.45, base - s * 0.02, r * 0.4, s * 0.035);
        });
        fillOval(ctx, tn, cx, cy, r, r * 0.95);
        [-1, 1].forEach(function(d) { fillOval(ctx, tn, cx + d * r * 0.95, cy + r * 0.1, r * 0.16, r * 0.2); });
        fillOval(ctx, shade(tn, 0.1), cx, cy + r * 0.24, r * 0.24, r * 0.2);
        [-1, 1].forEach(function(d) { fillOval(ctx, stache, cx + d * r * 0.3, cy + r * 0.5, r * 0.3, r * 0.14); });
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r * 1.02, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillOval(ctx, shade(o.bodyS, 0.3), cx + r * 0.35, cy - r * 0.16, r * 0.85, r * 0.14);
        fillOval(ctx, o.body, cx + r * 0.35, cy - r * 0.2, r * 0.85, r * 0.13);
        fillOval(ctx, o.accent, cx, cy - r * 0.62, r * 0.22, r * 0.22);
        fillOval(ctx, o.body, cx, cy - r * 0.62, r * 0.1, r * 0.1);
        return [{ x: cx - r * 0.28, y: cy + r * 0.02, r: s * 0.055 }, { x: cx + r * 0.28, y: cy + r * 0.02, r: s * 0.055 }];
    },
    speedster: function(ctx, cx, base, s, b, o) {
        const g = geo.speedster(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        if (!o.sil) {
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.015); ctx.lineCap = "round";
            for (let i = 0; i < 3; i++) {
                const ph = (o.t * 1.5 + i / 3) % 1, yy = cy + r * (0.3 + i * 0.55), xx = cx - r * 1.3 - ph * s * 0.05;
                ctx.globalAlpha = (1 - ph) * 0.7;
                ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - s * 0.09, yy); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        [-1, 1].forEach(function(d) {
            fillRect(ctx, dk, cx + d * r * 0.45 - r * 0.14, base - s * 0.2, r * 0.28, s * 0.17);
            fillOval(ctx, o.accent, cx + d * r * 0.5, base - s * 0.04, r * 0.5, s * 0.045);
            fillOval(ctx, o.body, cx + d * r * 0.5, base - s * 0.05, r * 0.3, s * 0.02);
        });
        fillOval(ctx, dk, cx, cy + r * 1.25, r * 0.72, r * 0.75);
        fillPoly(ctx, o.accent, [cx + r * 0.1, cy + r * 0.85, cx - r * 0.25, cy + r * 1.35, cx, cy + r * 1.3, cx - r * 0.1, cy + r * 1.8, cx + r * 0.3, cy + r * 1.2, cx + r * 0.05, cy + r * 1.25]);
        fillPoly(ctx, o.body, [cx + r * 0.2, cy - r * 0.95, cx - r * 0.1, cy - r * 1.55, cx - r * 0.5, cy - r * 0.95, cx - r * 1.0, cy - r * 1.35, cx - r * 0.95, cy - r * 0.6,
                               cx - r * 1.65, cy - r * 0.5, cx - r * 1.1, cy, cx - r * 1.5, cy + r * 0.4, cx - r * 0.9, cy + r * 0.4, cx, cy]);
        fillOval(ctx, tn, cx, cy + r * 0.05, r, r * 0.95);
        fillOval(ctx, o.body, cx + r * 0.05, cy - r * 0.55, r * 0.95, r * 0.5);
        fillPoly(ctx, o.body, [cx + r * 0.3, cy - r * 0.8, cx + r * 1.0, cy - r * 0.45, cx + r * 0.35, cy - r * 0.15]);
        fillRect(ctx, o.accent, cx - r * 0.9, cy - r * 0.3, r * 1.8, r * 0.14);
        cheeks(ctx, cx - r * 0.65, cx + r * 0.65, cy + r * 0.5, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.045, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.12, r: s * 0.065 }, { x: cx + r * 0.4, y: cy + r * 0.12, r: s * 0.065 }];
    },
    adventurer: function(ctx, cx, base, s, b, o) {
        const g = geo.adventurer(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        fillOval(ctx, dk, cx - r * 0.95, base - s * 0.2, r * 0.38, s * 0.15);
        fillOval(ctx, o.body, cx, base - s * 0.14, r * 0.95, s * 0.14);
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.025); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx - r * 0.7, base - s * 0.26); ctx.lineTo(cx + r * 0.7, base - s * 0.04); ctx.stroke();
        fillOval(ctx, dk, cx + r * 0.7, base - s * 0.07, r * 0.28, s * 0.06);
        fillOval(ctx, o.accent, cx, cy + r * 0.88, r * 0.62, r * 0.17);
        fillPoly(ctx, o.accent, [cx + r * 0.2, cy + r * 0.9, cx + r * 0.65, cy + r * 0.95, cx + r * 0.55, cy + r * 1.6, cx + r * 0.15, cy + r * 1.4]);
        fillOval(ctx, tn, cx, cy, r, r * 0.95);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * r * 0.85, cy + r * 0.1, r * 0.2, r * 0.35); });
        fillPoly(ctx, o.accent, [cx + r * 0.75, cy - r * 0.7, cx + r * 1.3, cy - r * 1.6, cx + r * 1.05, cy - r * 0.6]);
        fillOval(ctx, dk, cx, cy - r * 0.95, r * 0.9, r * 0.62);
        fillRect(ctx, o.accent, cx - r * 0.78, cy - r * 0.68, r * 1.56, r * 0.15);
        fillOval(ctx, dk, cx, cy - r * 0.5, r * 1.55, r * 0.26);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.accent, cx + d * r * 0.3, cy - r * 0.9, r * 0.2, r * 0.2);
            fillOval(ctx, mix(o.accent, "#9fe0ff", 0.5), cx + d * r * 0.3, cy - r * 0.9, r * 0.12, r * 0.12);
        });
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.45, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.55, s * 0.04, o);
        return [{ x: cx - r * 0.38, y: cy + r * 0.1, r: s * 0.06 }, { x: cx + r * 0.38, y: cy + r * 0.1, r: s * 0.06 }];
    },
    marine: function(ctx, cx, base, s, b, o) {
        const g = geo.marine(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), vis = ink(o);
        fillOval(ctx, dk, cx, base - s * 0.14, r * 1.05, s * 0.14);
        fillOval(ctx, o.body, cx, base - s * 0.16, r * 0.7, s * 0.1);
        fillRect(ctx, o.accent, cx - r * 0.08, base - s * 0.26, r * 0.16, s * 0.2);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * r * 1.05, base - s * 0.22, r * 0.42, r * 0.36);
            fillOval(ctx, o.accent, cx + d * r * 1.05, base - s * 0.22, r * 0.18, r * 0.15);
            fillOval(ctx, shade(dk, 0.4), cx + d * r * 0.5, base - s * 0.02, r * 0.4, s * 0.035);
        });
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.018); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 0.75, cy - r * 0.7); ctx.lineTo(cx + r * 0.95, cy - r * 1.3); ctx.stroke();
        fillOval(ctx, o.accent, cx + r * 0.95, cy - r * 1.33, s * 0.025, s * 0.025);
        fillOval(ctx, dk, cx, cy + r * 0.82, r * 0.5, r * 0.2);
        fillOval(ctx, o.body, cx, cy, r * 1.1, r * 1.05);
        fillOval(ctx, "rgba(255,255,255,0.2)", cx - r * 0.3, cy - r * 0.68, r * 0.4, r * 0.16);
        ctx.fillStyle = vis; roundRect(ctx, cx - r * 0.82, cy - r * 0.28, r * 1.64, r * 0.62, r * 0.28); ctx.fill();
        fillRect(ctx, o.accent, cx - r * 0.06, cy - r * 1.04, r * 0.12, r * 0.74);
        return [{ x: cx - r * 0.38, y: cy + r * 0.03, r: s * 0.055 }, { x: cx + r * 0.38, y: cy + r * 0.03, r: s * 0.055 }];
    },
    hunter: function(ctx, cx, base, s, b, o) {
        const g = geo.hunter(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), face = ink(o);
        fillPoly(ctx, dk, [cx - r * 0.7, cy + r * 0.6, cx + r * 0.7, cy + r * 0.6, cx + r * 1.3, base, cx - r * 1.3, base]);
        fillPoly(ctx, shade(dk, 0.4), [cx - r * 0.3, cy + r * 0.8, cx + r * 0.3, cy + r * 0.8, cx + r * 0.45, base, cx - r * 0.45, base]);
        fillRect(ctx, o.accent, cx - r * 0.95, base - s * 0.13, r * 1.9, s * 0.03);
        fillOval(ctx, o.accent, cx + r * 0.7, base - s * 0.08, r * 0.2, s * 0.04);
        fillOval(ctx, o.accent, cx - r * 0.7, base - s * 0.08, r * 0.2, s * 0.04);
        fillPoly(ctx, o.body, [cx + r * 0.4, cy - r * 0.8, cx + r * 1.4, cy - r * 0.95, cx + r * 0.9, cy - r * 0.1]);
        fillOval(ctx, o.body, cx, cy, r, r * 0.98);
        fillOval(ctx, face, cx, cy + r * 0.1, r * 0.68, r * 0.6);
        if (!o.sil) {
            fillOval(ctx, mix(o.bodyS, o.accent, 0.4), cx, cy + r * 0.45, r * 0.58, r * 0.18);
            fillRect(ctx, o.accent, cx - r * 0.04, cy + r * 0.3, r * 0.08, r * 0.3);
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.014);
            ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.02, r * 0.2, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.2); ctx.lineTo(cx - r * 0.75, cy - r * 0.5); ctx.stroke();
        }
        return [{ x: cx - r * 0.3, y: cy - r * 0.02, r: s * 0.05 }, { x: cx + r * 0.3, y: cy - r * 0.02, r: s * 0.05 }];
    },
    bomber: function(ctx, cx, base, s, b, o) {
        const g = geo.bomber(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        const sway = Math.sin(o.t * 3) * s * 0.02, bx = cx + r * 1.05, by = base - s * 0.1;
        fillPoly(ctx, o.accent, [cx + r * 0.3, cy + r * 0.85, cx + r * 0.9 + sway, cy + r * 0.8, cx + r * 1.35 + sway * 2, cy + r * 1.3, cx + r * 0.85 + sway, cy + r * 1.35]);
        fillOval(ctx, dk, cx, base - s * 0.14, r * 0.95, s * 0.14);
        fillRect(ctx, o.accent, cx - r * 0.04, base - s * 0.26, r * 0.08, s * 0.24);
        fillOval(ctx, ink(o), bx, by, s * 0.09, s * 0.09);
        fillOval(ctx, "rgba(255,255,255,0.3)", bx - s * 0.03, by - s * 0.03, s * 0.025, s * 0.02);
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.014); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(bx + s * 0.03, by - s * 0.085); ctx.lineTo(bx + s * 0.07, by - s * 0.15); ctx.stroke();
        if (!o.sil) { ctx.fillStyle = mix(o.accent, "#ffdd55", 0.7); spark(ctx, bx + s * 0.07, by - s * 0.16, s * 0.035 * (0.7 + 0.3 * Math.sin(o.t * 14))); }
        fillOval(ctx, tn, cx, cy, r, r * 0.95);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * r * 0.98, cy + r * 0.3, r * 0.2, r * 0.4); });
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 1.05, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillRect(ctx, dk, cx - r * 1.0, cy - r * 0.45, r * 2.0, r * 0.12);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.accent, cx + d * r * 0.38, cy - r * 0.4, r * 0.25, r * 0.22);
            fillOval(ctx, mix(o.accent, "#8fd0ff", 0.5), cx + d * r * 0.38, cy - r * 0.4, r * 0.16, r * 0.14);
        });
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.5, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.04, o);
        return [{ x: cx - r * 0.38, y: cy + r * 0.18, r: s * 0.06 }, { x: cx + r * 0.38, y: cy + r * 0.18, r: s * 0.06 }];
    },
    racer: function(ctx, cx, base, s, b, o) {
        const g = geo.racer(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), vis = ink(o);
        fillOval(ctx, dk, cx, base - s * 0.13, r * 0.9, s * 0.13);
        fillOval(ctx, o.accent, cx, base - s * 0.2, s * 0.045, s * 0.045);
        if (!o.sil) {
            ctx.strokeStyle = vis; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.lineCap = "round";
            ctx.beginPath(); ctx.arc(cx, base - s * 0.1, s * 0.12, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - s * 0.12, base - s * 0.1); ctx.lineTo(cx + s * 0.12, base - s * 0.1); ctx.moveTo(cx, base - s * 0.1); ctx.lineTo(cx, base + s * 0.02); ctx.stroke();
        }
        [-1, 1].forEach(function(d) { fillOval(ctx, o.accent, cx + d * s * 0.11, base - s * 0.1, s * 0.035, s * 0.035); });
        fillOval(ctx, o.body, cx, cy, r * 1.08, r * 1.02);
        fillRect(ctx, o.accent, cx - r * 0.14, cy - r * 0.99, r * 0.28, r * 0.62);
        fillRect(ctx, o.accent, cx - r * 0.34, cy - r * 0.95, r * 0.07, r * 0.58);
        fillRect(ctx, o.accent, cx + r * 0.27, cy - r * 0.95, r * 0.07, r * 0.58);
        fillOval(ctx, vis, cx, cy + r * 0.12, r * 0.88, r * 0.45);
        fillOval(ctx, "rgba(255,255,255,0.18)", cx - r * 0.3, cy - r * 0.02, r * 0.3, r * 0.1);
        fillRect(ctx, dk, cx - r * 0.25, cy + r * 0.72, r * 0.5, r * 0.1);
        return [{ x: cx - r * 0.38, y: cy + r * 0.12, r: s * 0.055 }, { x: cx + r * 0.38, y: cy + r * 0.12, r: s * 0.055 }];
    },
    sidekick: function(ctx, cx, base, s, b, o) {
        const g = geo.sidekick(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), scr = ink(o);
        const fl = 0.7 + 0.3 * Math.sin(o.t * 18);
        fillPoly(ctx, mix(o.accent, "#ffb347", 0.6), [cx - r * 0.3, base - s * 0.12, cx + r * 0.3, base - s * 0.12, cx, base - s * 0.12 + s * 0.11 * fl]);
        fillOval(ctx, dk, cx, base - s * 0.13, r * 0.35, s * 0.035);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, dk, cx + d * r * 1.05, cy + r * 0.3, r * 0.16, r * 0.28);
            fillOval(ctx, o.accent, cx + d * r * 1.0, cy - r * 0.05, r * 0.14, r * 0.22);
        });
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.02); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.9); ctx.lineTo(cx, cy - r * 1.3); ctx.stroke();
        fillOval(ctx, o.accent, cx, cy - r * 1.36, s * 0.035, s * 0.035);
        fillOval(ctx, o.body, cx, cy, r, r * 0.95);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", cx - r * 0.45, cy - r * 0.65, r * 0.22, r * 0.12);
        fillOval(ctx, dk, cx, cy + r * 0.66, r * 0.55, r * 0.08);
        fillOval(ctx, scr, cx, cy - r * 0.05, r * 0.72, r * 0.5);
        return [{ x: cx - r * 0.36, y: cy - r * 0.05, r: s * 0.075 }, { x: cx + r * 0.36, y: cy - r * 0.05, r: s * 0.075 }];
    },
    // ---- fantasy
    elf: function(ctx, cx, base, s, b, o) {
        const g = geo.elf(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o);
        fillPoly(ctx, dk, [cx - r * 0.65, cy + r * 0.8, cx + r * 0.65, cy + r * 0.8, cx + r * 1.05, base, cx - r * 1.05, base]);
        fillRect(ctx, o.accent, cx - r * 0.9, base - s * 0.15, r * 1.8, s * 0.03);
        fillPoly(ctx, o.accent, [cx - r * 0.3, cy + r * 0.8, cx + r * 0.3, cy + r * 0.8, cx, cy + r * 1.25]);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * r * 0.98, cy + r * 0.55, r * 0.26, r * 0.72);
            fillPoly(ctx, tn, [cx + d * r * 0.85, cy - r * 0.05, cx + d * r * 1.95, cy - r * 0.6, cx + d * r * 0.9, cy + r * 0.4]);
            fillPoly(ctx, o.accent, [cx + d * r * 1.0, cy, cx + d * r * 1.6, cy - r * 0.4, cx + d * r * 1.0, cy + r * 0.22]);
        });
        fillOval(ctx, tn, cx, cy + r * 0.1, r * 0.9, r * 0.9);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.arc(cx, cy, r * 1.0, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillPoly(ctx, o.body, [cx - r * 1.0, cy, cx - r * 0.1, cy - r * 0.08, cx - r * 0.5, cy + r * 0.3, cx - r * 1.0, cy + r * 0.45]);
        fillPoly(ctx, o.body, [cx + r * 1.0, cy, cx + r * 0.2, cy - r * 0.08, cx + r * 0.55, cy + r * 0.25, cx + r * 1.0, cy + r * 0.4]);
        fillPoly(ctx, o.accent, [cx, cy - r * 0.58, cx + r * 0.14, cy - r * 0.38, cx, cy - r * 0.16, cx - r * 0.14, cy - r * 0.38]);
        cheeks(ctx, cx - r * 0.6, cx + r * 0.6, cy + r * 0.5, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.58, s * 0.035, o);
        return [{ x: cx - r * 0.38, y: cy + r * 0.22, r: s * 0.06 }, { x: cx + r * 0.38, y: cy + r * 0.22, r: s * 0.06 }];
    },
    dwarf: function(ctx, cx, base, s, b, o) {
        const g = geo.dwarf(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o), hair = shade(o.bodyS, 0.45);
        fillPoly(ctx, dk, [cx - r * 0.8, cy + r * 0.7, cx + r * 0.8, cy + r * 0.7, cx + r * 1.2, base, cx - r * 1.2, base]);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.accent, [cx + d * r * 0.8, cy - r * 0.2, cx + d * r * 1.55, cy - r * 1.15, cx + d * r * 0.65, cy - r * 0.7]);
        });
        fillOval(ctx, tn, cx, cy + r * 0.05, r * 0.88, r * 0.82);
        fillOval(ctx, mix(tn, o.accent, 0.3), cx, cy + r * 0.28, r * 0.2, r * 0.16);
        fillPoly(ctx, hair, [cx - r * 0.95, cy + r * 0.2, cx - r * 0.5, cy + r * 0.48, cx + r * 0.5, cy + r * 0.48, cx + r * 0.95, cy + r * 0.2,
                             cx + r * 1.02, cy + r * 0.95, cx + r * 0.4, base - s * 0.02, cx - r * 0.4, base - s * 0.02, cx - r * 1.02, cy + r * 0.95]);
        fillOval(ctx, hair, cx - r * 0.3, cy + r * 0.48, r * 0.32, r * 0.14);
        fillOval(ctx, hair, cx + r * 0.3, cy + r * 0.48, r * 0.32, r * 0.14);
        fillOval(ctx, o.accent, cx, base - s * 0.07, s * 0.022, s * 0.022);
        fillOval(ctx, tn, cx, cy + r * 0.72, r * 0.2, r * 0.1);
        mouth(ctx, cx, cy + r * 0.76, s * 0.028, o);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 1.02, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillRect(ctx, dk, cx - r * 1.04, cy - r * 0.16, r * 2.08, r * 0.14);
        fillRect(ctx, o.accent, cx - r * 0.07, cy - r * 1.1, r * 0.14, r * 0.95);
        return [{ x: cx - r * 0.36, y: cy + r * 0.12, r: s * 0.055 }, { x: cx + r * 0.36, y: cy + r * 0.12, r: s * 0.055 }];
    },
    fairy: function(ctx, cx, base, s, b, o) {
        const g = geo.fairy(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o), wl = light(o.accent, 0.4);
        const fl = 1 + Math.sin(o.t * 12) * 0.12;
        [-1, 1].forEach(function(d) {
            fillOval(ctx, wl, cx + d * r * 1.15, cy + r * 0.2, r * 0.62, r * 1.05 * fl);
            fillOval(ctx, mix(wl, o.accent, 0.5), cx + d * r * 0.95, cy + r * 1.25, r * 0.45, r * 0.62 * fl);
        });
        fillRect(ctx, tn, cx - r * 0.3, cy + r * 1.7, r * 0.18, base - s * 0.04 - (cy + r * 1.7));
        fillRect(ctx, tn, cx + r * 0.12, cy + r * 1.7, r * 0.18, base - s * 0.04 - (cy + r * 1.7));
        fillOval(ctx, dk, cx - r * 0.21, base - s * 0.035, r * 0.2, s * 0.02);
        fillOval(ctx, dk, cx + r * 0.21, base - s * 0.035, r * 0.2, s * 0.02);
        fillPoly(ctx, o.body, [cx - r * 0.35, cy + r * 0.9, cx + r * 0.35, cy + r * 0.9, cx + r * 0.95, cy + r * 1.8, cx - r * 0.95, cy + r * 1.8]);
        fillPoly(ctx, dk, [cx - r * 0.55, cy + r * 1.55, cx + r * 0.55, cy + r * 1.55, cx + r * 0.95, cy + r * 1.8, cx - r * 0.95, cy + r * 1.8]);
        fillOval(ctx, o.body, cx, cy - r * 1.0, r * 0.38, r * 0.34);
        fillOval(ctx, o.body, cx - r * 0.95, cy + r * 0.35, r * 0.2, r * 0.55);
        fillOval(ctx, o.body, cx + r * 0.95, cy + r * 0.35, r * 0.2, r * 0.55);
        fillOval(ctx, tn, cx, cy + r * 0.1, r * 0.9, r * 0.9);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.98, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillPoly(ctx, o.body, [cx - r * 0.95, cy - r * 0.1, cx - r * 0.1, cy - r * 0.15, cx - r * 0.55, cy + r * 0.28, cx - r * 0.95, cy + r * 0.4]);
        fillPoly(ctx, o.body, [cx + r * 0.95, cy - r * 0.1, cx + r * 0.1, cy - r * 0.15, cx + r * 0.5, cy + r * 0.25, cx + r * 0.95, cy + r * 0.38]);
        if (!o.sil) {
            ctx.fillStyle = o.accent;
            spark(ctx, cx - r * 1.75, cy - r * 0.8, s * 0.035 * (0.6 + 0.4 * Math.sin(o.t * 5)));
            spark(ctx, cx + r * 1.7, cy + r * 1.7, s * 0.03 * (0.6 + 0.4 * Math.sin(o.t * 5 + 2)));
        }
        cheeks(ctx, cx - r * 0.6, cx + r * 0.6, cy + r * 0.48, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.55, s * 0.03, o);
        return [{ x: cx - r * 0.38, y: cy + r * 0.12, r: s * 0.065 }, { x: cx + r * 0.38, y: cy + r * 0.12, r: s * 0.065 }];
    },
    unicorn: function(ctx, cx, base, s, b, o) {
        const g = geo.unicorn(cx, base, s, b), r = g.r, cy = g.cy, mane = o.accent, mane2 = mix(o.accent, alt(o), 0.5);
        const horn = mix(o.accent, "#ffe7a0", 0.55);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, mane, cx + d * r * 0.8, cy + r * 0.3, r * 0.26, r * 0.85);
            fillOval(ctx, mane2, cx + d * r * 0.86, cy + r * 0.62, r * 0.15, r * 0.5);
            fillPoly(ctx, o.body, [cx + d * r * 0.55, cy - r * 0.7, cx + d * r * 0.85, cy - r * 1.3, cx + d * r * 0.2, cy - r * 0.95]);
            fillPoly(ctx, mane, [cx + d * r * 0.55, cy - r * 0.82, cx + d * r * 0.76, cy - r * 1.1, cx + d * r * 0.35, cy - r * 0.95]);
        });
        fillPoly(ctx, horn, [cx - r * 0.15, cy - r * 0.8, cx + r * 0.15, cy - r * 0.8, cx, cy - r * 1.95]);
        if (!o.sil) {
            ctx.strokeStyle = mix(horn, alt(o), 0.35); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [0.18, 0.4, 0.62].forEach(function(k) {
                const yy = cy - r * (0.8 + k * 1.15), hw = r * 0.15 * (1 - k * 0.9);
                ctx.beginPath(); ctx.moveTo(cx - hw, yy + r * 0.07); ctx.lineTo(cx + hw, yy - r * 0.07); ctx.stroke();
            });
        }
        fillOval(ctx, o.body, cx, cy, r * 0.85, r * 1.0);
        fillOval(ctx, mane, cx - r * 0.18, cy - r * 0.78, r * 0.42, r * 0.22);
        fillOval(ctx, mane, cx + r * 0.3, cy - r * 0.74, r * 0.3, r * 0.2);
        fillOval(ctx, mix(o.bodyS, "#ffffff", 0.55), cx, cy + r * 0.58, r * 0.55, r * 0.4);
        fillOval(ctx, alt(o), cx - r * 0.2, cy + r * 0.5, r * 0.07, r * 0.05);
        fillOval(ctx, alt(o), cx + r * 0.2, cy + r * 0.5, r * 0.07, r * 0.05);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.3, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.82, s * 0.03, o);
        return [{ x: cx - r * 0.42, y: cy - r * 0.02, r: s * 0.065 }, { x: cx + r * 0.42, y: cy - r * 0.02, r: s * 0.065 }];
    },
    mermaid: function(ctx, cx, base, s, b, o) {
        const g = geo.mermaid(cx, base, s, b), r = g.r, cy = g.cy, hair = alt(o), tn = skinTone(o), sw = Math.sin(o.t * 3) * s * 0.03;
        const wy = cy + r * 1.3, tx = cx + r * 0.7 + sw, ty = base - s * 0.1;
        fillOval(ctx, hair, cx, cy + r * 0.5, r * 1.1, r * 1.05);
        ctx.fillStyle = o.body; ctx.beginPath();
        ctx.moveTo(cx - r * 0.7, wy); ctx.lineTo(cx + r * 0.7, wy);
        ctx.bezierCurveTo(cx + r * 0.75, wy + (base - wy) * 0.4, tx + r * 0.2, wy + (base - wy) * 0.6, tx + r * 0.15, ty);
        ctx.lineTo(tx - r * 0.2, ty + s * 0.03);
        ctx.bezierCurveTo(tx - r * 0.5, wy + (base - wy) * 0.65, cx - r * 0.8, wy + (base - wy) * 0.4, cx - r * 0.7, wy);
        ctx.closePath(); ctx.fill();
        fillPoly(ctx, hair, [tx - r * 0.2, ty, tx + r * 1.1, ty - s * 0.13, tx + r * 0.7, ty + s * 0.0, tx + r * 1.15, ty + s * 0.09, tx - r * 0.2, ty + s * 0.05]);
        if (!o.sil) {
            ctx.strokeStyle = hair; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [0.25, 0.5].forEach(function(k) {
                const yy = wy + (ty - wy) * k, xx = cx + r * 0.08 * k + sw * k * 0.6;
                ctx.beginPath(); ctx.arc(xx - r * 0.2, yy, r * 0.22, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
                ctx.beginPath(); ctx.arc(xx + r * 0.25, yy, r * 0.22, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
            });
        }
        fillOval(ctx, tn, cx, cy + r * 1.08, r * 0.58, r * 0.4);
        fillOval(ctx, o.accent, cx - r * 0.28, cy + r * 1.12, r * 0.28, r * 0.22);
        fillOval(ctx, o.accent, cx + r * 0.28, cy + r * 1.12, r * 0.28, r * 0.22);
        fillOval(ctx, tn, cx, cy, r * 0.9, r * 0.92);
        ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, r * 0.98, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillPoly(ctx, hair, [cx - r * 0.98, cy - r * 0.05, cx - r * 0.05, cy - r * 0.2, cx - r * 0.55, cy + r * 0.3, cx - r * 0.98, cy + r * 0.5]);
        fillPoly(ctx, hair, [cx + r * 0.98, cy - r * 0.05, cx + r * 0.1, cy - r * 0.2, cx + r * 0.55, cy + r * 0.3, cx + r * 0.98, cy + r * 0.5]);
        ctx.fillStyle = o.accent; star(ctx, cx - r * 0.62, cy - r * 0.5, r * 0.22);
        cheeks(ctx, cx - r * 0.6, cx + r * 0.6, cy + r * 0.5, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.55, s * 0.03, o);
        return [{ x: cx - r * 0.4, y: cy + r * 0.05, r: s * 0.06 }, { x: cx + r * 0.4, y: cy + r * 0.05, r: s * 0.06 }];
    },
    goblin: function(ctx, cx, base, s, b, o) {
        const g = geo.goblin(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), nose = shade(o.bodyS, 0.15), ivory = mix(o.accent, "#ffffff", 0.85);
        fillPoly(ctx, dk, [cx - r * 0.75, cy + r * 0.75, cx + r * 0.75, cy + r * 0.75, cx + r * 1.0, base - s * 0.02, cx + r * 0.7, base - s * 0.06,
                           cx + r * 0.4, base - s * 0.01, cx, base - s * 0.06, cx - r * 0.4, base - s * 0.01, cx - r * 0.7, base - s * 0.06, cx - r * 1.0, base - s * 0.02]);
        fillRect(ctx, o.accent, cx - r * 0.85, base - s * 0.15, r * 1.7, s * 0.025);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.85, cy - r * 0.1, cx + d * r * 1.75, cy - r * 0.9, cx + d * r * 1.5, cy - r * 0.2, cx + d * r * 0.95, cy + r * 0.4]);
            fillPoly(ctx, o.accent, [cx + d * r * 1.0, cy - r * 0.05, cx + d * r * 1.55, cy - r * 0.62, cx + d * r * 1.35, cy - r * 0.15]);
        });
        fillOval(ctx, o.body, cx, cy, r, r * 0.95);
        [-0.35, 0, 0.35].forEach(function(k) { fillPoly(ctx, nose, [cx + k * r - r * 0.12, cy - r * 0.88, cx + k * r + r * 0.12, cy - r * 0.88, cx + k * r * 1.2, cy - r * 1.28]); });
        fillOval(ctx, nose, cx, cy + r * 0.22, r * 0.2, r * 0.28);
        cheeks(ctx, cx - r * 0.72, cx + r * 0.72, cy + r * 0.45, s * 0.04, o);
        brow(ctx, cx - r * 0.42, cy - r * 0.4, r * 0.5, -r * 0.14, o);
        brow(ctx, cx + r * 0.42, cy - r * 0.4, r * 0.5, r * 0.14, o);
        mouth(ctx, cx, cy + r * 0.66, s * 0.065, o);
        if (!o.sil && o.mouthStyle !== "none") [-1, 1].forEach(function(d) {
            fillPoly(ctx, ivory, [cx + d * s * 0.04, cy + r * 0.72, cx + d * s * 0.07, cy + r * 0.72, cx + d * s * 0.055, cy + r * 0.72 - s * 0.04]);
        });
        return [{ x: cx - r * 0.42, y: cy - r * 0.12, r: s * 0.065 }, { x: cx + r * 0.42, y: cy - r * 0.12, r: s * 0.065 }];
    },
    phoenix: function(ctx, cx, base, s, b, o) {
        const g = geo.phoenix(cx, base, s, b), r = g.r, cy = g.cy, fire = mix(o.accent, "#ffb347", 0.5), fire2 = mix(o.accent, "#ff7a3a", 0.5), dk = alt(o);
        const fl = Math.sin(o.t * 7) * s * 0.03;
        [-2, -1, 0, 1, 2].forEach(function(k) {
            const tipx = cx + k * r * 0.75 + fl * k * 0.4, tipy = base - s * 0.02 - (2 - Math.abs(k)) * 0.0 + Math.abs(k) * -s * 0.04;
            fillPoly(ctx, k % 2 === 0 ? fire : (k < 0 ? dk : fire2), [cx + k * r * 0.1 - r * 0.2, cy + r * 0.6, cx + k * r * 0.1 + r * 0.2, cy + r * 0.6, tipx + r * 0.12, tipy, tipx - r * 0.12, tipy]);
        });
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, fire, [cx + d * r * 0.7, cy - r * 0.4, cx + d * r * 1.85, cy - r * 1.05 + fl, cx + d * r * 1.7, cy - r * 0.4 + fl * 0.5, cx + d * r * 0.8, cy + r * 0.1]);
            fillPoly(ctx, dk, [cx + d * r * 0.7, cy - r * 0.05, cx + d * r * 1.8, cy - r * 0.5 + fl, cx + d * r * 1.6, cy + r * 0.2 + fl * 0.4, cx + d * r * 0.8, cy + r * 0.5]);
        });
        [-1, 0, 1].forEach(function(k) {
            fillPoly(ctx, k === 0 ? fire : fire2, [cx + k * r * 0.3 - r * 0.16, cy - r * 0.8, cx + k * r * 0.3 + r * 0.16, cy - r * 0.8, cx + k * r * 0.5 + fl * 0.4, cy - r * (k === 0 ? 1.7 : 1.4)]);
        });
        fillOval(ctx, o.body, cx, cy, r * 1.0, r * 1.05);
        fillOval(ctx, mix(o.bodyS, o.accent, 0.55), cx, cy + r * 0.45, r * 0.65, r * 0.5);
        fillPoly(ctx, mix(o.accent, "#ffc04d", 0.7), [cx - r * 0.16, cy + r * 0.12, cx + r * 0.16, cy + r * 0.12, cx, cy + r * 0.5]);
        cheeks(ctx, cx - r * 0.68, cx + r * 0.68, cy + r * 0.2, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.1, r: s * 0.06 }, { x: cx + r * 0.4, y: cy - r * 0.1, r: s * 0.06 }];
    },

    // ---- sci-fi
    cyborg: function(ctx, cx, base, s, b, o) {
        const g = geo.cyborg(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), tn = skinTone(o), metal = mix(light(o.accent, 0.1), "#8f9bab", 0.55);
        fillPoly(ctx, o.body, [cx - r * 0.8, cy + r * 0.8, cx + r * 0.8, cy + r * 0.8, cx + r * 1.1, base, cx - r * 1.1, base]);
        fillRect(ctx, dk, cx - r * 0.12, cy + r * 0.85, r * 0.24, base - (cy + r * 0.85));
        fillOval(ctx, metal, cx + r * 0.95, cy + r * 1.0, r * 0.4, r * 0.3);
        fillOval(ctx, dk, cx - r * 0.95, cy + r * 1.0, r * 0.34, r * 0.26);
        fillOval(ctx, o.accent, cx - r * 0.5, cy + r * 1.4, s * 0.02, s * 0.02);
        ctx.strokeStyle = metal; ctx.lineWidth = Math.max(1, s * 0.02); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + r * 0.6, cy - r * 0.6); ctx.lineTo(cx + r * 0.95, cy - r * 1.4); ctx.stroke();
        fillOval(ctx, o.accent, cx + r * 0.95, cy - r * 1.45, s * 0.03, s * 0.03);
        fillOval(ctx, tn, cx, cy, r, r);
        ctx.fillStyle = metal; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
        fillPoly(ctx, dk, [cx - r * 0.95, cy - r * 0.1, cx - r * 0.3, cy - r * 0.95, cx - r * 0.1, cy - r * 0.75, cx - r * 0.5, cy - r * 0.15]);
        if (!o.sil) {
            ctx.strokeStyle = shade(metal, 0.3); ctx.lineWidth = Math.max(1, s * 0.012);
            ctx.beginPath(); ctx.moveTo(cx + r * 0.5, cy - r * 0.85); ctx.lineTo(cx + r * 0.5, cy + r * 0.8); ctx.stroke();
            fillOval(ctx, shade(metal, 0.3), cx + r * 0.78, cy + r * 0.5, s * 0.01, s * 0.01);
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.014);
            ctx.beginPath(); ctx.arc(cx + r * 0.38, cy + r * 0.05, s * 0.078, 0, Math.PI * 2); ctx.stroke();
        }
        cheeks(ctx, cx - r * 0.62, cx - r * 0.62, cy + r * 0.45, s * 0.035, o);
        mouth(ctx, cx - r * 0.1, cy + r * 0.58, s * 0.04, o);
        return [{ x: cx - r * 0.38, y: cy + r * 0.05, r: s * 0.06 }, { x: cx + r * 0.38, y: cy + r * 0.05, r: s * 0.06, square: true }];
    },
    android: function(ctx, cx, base, s, b, o) {
        const g = geo.android(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), plate = light(o.bodyS, 0.55), core = 0.75 + 0.25 * Math.sin(o.t * 3);
        fillPoly(ctx, o.body, [cx - r * 0.5, cy + r * 0.85, cx + r * 0.5, cy + r * 0.85, cx + r * 1.0, cy + r * 1.2, cx + r * 0.8, base, cx - r * 0.8, base, cx - r * 1.0, cy + r * 1.2]);
        fillRect(ctx, dk, cx - r * 0.2, cy + r * 0.8, r * 0.4, r * 0.2);
        fillOval(ctx, o.accent, cx, cy + r * 1.75, s * 0.05 * core, s * 0.05 * core);
        fillOval(ctx, light(o.accent, 0.6), cx, cy + r * 1.75, s * 0.025 * core, s * 0.025 * core);
        fillRect(ctx, dk, cx - r * 0.6, base - s * 0.08, r * 1.2, s * 0.03);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.accent, cx + d * r * 0.92, cy + r * 0.05, r * 0.2, r * 0.34);
            fillOval(ctx, dk, cx + d * r * 0.92, cy + r * 0.05, r * 0.09, r * 0.18);
        });
        fillOval(ctx, o.body, cx, cy, r * 0.88, r * 1.02);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.22)", cx - r * 0.4, cy - r * 0.7, r * 0.2, r * 0.12);
        fillOval(ctx, plate, cx, cy + r * 0.2, r * 0.7, r * 0.62);
        if (!o.sil) {
            ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.01); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.0); ctx.lineTo(cx, cy - r * 0.42); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - r * 0.85, cy - r * 0.35); ctx.lineTo(cx + r * 0.85, cy - r * 0.35); ctx.stroke();
        }
        cheeks(ctx, cx - r * 0.55, cx + r * 0.55, cy + r * 0.52, s * 0.03, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        return [{ x: cx - r * 0.36, y: cy + r * 0.12, r: s * 0.065 }, { x: cx + r * 0.36, y: cy + r * 0.12, r: s * 0.065 }];
    },
    ufo: function(ctx, cx, base, s, b, o) {
        const g = geo.ufo(cx, base, s, b), r = g.r, hov = Math.sin(o.t * 2.5) * s * 0.015, cy = g.cy + hov, dk = alt(o);
        const glass = mix(o.accent, "#aee8ff", 0.5), green = mix(o.accent, "#8fe08f", 0.7), lamp = mix(o.accent, "#ffe38a", 0.7);
        fillPoly(ctx, light(o.accent, 0.55), [cx - r * 0.55, cy + r * 0.8, cx + r * 0.55, cy + r * 0.8, cx + r * 1.3, base, cx - r * 1.3, base]);
        ctx.fillStyle = glass; ctx.beginPath(); ctx.arc(cx, cy + r * 0.3, r, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillOval(ctx, green, cx, cy, r * 0.5, r * 0.52);
        [-1, 1].forEach(function(d) {
            ctx.strokeStyle = green; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(cx + d * r * 0.25, cy - r * 0.45); ctx.lineTo(cx + d * r * 0.4, cy - r * 0.68); ctx.stroke();
            fillOval(ctx, green, cx + d * r * 0.4, cy - r * 0.7, s * 0.014, s * 0.014);
        });
        fillOval(ctx, o.body, cx, cy + r * 0.5, r * 1.6, r * 0.42);
        fillOval(ctx, dk, cx, cy + r * 0.7, r * 0.9, r * 0.18);
        [-2, -1, 0, 1, 2].forEach(function(k) { fillOval(ctx, lamp, cx + k * r * 0.55, cy + r * 0.52 + Math.abs(k) * r * 0.02, s * 0.02, s * 0.02); });
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.35)", cx - r * 0.55, cy - r * 0.4, r * 0.16, r * 0.08);
        mouth(ctx, cx, cy + r * 0.3, s * 0.025, o);
        return [{ x: cx - r * 0.2, y: cy - r * 0.02, r: s * 0.05 }, { x: cx + r * 0.2, y: cy - r * 0.02, r: s * 0.05 }];
    },
    spacecat: function(ctx, cx, base, s, b, o) {
        const g = geo.spacecat(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), suit = light(o.bodyS, 0.6), fire = mix(o.accent, "#ffb347", 0.6);
        const fl = 0.7 + 0.3 * Math.sin(o.t * 18), R = r * 1.25;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, fire, [cx + d * R * 1.0 - r * 0.14, cy + R * 0.7, cx + d * R * 1.0 + r * 0.14, cy + R * 0.7, cx + d * R * 1.0, cy + R * 0.7 + s * 0.1 * fl]);
            fillOval(ctx, dk, cx + d * R * 1.0, cy + R * 0.3, r * 0.22, r * 0.5);
        });
        fillOval(ctx, suit, cx, base - s * 0.07, r * 1.0, s * 0.075);
        [-1, 1].forEach(function(d) { fillOval(ctx, dk, cx + d * r * 0.45, base - s * 0.025, r * 0.3, s * 0.03); });
        fillOval(ctx, mix(o.accent, "#cfeeff", 0.6), cx, cy - r * 0.05, R, R);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.85, cy - r * 0.3, cx + d * r * 0.78, cy - r * 1.05, cx + d * r * 0.2, cy - r * 0.78]);
            fillPoly(ctx, o.accent, [cx + d * r * 0.72, cy - r * 0.45, cx + d * r * 0.68, cy - r * 0.85, cx + d * r * 0.32, cy - r * 0.68]);
        });
        fillOval(ctx, o.body, cx, cy + r * 0.05, r * 0.95, r * 0.88);
        fillPoly(ctx, o.accent, [cx - s * 0.025, cy + r * 0.2, cx + s * 0.025, cy + r * 0.2, cx, cy + r * 0.27]);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.4, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.45, s * 0.035, o);
        ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1.2, s * 0.026);
        ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, R, 0, Math.PI * 2); ctx.stroke();
        if (!o.sil) {
            ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = Math.max(1, s * 0.016); ctx.lineCap = "round";
            ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, R * 0.82, 1.15 * Math.PI, 1.45 * Math.PI); ctx.stroke();
        }
        return [{ x: cx - r * 0.38, y: cy - r * 0.02, r: s * 0.06 }, { x: cx + r * 0.38, y: cy - r * 0.02, r: s * 0.06 }];
    },

    // ---- spooky
    vampire: function(ctx, cx, base, s, b, o) {
        const g = geo.vampire(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), pale = light(skinTone(o), 0.35), hair = shade(o.bodyS, 0.55), ivory = "#ffffff";
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, dk, [cx + d * r * 0.2, cy + r * 0.8, cx + d * r * 1.1, cy - r * 0.1, cx + d * r * 1.3, cy + r * 1.4, cx + d * r * 0.3, cy + r * 1.3]);
            fillPoly(ctx, o.accent, [cx + d * r * 0.5, cy + r * 0.95, cx + d * r * 1.05, cy + r * 0.2, cx + d * r * 1.2, cy + r * 1.3, cx + d * r * 0.55, cy + r * 1.3]);
        });
        fillPoly(ctx, dk, [cx - r * 0.7, cy + r * 0.8, cx + r * 0.7, cy + r * 0.8, cx + r * 1.1, base, cx - r * 1.1, base]);
        fillPoly(ctx, o.body, [cx - r * 0.4, cy + r * 0.9, cx + r * 0.4, cy + r * 0.9, cx + r * 0.6, base, cx - r * 0.6, base]);
        fillPoly(ctx, "#ffffff", [cx - r * 0.3, cy + r * 0.85, cx, cy + r * 1.35, cx + r * 0.3, cy + r * 0.85]);
        [-1, 1].forEach(function(d) { fillPoly(ctx, pale, [cx + d * r * 0.9, cy - r * 0.05, cx + d * r * 1.35, cy - r * 0.45, cx + d * r * 0.85, cy + r * 0.3]); });
        fillOval(ctx, pale, cx, cy + r * 0.05, r * 0.92, r * 0.95);
        ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(cx, cy - r * 0.05, r * 0.98, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillPoly(ctx, hair, [cx - r * 0.98, cy - r * 0.05, cx - r * 0.2, cy - r * 0.2, cx, cy + r * 0.06, cx + r * 0.2, cy - r * 0.2, cx + r * 0.98, cy - r * 0.05]);
        cheeks(ctx, cx - r * 0.6, cx + r * 0.6, cy + r * 0.5, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.04, o);
        if (!o.sil && o.mouthStyle !== "none") [-1, 1].forEach(function(d) {
            fillPoly(ctx, ivory, [cx + d * s * 0.03, cy + r * 0.6, cx + d * s * 0.055, cy + r * 0.6, cx + d * s * 0.043, cy + r * 0.6 + s * 0.05]);
        });
        return [{ x: cx - r * 0.38, y: cy + r * 0.12, r: s * 0.06 }, { x: cx + r * 0.38, y: cy + r * 0.12, r: s * 0.06 }];
    },
    werewolf: function(ctx, cx, base, s, b, o) {
        const g = geo.werewolf(cx, base, s, b), r = g.r, cy = g.cy, dk = shade(o.bodyS, 0.35), ivory = mix(o.accent, "#ffffff", 0.85);
        tufts(ctx, o.body, cx, base - s * 0.14, r * 1.05, s * 0.13, 7, s * 0.05, 0, Math.PI * 2);
        fillOval(ctx, o.body, cx, base - s * 0.14, r * 1.05, s * 0.13);
        tufts(ctx, o.body, cx, cy + r * 0.05, r * 1.0, r * 0.95, 12, r * 0.3, 0, Math.PI * 2);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.85, cy - r * 0.35, cx + d * r * 0.8, cy - r * 1.4, cx + d * r * 0.2, cy - r * 0.85]);
            fillPoly(ctx, dk, [cx + d * r * 0.7, cy - r * 0.55, cx + d * r * 0.7, cy - r * 1.1, cx + d * r * 0.35, cy - r * 0.8]);
            [0, 1, 2].forEach(function(k) { fillPoly(ctx, ivory, [cx + d * (r * 0.62 + k * r * 0.2) - r * 0.07, base - s * 0.03, cx + d * (r * 0.62 + k * r * 0.2) + r * 0.07, base - s * 0.03, cx + d * (r * 0.62 + k * r * 0.2), base + s * 0.0]); });
        });
        fillOval(ctx, o.body, cx, cy, r * 1.0, r * 0.95);
        fillOval(ctx, mix(o.bodyS, o.accent, 0.5), cx, cy + r * 0.4, r * 0.52, r * 0.4);
        fillOval(ctx, ink(o), cx, cy + r * 0.24, r * 0.17, r * 0.11);
        brow(ctx, cx - r * 0.42, cy - r * 0.4, r * 0.5, -r * 0.14, o);
        brow(ctx, cx + r * 0.42, cy - r * 0.4, r * 0.5, r * 0.14, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.045, o);
        if (!o.sil && o.mouthStyle !== "none") [-1, 1].forEach(function(d) {
            fillPoly(ctx, ivory, [cx + d * s * 0.035, cy + r * 0.64, cx + d * s * 0.06, cy + r * 0.64, cx + d * s * 0.048, cy + r * 0.64 + s * 0.04]);
        });
        return [{ x: cx - r * 0.42, y: cy - r * 0.12, r: s * 0.06 }, { x: cx + r * 0.42, y: cy - r * 0.12, r: s * 0.06 }];
    },
    mummy: function(ctx, cx, base, s, b, o) {
        const g = geo.mummy(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), slot = ink(o), sw = Math.sin(o.t * 2) * s * 0.01;
        fillPoly(ctx, o.body, [cx + r * 0.55, cy + r * 0.55, cx + r * 0.95, cy + r * 0.7, cx + r * 1.25 + sw, cy + r * 1.75, cx + r * 0.95 + sw, cy + r * 1.8]);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * r * 1.05, base - s * 0.24, r * 0.22, r * 0.45); });
        fillOval(ctx, o.body, cx, base - s * 0.17, r * 1.0, s * 0.17);
        fillOval(ctx, o.body, cx, cy, r * 1.0, r * 0.95);
        if (!o.sil) {
            ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            for (let i = -3; i <= 3; i++) {
                const yy = i * r * 0.26, hw = r * Math.sqrt(Math.max(0, 1 - Math.pow(yy / (r * 0.95), 2)));
                ctx.beginPath(); ctx.moveTo(cx - hw, cy + yy + r * 0.07); ctx.lineTo(cx + hw, cy + yy - r * 0.07); ctx.stroke();
            }
            for (let j = 0; j < 4; j++) {
                const by = base - s * 0.3 + j * s * 0.07, bw = r * 0.95 * Math.sqrt(Math.max(0, 1 - Math.pow((by - (base - s * 0.17)) / (s * 0.17), 2)));
                ctx.beginPath(); ctx.moveTo(cx - bw, by + s * 0.02); ctx.lineTo(cx + bw, by - s * 0.02); ctx.stroke();
            }
        }
        ctx.fillStyle = slot; roundRect(ctx, cx - r * 0.78, cy - r * 0.24, r * 1.56, r * 0.46, r * 0.14); ctx.fill();
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        return [{ x: cx - r * 0.38, y: cy - r * 0.02, r: s * 0.055 }, { x: cx + r * 0.38, y: cy - r * 0.02, r: s * 0.055 }];
    },
    zombie: function(ctx, cx, base, s, b, o) {
        const g = geo.zombie(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), hair = shade(o.bodyS, 0.55), ivory = mix(o.accent, "#ffffff", 0.8);
        ctx.lineCap = "round";
        [-1, 1].forEach(function(d) {
            ctx.strokeStyle = o.body; ctx.lineWidth = s * 0.07;
            ctx.beginPath(); ctx.moveTo(cx + d * r * 0.8, cy + r * 1.0); ctx.lineTo(cx + d * r * 1.45, cy + r * 0.8); ctx.stroke();
            ctx.strokeStyle = dk; ctx.lineWidth = s * 0.085;
            ctx.beginPath(); ctx.moveTo(cx + d * r * 0.75, cy + r * 1.0); ctx.lineTo(cx + d * r * 1.0, cy + r * 0.92); ctx.stroke();
            fillOval(ctx, o.body, cx + d * r * 1.55, cy + r * 0.78, r * 0.2, r * 0.18);
        });
        fillPoly(ctx, dk, [cx - r * 0.8, cy + r * 0.75, cx + r * 0.8, cy + r * 0.75, cx + r * 1.0, base - s * 0.02, cx + r * 0.65, base - s * 0.06,
                           cx + r * 0.3, base - s * 0.01, cx - r * 0.1, base - s * 0.06, cx - r * 0.5, base - s * 0.01, cx - r * 1.0, base - s * 0.04]);
        fillOval(ctx, o.body, cx, cy, r, r * 0.95);
        [-0.5, -0.2, 0.15].forEach(function(k) { fillPoly(ctx, hair, [cx + k * r - r * 0.1, cy - r * 0.85, cx + k * r + r * 0.12, cy - r * 0.85, cx + k * r + r * 0.02, cy - r * 1.25]); });
        if (!o.sil) {
            ctx.strokeStyle = ink(o); ctx.lineWidth = Math.max(1, s * 0.012);
            ctx.beginPath(); ctx.moveTo(cx + r * 0.1, cy - r * 0.62); ctx.lineTo(cx + r * 0.7, cy - r * 0.5); ctx.stroke();
            [0.2, 0.35, 0.5, 0.65].forEach(function(k) {
                const x = cx + r * k, y = cy - r * 0.62 + (k - 0.1) * r * 0.2;
                ctx.beginPath(); ctx.moveTo(x, y - r * 0.08); ctx.lineTo(x, y + r * 0.08); ctx.stroke();
            });
        }
        brow(ctx, cx - r * 0.42, cy - r * 0.38, r * 0.5, r * 0.1, o);
        cheeks(ctx, cx - r * 0.68, cx + r * 0.68, cy + r * 0.45, s * 0.04, o);
        mouth(ctx, cx - r * 0.05, cy + r * 0.62, s * 0.05, o);
        if (!o.sil && o.mouthStyle !== "none") fillPoly(ctx, ivory, [cx + r * 0.2, cy + r * 0.62, cx + r * 0.38, cy + r * 0.62, cx + r * 0.3, cy + r * 0.62 + s * 0.04]);
        return [{ x: cx - r * 0.42, y: cy - r * 0.05, r: s * 0.07 }, { x: cx + r * 0.42, y: cy - r * 0.02, r: s * 0.05 }];
    },
    yeti: function(ctx, cx, base, s, b, o) {
        const g = geo.yeti(cx, base, s, b), r = g.r, cy = g.cy, dk = shade(o.bodyS, 0.2), face = mix(o.accent, "#cfeaff", 0.4), ivory = "#ffffff";
        [-1, 1].forEach(function(d) {
            fillOval(ctx, dk, cx + d * r * 0.5, base - s * 0.04, r * 0.42, s * 0.05);
            fillOval(ctx, face, cx + d * r * 0.5, base - s * 0.04, r * 0.26, s * 0.03);
        });
        tufts(ctx, o.body, cx, cy + r * 0.75, r * 1.15, r * 0.95, 11, r * 0.22, 0, Math.PI * 2);
        fillOval(ctx, o.body, cx, cy + r * 0.75, r * 1.15, r * 0.95);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * r * 1.12, cy + r * 0.85, r * 0.3, r * 0.65);
            tufts(ctx, o.body, cx + d * r * 1.12, cy + r * 0.85, r * 0.3, r * 0.65, 5, r * 0.14, d > 0 ? -Math.PI / 2 : Math.PI / 2, d > 0 ? Math.PI / 2 : Math.PI * 1.5);
        });
        tufts(ctx, o.body, cx, cy, r * 1.0, r * 0.98, 9, r * 0.25, Math.PI * 1.0, Math.PI * 2.0);
        fillOval(ctx, o.body, cx, cy, r * 1.0, r * 0.98);
        fillOval(ctx, face, cx, cy + r * 0.12, r * 0.72, r * 0.64);
        fillOval(ctx, dk, cx, cy - r * 0.32, r * 0.6, r * 0.12);
        fillOval(ctx, mix(face, o.accent, 0.4), cx, cy + r * 0.2, r * 0.12, r * 0.08);
        cheeks(ctx, cx - r * 0.55, cx + r * 0.55, cy + r * 0.38, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.5, s * 0.055, o);
        if (!o.sil && o.mouthStyle !== "none") [-1, 1].forEach(function(d) {
            fillPoly(ctx, ivory, [cx + d * s * 0.03, cy + r * 0.52, cx + d * s * 0.055, cy + r * 0.52, cx + d * s * 0.043, cy + r * 0.52 + s * 0.035]);
        });
        return [{ x: cx - r * 0.36, y: cy - r * 0.1, r: s * 0.06 }, { x: cx + r * 0.36, y: cy - r * 0.1, r: s * 0.06 }];
    },
    cyclops: function(ctx, cx, base, s, b, o) {
        const g = geo.cyclops(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), club = mix(dk, "#8a5a3a", 0.5), ivory = mix(o.accent, "#ffffff", 0.85);
        fillPoly(ctx, club, [cx + r * 1.0, base - s * 0.02, cx + r * 1.22, base - s * 0.02, cx + r * 1.42, cy + r * 0.2, cx + r * 1.1, cy + r * 0.2]);
        fillOval(ctx, club, cx + r * 1.27, cy + r * 0.1, r * 0.3, r * 0.42);
        [0, 1, 2].forEach(function(k) { fillOval(ctx, ivory, cx + r * 1.27 + (k - 1) * r * 0.17, cy + r * 0.0 + (k % 2) * r * 0.2, s * 0.012, s * 0.012); });
        fillOval(ctx, o.body, cx, base - s * 0.12, r * 0.95, s * 0.12);
        fillPoly(ctx, dk, [cx - r * 0.7, base - s * 0.2, cx + r * 0.7, base - s * 0.2, cx + r * 0.6, base - s * 0.02, cx - r * 0.6, base - s * 0.02]);
        fillPoly(ctx, o.accent, [cx - r * 0.05, cy - r * 0.8, cx + r * 0.2, cy - r * 0.85, cx + r * 0.08, cy - r * 1.55, cx - r * 0.1, cy - r * 1.25]);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * r * 1.0, cy + r * 0.05, r * 0.16, r * 0.26); });
        fillOval(ctx, o.body, cx, cy, r * 1.05, r * 0.98);
        [-1, 1].forEach(function(d) { fillPoly(ctx, ivory, [cx + d * r * 0.5, cy + r * 0.6, cx + d * r * 0.7, cy + r * 0.6, cx + d * r * 0.62, cy + r * 0.2]); });
        brow(ctx, cx, cy - r * 0.52, r * 0.95, 0, o);
        cheeks(ctx, cx - r * 0.72, cx + r * 0.72, cy + r * 0.38, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.55, s * 0.06, o);
        return [{ x: cx, y: cy - r * 0.05, r: s * 0.13 }];
    },
    // ---- animals (new)
    fox: function(ctx, cx, base, s, b, o) {
        const g = geo.fox(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), wh = mix(o.bodyS, "#ffffff", 0.8);
        ctx.fillStyle = o.body; ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, base - s * 0.03);
        ctx.bezierCurveTo(cx + r * 1.6, base + s * 0.0, cx + r * 1.85, cy + r * 0.3, cx + r * 1.45, cy - r * 0.1);
        ctx.bezierCurveTo(cx + r * 1.3, cy + r * 0.3, cx + r * 1.1, base - s * 0.13, cx + r * 0.5, base - s * 0.13);
        ctx.closePath(); ctx.fill();
        fillOval(ctx, wh, cx + r * 1.55, cy + r * 0.05, r * 0.22, r * 0.28);
        fillOval(ctx, o.body, cx, base - s * 0.08, r * 0.75, s * 0.08);
        fillOval(ctx, dk, cx - r * 0.35, base - s * 0.025, r * 0.22, s * 0.025);
        fillOval(ctx, dk, cx + r * 0.35, base - s * 0.025, r * 0.22, s * 0.025);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.9, cy - r * 0.2, cx + d * r * 0.85, cy - r * 1.45, cx + d * r * 0.15, cy - r * 0.75]);
            fillPoly(ctx, dk, [cx + d * r * 0.8, cy - r * 0.9, cx + d * r * 0.85, cy - r * 1.45, cx + d * r * 0.45, cy - r * 1.05]);
        });
        fillOval(ctx, o.body, cx, cy - r * 0.1, r * 0.95, r * 0.8);
        fillPoly(ctx, o.body, [cx - r * 0.95, cy + r * 0.15, cx + r * 0.95, cy + r * 0.15, cx, cy + r * 0.98]);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, wh, [cx + d * r * 1.02, cy + r * 0.02, cx + d * r * 0.1, cy + r * 0.4, cx + d * r * 0.02, cy + r * 0.96, cx + d * r * 0.62, cy + r * 0.62]);
        });
        fillOval(ctx, ink(o), cx, cy + r * 0.92, r * 0.1, r * 0.08);
        cheeks(ctx, cx - r * 0.72, cx + r * 0.72, cy + r * 0.28, s * 0.03, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.028, o);
        return [{ x: cx - r * 0.42, y: cy - r * 0.02, r: s * 0.055 }, { x: cx + r * 0.42, y: cy - r * 0.02, r: s * 0.055 }];
    },
    bear: function(ctx, cx, base, s, b, o) {
        const g = geo.bear(cx, base, s, b), r = g.r, cy = g.cy, mz = mix(o.bodyS, "#ffffff", 0.55);
        fillOval(ctx, o.body, cx, base - s * 0.12, r * 0.95, s * 0.12);
        fillOval(ctx, mz, cx, base - s * 0.11, r * 0.55, s * 0.085);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * r * 0.88, base - s * 0.07, r * 0.22, r * 0.28);
            fillOval(ctx, o.body, cx + d * r * 0.78, cy - r * 0.78, r * 0.3, r * 0.3);
            fillOval(ctx, mz, cx + d * r * 0.78, cy - r * 0.76, r * 0.16, r * 0.16);
        });
        fillOval(ctx, o.body, cx, cy, r, r * 0.92);
        fillOval(ctx, mz, cx, cy + r * 0.35, r * 0.45, r * 0.34);
        fillOval(ctx, ink(o), cx, cy + r * 0.22, r * 0.14, r * 0.1);
        cheeks(ctx, cx - r * 0.72, cx + r * 0.72, cy + r * 0.3, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.52, s * 0.035, o);
        return [{ x: cx - r * 0.42, y: cy - r * 0.08, r: s * 0.055 }, { x: cx + r * 0.42, y: cy - r * 0.08, r: s * 0.055 }];
    },
    hamster: function(ctx, cx, base, s, b, o) {
        const g = geo.hamster(cx, base, s, b), ry = g.r, rx = ry * 1.25, cy = g.cy, dk = alt(o), belly = mix(o.bodyS, "#ffffff", 0.6), tn = skinTone(o);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, o.body, cx + d * rx * 0.55, cy - ry * 0.92, ry * 0.22, ry * 0.22);
            fillOval(ctx, o.accent, cx + d * rx * 0.55, cy - ry * 0.9, ry * 0.12, ry * 0.12);
        });
        fillOval(ctx, o.body, cx, cy, rx, ry);
        fillOval(ctx, shade(o.bodyS, 0.15), cx, cy - ry * 0.72, rx * 0.34, ry * 0.12);
        fillOval(ctx, belly, cx, cy + ry * 0.28, rx * 0.78, ry * 0.62);
        if (!o.sil && o.blush !== false) { fillOval(ctx, o.accent, cx - rx * 0.66, cy + ry * 0.3, ry * 0.36, ry * 0.3); fillOval(ctx, o.accent, cx + rx * 0.66, cy + ry * 0.3, ry * 0.36, ry * 0.3); }
        fillOval(ctx, o.accent, cx, cy + ry * 0.12, s * 0.025, s * 0.018);
        mouth(ctx, cx, cy + ry * 0.38, s * 0.035, o);
        if (!o.sil && o.mouthStyle !== "none") fillRect(ctx, "#ffffff", cx - s * 0.014, cy + ry * 0.42, s * 0.028, s * 0.024);
        fillOval(ctx, dk, cx, cy + ry * 0.78, s * 0.04, s * 0.025);
        [-1, 1].forEach(function(d) { fillOval(ctx, tn, cx + d * s * 0.06, cy + ry * 0.85, s * 0.03, s * 0.025); });
        return [{ x: cx - rx * 0.45, y: cy - ry * 0.12, r: s * 0.065 }, { x: cx + rx * 0.45, y: cy - ry * 0.12, r: s * 0.065 }];
    },

    // ---- food
    sushi: function(ctx, cx, base, s, b, o) {
        const g = geo.sushi(cx, base, s, b), r = g.r, cy = g.cy, rice = mix(o.accent, "#ffffff", 0.85), nori = ink(o);
        ctx.fillStyle = rice; roundRect(ctx, cx - r * 1.1, cy - r * 0.45, r * 2.2, r * 1.35, r * 0.45); ctx.fill();
        ctx.fillStyle = o.body; ctx.beginPath();
        ctx.moveTo(cx - r * 1.25, cy - r * 0.3);
        ctx.bezierCurveTo(cx - r * 1.2, cy - r * 1.25, cx + r * 1.2, cy - r * 1.25, cx + r * 1.25, cy - r * 0.3);
        ctx.lineTo(cx + r * 1.15, cy + r * 0.05); ctx.lineTo(cx - r * 1.15, cy + r * 0.05);
        ctx.closePath(); ctx.fill();
        fillRect(ctx, nori, cx + r * 0.62, cy - r * 0.62, r * 0.32, r * 1.5);
        if (!o.sil) {
            ctx.strokeStyle = light(o.bodyS, 0.5); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [-0.55, -0.1].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * r - r * 0.18, cy - r * 0.75); ctx.quadraticCurveTo(cx + k * r, cy - r * 0.45, cx + k * r + r * 0.18, cy - r * 0.2); ctx.stroke(); });
            fillOval(ctx, mix(o.accent, "#7ed957", 0.8), cx - r * 0.75, cy - r * 0.25, r * 0.16, r * 0.1);
        }
        cheeks(ctx, cx - r * 0.62, cx + r * 0.3, cy + r * 0.55, s * 0.035, o);
        mouth(ctx, cx - r * 0.1, cy + r * 0.6, s * 0.035, o);
        return [{ x: cx - r * 0.5, y: cy + r * 0.38, r: s * 0.06 }, { x: cx + r * 0.25, y: cy + r * 0.38, r: s * 0.06 }];
    },
    ramen: function(ctx, cx, base, s, b, o) {
        const g = geo.ramen(cx, base, s, b), r = g.r, cy = g.cy, R = r * 1.35, y0 = cy - r * 0.1, rim = light(o.bodyS, 0.35);
        const noodle = mix(o.accent, "#ffe08a", 0.7), broth = mix(o.accent, "#d98a4a", 0.6), wh = mix(o.accent, "#ffffff", 0.85), yolk = mix(o.accent, "#ffb347", 0.8);
        const st = Math.sin(o.t * 2) * s * 0.01;
        if (!o.sil) {
            ctx.strokeStyle = light(o.accent, 0.5); ctx.lineWidth = Math.max(1, s * 0.016); ctx.lineCap = "round";
            [-0.5, 0, 0.5].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * r, y0 - r * 1.0); ctx.quadraticCurveTo(cx + k * r + s * 0.03 + st, y0 - r * 1.25, cx + k * r - s * 0.01, y0 - r * 1.55); ctx.stroke(); });
        }
        fillRect(ctx, ink(o), cx + r * 0.55, y0 - r * 1.05, r * 0.35, r * 0.85);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.moveTo(cx - R, y0);
        ctx.bezierCurveTo(cx - R, y0 + r * 1.55, cx + R, y0 + r * 1.55, cx + R, y0); ctx.closePath(); ctx.fill();
        fillOval(ctx, rim, cx, y0, R, r * 0.24);
        fillOval(ctx, broth, cx, y0, R * 0.92, r * 0.18);
        fillOval(ctx, noodle, cx - r * 0.35, y0 - r * 0.25, r * 0.7, r * 0.3);
        fillOval(ctx, noodle, cx + r * 0.2, y0 - r * 0.38, r * 0.6, r * 0.28);
        fillOval(ctx, wh, cx + r * 0.6, y0 - r * 0.08, r * 0.28, r * 0.2);
        fillOval(ctx, yolk, cx + r * 0.6, y0 - r * 0.06, r * 0.13, r * 0.1);
        fillOval(ctx, wh, cx - r * 0.85, y0 - r * 0.05, r * 0.26, r * 0.18);
        if (!o.sil) { ctx.fillStyle = o.accent; star(ctx, cx - r * 0.85, y0 - r * 0.05, r * 0.14); }
        if (!o.sil) {
            ctx.strokeStyle = light(o.accent, 0.4); ctx.lineWidth = Math.max(1, s * 0.012);
            ctx.beginPath(); ctx.moveTo(cx - r * 0.1, y0 - r * 0.45); ctx.lineTo(cx - R * 0.4, y0 - r * 1.35); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + r * 0.1, y0 - r * 0.45); ctx.lineTo(cx - R * 0.2, y0 - r * 1.4); ctx.stroke();
        }
        cheeks(ctx, cx - r * 0.78, cx + r * 0.78, cy + r * 0.52, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.62, s * 0.035, o);
        return [{ x: cx - r * 0.5, y: cy + r * 0.38, r: s * 0.055 }, { x: cx + r * 0.5, y: cy + r * 0.38, r: s * 0.055 }];
    },
    pizza: function(ctx, cx, base, s, b, o) {
        const g = geo.pizza(cx, base, s, b), cy = g.cy, W = s * 0.4, top = base - s * 0.8, tip = base - s * 0.02;
        const crust = mix(o.bodyS, "#d9a35c", 0.55), pep = shade(o.bodyS, 0.4), olive = ink(o);
        fillPoly(ctx, o.body, [cx - W * 0.95, top + s * 0.1, cx + W * 0.95, top + s * 0.1, cx + W * 0.1, tip - s * 0.04, cx, tip, cx - W * 0.1, tip - s * 0.04]);
        fillOval(ctx, o.body, cx + W * 0.12, tip - s * 0.07, s * 0.03, s * 0.05);
        fillOval(ctx, o.body, cx - W * 0.14, tip - s * 0.12, s * 0.025, s * 0.04);
        ctx.fillStyle = crust; roundRect(ctx, cx - W, top, W * 2, s * 0.15, s * 0.07); ctx.fill();
        if (!o.sil) {
            ctx.fillStyle = light(crust, 0.25);
            [-0.7, -0.25, 0.25, 0.7].forEach(function(k) { ctx.beginPath(); oval(ctx, cx + k * W, top + s * 0.05, s * 0.025, s * 0.012); ctx.fill(); });
        }
        [[-0.55, 0.22], [0.55, 0.22], [0.12, 0.62]].forEach(function(p) {
            fillOval(ctx, pep, cx + p[0] * W, top + s * p[1] + s * 0.06, s * 0.055, s * 0.055);
            if (!o.sil) fillOval(ctx, light(pep, 0.3), cx + p[0] * W - s * 0.014, top + s * p[1] + s * 0.045, s * 0.018, s * 0.012);
        });
        if (!o.sil) { fillOval(ctx, olive, cx - W * 0.2, top + s * 0.62, s * 0.022, s * 0.022); fillOval(ctx, olive, cx + W * 0.4, top + s * 0.5, s * 0.02, s * 0.02); }
        cheeks(ctx, cx - s * 0.16, cx + s * 0.16, cy + s * 0.07, s * 0.03, o);
        mouth(ctx, cx, cy + s * 0.1, s * 0.035, o);
        return [{ x: cx - s * 0.1, y: cy, r: s * 0.055 }, { x: cx + s * 0.1, y: cy, r: s * 0.055 }];
    },
    donut: function(ctx, cx, base, s, b, o) {
        const g = geo.donut(cx, base, s, b), R = g.r, ry = R * 0.85, cy = g.cy, dough = mix(o.accent, "#e8b070", 0.55), hole = shade(dough, 0.5);
        fillOval(ctx, dough, cx, cy, R, ry);
        fillOval(ctx, o.body, cx, cy - ry * 0.06, R * 0.94, ry * 0.86);
        [-3, -2, -1, 0, 1, 2, 3].forEach(function(k) { const u = k * 0.27; fillOval(ctx, o.body, cx + u * R, cy + ry * Math.sqrt(1 - u * u) * (0.78 + (Math.abs(k) % 2) * 0.08), R * 0.13, ry * 0.12); });
        fillOval(ctx, hole, cx, cy + ry * 0.1, R * 0.22, ry * 0.2);
        if (!o.sil) {
            fillOval(ctx, light(dough, 0.3), cx, cy + ry * 0.2, R * 0.15, ry * 0.07);
            ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, s * 0.014);
            [[-0.62, -0.5, 0.5], [0.62, -0.45, -0.5], [-0.7, 0.2, -0.4], [0.7, 0.22, 0.6], [-0.2, -0.7, 0.3], [0.25, -0.72, -0.3]].forEach(function(p, i) {
                ctx.strokeStyle = i % 2 ? light(o.accent, 0.55) : mix(o.accent, ink(o), 0.5);
                ctx.beginPath(); ctx.moveTo(cx + p[0] * R - p[2] * s * 0.02, cy + p[1] * ry - s * 0.01); ctx.lineTo(cx + p[0] * R + p[2] * s * 0.02, cy + p[1] * ry + s * 0.01); ctx.stroke();
            });
        }
        cheeks(ctx, cx - R * 0.65, cx + R * 0.65, cy - ry * 0.1, s * 0.035, o);
        mouth(ctx, cx, cy + ry * 0.68, s * 0.04, o);
        return [{ x: cx - R * 0.38, y: cy - ry * 0.32, r: s * 0.055 }, { x: cx + R * 0.38, y: cy - ry * 0.32, r: s * 0.055 }];
    },
    cupcake: function(ctx, cx, base, s, b, o) {
        const g = geo.cupcake(cx, base, s, b), r = g.r, cy = g.cy, wr = shade(mix(o.bodyS, o.accent, 0.4), 0.15), cherry = mix(o.accent, "#e23b3b", 0.75);
        fillPoly(ctx, wr, [cx - r * 1.2, cy + r * 0.45, cx + r * 1.2, cy + r * 0.45, cx + r * 0.9, base - s * 0.02, cx - r * 0.9, base - s * 0.02]);
        if (!o.sil) {
            ctx.strokeStyle = light(wr, 0.3); ctx.lineWidth = Math.max(1, s * 0.012);
            [-0.8, -0.4, 0, 0.4, 0.8].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * r * 1.1, cy + r * 0.5); ctx.lineTo(cx + k * r * 0.85, base - s * 0.03); ctx.stroke(); });
        }
        fillOval(ctx, o.body, cx, cy, r * 1.3, r * 0.8);
        fillOval(ctx, o.body, cx - r * 0.55, cy - r * 0.7, r * 0.55, r * 0.4);
        fillOval(ctx, o.body, cx + r * 0.55, cy - r * 0.7, r * 0.55, r * 0.4);
        fillOval(ctx, o.body, cx, cy - r * 1.0, r * 0.55, r * 0.42);
        fillPoly(ctx, o.body, [cx - r * 0.25, cy - r * 1.2, cx + r * 0.25, cy - r * 1.2, cx, cy - r * 1.65]);
        fillOval(ctx, cherry, cx, cy - r * 1.72, s * 0.035, s * 0.035);
        if (!o.sil) {
            ctx.lineCap = "round"; ctx.lineWidth = Math.max(1, s * 0.014);
            [[-0.8, -0.35, 0.4], [0.85, -0.3, -0.5], [-0.4, -0.95, -0.3], [0.45, -0.98, 0.5]].forEach(function(p, i) {
                ctx.strokeStyle = i % 2 ? light(o.accent, 0.5) : mix(o.accent, ink(o), 0.4);
                ctx.beginPath(); ctx.moveTo(cx + p[0] * r - p[2] * s * 0.02, cy + p[1] * r - s * 0.01); ctx.lineTo(cx + p[0] * r + p[2] * s * 0.02, cy + p[1] * r + s * 0.01); ctx.stroke();
            });
        }
        cheeks(ctx, cx - r * 0.78, cx + r * 0.78, cy + r * 0.25, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.3, s * 0.035, o);
        return [{ x: cx - r * 0.42, y: cy, r: s * 0.055 }, { x: cx + r * 0.42, y: cy, r: s * 0.055 }];
    },
    burger: function(ctx, cx, base, s, b, o) {
        const g = geo.burger(cx, base, s, b), r = g.r, cy = g.cy, y0 = base - s * 0.28, pat = alt(o), ch = mix(o.accent, "#ffd35a", 0.8), lt = mix(o.accent, "#7ed957", 0.7), seed = light(o.bodyS, 0.6);
        ctx.fillStyle = o.body; roundRect(ctx, cx - r * 0.95, base - s * 0.1, r * 1.9, s * 0.09, s * 0.045); ctx.fill();
        ctx.fillStyle = pat; roundRect(ctx, cx - r * 1.0, base - s * 0.2, r * 2.0, s * 0.11, s * 0.05); ctx.fill();
        fillRect(ctx, ch, cx - r * 0.98, base - s * 0.235, r * 1.96, s * 0.04);
        fillPoly(ctx, ch, [cx - r * 0.5, base - s * 0.2, cx - r * 0.3, base - s * 0.2, cx - r * 0.4, base - s * 0.16]);
        for (let i = -4; i <= 4; i++) fillOval(ctx, lt, cx + i * r * 0.23, y0 + s * 0.005, r * 0.17, s * 0.03);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.moveTo(cx - r, y0);
        ctx.bezierCurveTo(cx - r * 1.05, y0 - r * 1.4, cx + r * 1.05, y0 - r * 1.4, cx + r, y0); ctx.closePath(); ctx.fill();
        if (!o.sil) {
            ctx.fillStyle = seed;
            [[-0.55, 0.78], [0.0, 0.92], [0.55, 0.78], [-0.3, 0.62], [0.3, 0.62]].forEach(function(p) { ctx.beginPath(); oval(ctx, cx + p[0] * r, y0 - r * p[1] * 0.85, s * 0.016, s * 0.009); ctx.fill(); });
        }
        cheeks(ctx, cx - r * 0.7, cx + r * 0.7, cy + r * 0.2, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.2, s * 0.035, o);
        return [{ x: cx - r * 0.38, y: cy - r * 0.05, r: s * 0.055 }, { x: cx + r * 0.38, y: cy - r * 0.05, r: s * 0.055 }];
    },
    boba: function(ctx, cx, base, s, b, o) {
        const g = geo.boba(cx, base, s, b), r = g.r, cy = g.cy, top = base - s * 0.62, glass = light(o.accent, 0.55), pearl = alt(o), lid = light(o.accent, 0.7);
        ctx.strokeStyle = mix(o.accent, "#ffffff", 0.3); ctx.lineWidth = s * 0.04; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + s * 0.04, top); ctx.lineTo(cx + s * 0.13, top - s * 0.22); ctx.stroke();
        fillPoly(ctx, glass, [cx - s * 0.27, top, cx + s * 0.27, top, cx + s * 0.2, base - s * 0.02, cx - s * 0.2, base - s * 0.02]);
        fillPoly(ctx, o.body, [cx - s * 0.255, top + s * 0.1, cx + s * 0.255, top + s * 0.1, cx + s * 0.2, base - s * 0.02, cx - s * 0.2, base - s * 0.02]);
        [[-0.12, 0.05], [-0.04, 0.06], [0.04, 0.05], [0.12, 0.06], [-0.08, 0.1], [0.0, 0.11], [0.08, 0.1]].forEach(function(p) { fillOval(ctx, pearl, cx + p[0] * s * 1.2, base - s * p[1] - s * 0.04, s * 0.026, s * 0.026); });
        fillOval(ctx, lid, cx, top, s * 0.29, s * 0.035);
        ctx.fillStyle = lid; ctx.beginPath(); ctx.moveTo(cx - s * 0.25, top); ctx.bezierCurveTo(cx - s * 0.25, top - s * 0.13, cx + s * 0.25, top - s * 0.13, cx + s * 0.25, top); ctx.closePath(); ctx.fill();
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.35)", cx - s * 0.17, top + s * 0.17, s * 0.018, s * 0.07);
        cheeks(ctx, cx - s * 0.17, cx + s * 0.17, cy + s * 0.05, s * 0.032, o);
        mouth(ctx, cx, cy + s * 0.04, s * 0.032, o);
        return [{ x: cx - r * 0.38, y: cy - s * 0.03, r: s * 0.055 }, { x: cx + r * 0.38, y: cy - s * 0.03, r: s * 0.055 }];
    },
    dumpling: function(ctx, cx, base, s, b, o) {
        const g = geo.dumpling(cx, base, s, b), r = g.r, cy = g.cy, y0 = base - s * 0.08, leaf = mix(o.accent, "#7ed957", 0.7);
        fillOval(ctx, leaf, cx, base - s * 0.035, r * 1.45, s * 0.04);
        fillOval(ctx, o.body, cx, y0, r * 1.25, s * 0.05);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.moveTo(cx - r * 1.25, y0);
        ctx.bezierCurveTo(cx - r * 1.3, y0 - r * 1.6, cx + r * 1.3, y0 - r * 1.6, cx + r * 1.25, y0); ctx.closePath(); ctx.fill();
        for (let pa = 1.12; pa < 1.9; pa += 0.1) fillOval(ctx, o.body, cx + Math.cos(Math.PI * pa) * r * 1.12, y0 + Math.sin(Math.PI * pa) * r * 1.02, s * 0.03, s * 0.03);
        fillPoly(ctx, o.body, [cx - r * 0.2, y0 - r * 1.1, cx + r * 0.2, y0 - r * 1.1, cx + r * 0.02, y0 - r * 1.4]);
        if (!o.sil) {
            ctx.strokeStyle = alt(o); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [-0.55, -0.3, -0.1, 0.1, 0.3, 0.55].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * r * 0.7, y0 - r * 1.0); ctx.lineTo(cx + k * r * 0.5, y0 - r * 0.74); ctx.stroke(); });
        }
        cheeks(ctx, cx - r * 0.78, cx + r * 0.78, cy + r * 0.2, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.25, s * 0.035, o);
        return [{ x: cx - r * 0.42, y: cy - r * 0.05, r: s * 0.06 }, { x: cx + r * 0.42, y: cy - r * 0.05, r: s * 0.06 }];
    },

    // ---- nature
    mushroom: function(ctx, cx, base, s, b, o) {
        const g = geo.mushroom(cx, base, s, b), r = g.r, capy = base - s * 0.42, stem = mix(o.accent, "#ffffff", 0.6), spot = mix(o.accent, "#ffffff", 0.85);
        ctx.fillStyle = stem; roundRect(ctx, cx - r * 0.5, capy - s * 0.02, r * 1.0, base - capy + s * 0.0, r * 0.22); ctx.fill();
        fillOval(ctx, o.accent, cx, base - s * 0.02, r * 0.62, s * 0.025);
        fillOval(ctx, shade(stem, 0.3), cx, capy, r * 1.15, s * 0.04);
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.moveTo(cx - r * 1.2, capy);
        ctx.bezierCurveTo(cx - r * 1.25, capy - r * 1.35, cx + r * 1.25, capy - r * 1.35, cx + r * 1.2, capy); ctx.closePath(); ctx.fill();
        [[-0.65, 0.35, 0.2], [0.1, 0.75, 0.17], [0.65, 0.4, 0.22], [-0.2, 0.28, 0.12]].forEach(function(p) { fillOval(ctx, spot, cx + p[0] * r, capy - r * p[1], r * p[2], r * p[2] * 0.85); });
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.22)", cx - r * 0.7, capy - r * 0.78, r * 0.2, r * 0.1);
        cheeks(ctx, cx - r * 0.4, cx + r * 0.4, base - s * 0.14, s * 0.03, o);
        mouth(ctx, cx, base - s * 0.13, s * 0.03, o);
        return [{ x: cx - r * 0.22, y: base - s * 0.2, r: s * 0.05 }, { x: cx + r * 0.22, y: base - s * 0.2, r: s * 0.05 }];
    },
    cactus: function(ctx, cx, base, s, b, o) {
        const w = s * 0.36, top = base - s * 0.74, dk = alt(o), flower = mix(o.accent, "#ff7ab0", 0.7), pot = mix(dk, "#c8754a", 0.55);
        fillPoly(ctx, pot, [cx - s * 0.2, base - s * 0.16, cx + s * 0.2, base - s * 0.16, cx + s * 0.15, base - s * 0.01, cx - s * 0.15, base - s * 0.01]);
        ctx.fillStyle = light(pot, 0.15); roundRect(ctx, cx - s * 0.23, base - s * 0.2, s * 0.46, s * 0.06, s * 0.02); ctx.fill();
        ctx.fillStyle = o.body;
        roundRect(ctx, cx - w * 0.5 - s * 0.12, base - s * 0.42, s * 0.22, s * 0.08, s * 0.04); ctx.fill();
        roundRect(ctx, cx - w * 0.5 - s * 0.14, base - s * 0.6, s * 0.09, s * 0.26, s * 0.045); ctx.fill();
        roundRect(ctx, cx + w * 0.5 - s * 0.1, base - s * 0.34, s * 0.22, s * 0.08, s * 0.04); ctx.fill();
        roundRect(ctx, cx + w * 0.5 + s * 0.05, base - s * 0.52, s * 0.09, s * 0.26, s * 0.045); ctx.fill();
        roundRect(ctx, cx - w / 2, top, w, base - s * 0.12 - top, w / 2); ctx.fill();
        if (!o.sil) {
            ctx.strokeStyle = shade(o.bodyS, 0.2); ctx.lineWidth = Math.max(1, s * 0.01);
            [-0.12, 0.12].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * s, top + s * 0.1); ctx.lineTo(cx + k * s, base - s * 0.2); ctx.stroke(); });
            ctx.strokeStyle = o.accent; ctx.lineCap = "round";
            [[-0.17, 0.3], [0.17, 0.4], [-0.17, 0.5], [0.17, 0.2]].forEach(function(p) { ctx.beginPath(); ctx.moveTo(cx + p[0] * s, base - s * p[1] - s * 0.015); ctx.lineTo(cx + p[0] * s * 1.2, base - s * p[1] + s * 0.005); ctx.stroke(); });
        }
        [0, 1, 2, 3, 4].forEach(function(k) { const an = -Math.PI / 2 + k * Math.PI * 2 / 5; fillOval(ctx, flower, cx + Math.cos(an) * s * 0.04, top - s * 0.01 + Math.sin(an) * s * 0.04, s * 0.032, s * 0.032); });
        fillOval(ctx, mix(o.accent, "#ffd34d", 0.7), cx, top - s * 0.01, s * 0.022, s * 0.022);
        cheeks(ctx, cx - s * 0.12, cx + s * 0.12, base - s * 0.37, s * 0.03, o);
        mouth(ctx, cx, base - s * 0.36, s * 0.03, o);
        return [{ x: cx - s * 0.07, y: base - s * 0.46, r: s * 0.05 }, { x: cx + s * 0.07, y: base - s * 0.46, r: s * 0.05 }];
    },
    sprout: function(ctx, cx, base, s, b, o) {
        const g = geo.sprout(cx, base, s, b), r = g.r, cy = g.cy, leaf = mix(o.accent, "#7ed957", 0.7), sw = Math.sin(o.t * 2) * s * 0.015, y = base - s * 0.4;
        ctx.strokeStyle = leaf; ctx.lineWidth = s * 0.03; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx, y); ctx.quadraticCurveTo(cx + sw, y - s * 0.12, cx, y - s * 0.22); ctx.stroke();
        const ty = y - s * 0.22;
        ctx.fillStyle = leaf;
        ctx.beginPath(); ctx.moveTo(cx, ty); ctx.bezierCurveTo(cx - s * 0.08 + sw, ty - s * 0.2, cx - s * 0.3 + sw, ty - s * 0.2, cx - s * 0.36 + sw, ty - s * 0.06); ctx.bezierCurveTo(cx - s * 0.25, ty + s * 0.05, cx - s * 0.08, ty + s * 0.04, cx, ty); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, ty); ctx.bezierCurveTo(cx + s * 0.08 + sw, ty - s * 0.28, cx + s * 0.3 + sw, ty - s * 0.28, cx + s * 0.36 + sw, ty - s * 0.1); ctx.bezierCurveTo(cx + s * 0.25, ty + s * 0.05, cx + s * 0.08, ty + s * 0.04, cx, ty); ctx.closePath(); ctx.fill();
        fillPoly(ctx, o.body, [cx - s * 0.27, y, cx + s * 0.27, y, cx + s * 0.2, base - s * 0.02, cx - s * 0.2, base - s * 0.02]);
        ctx.fillStyle = alt(o); roundRect(ctx, cx - s * 0.3, y - s * 0.04, s * 0.6, s * 0.09, s * 0.03); ctx.fill();
        fillOval(ctx, mix(alt(o), "#5a3a22", 0.5), cx, y - s * 0.035, s * 0.25, s * 0.02);
        cheeks(ctx, cx - r * 0.7, cx + r * 0.7, cy + r * 0.2, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.24, s * 0.035, o);
        return [{ x: cx - r * 0.42, y: cy - r * 0.02, r: s * 0.055 }, { x: cx + r * 0.42, y: cy - r * 0.02, r: s * 0.055 }];
    },
    cloud: function(ctx, cx, base, s, b, o) {
        const g = geo.cloud(cx, base, s, b), r = g.r, cy = g.cy, drop = mix(o.accent, "#8fd0ff", 0.8);
        [-1, 0, 1].forEach(function(k) {
            const off = ((o.t * 0.8 + (k + 1) * 0.33) % 1) * s * 0.1;
            fillPoly(ctx, drop, [cx + k * r * 0.7, cy + r * 0.85 + off, cx + k * r * 0.7 + s * 0.02, cy + r * 1.05 + off, cx + k * r * 0.7 - s * 0.02, cy + r * 1.05 + off]);
            fillOval(ctx, drop, cx + k * r * 0.7, cy + r * 1.07 + off, s * 0.02, s * 0.02);
        });
        fillOval(ctx, o.body, cx - r * 0.95, cy + r * 0.2, r * 0.6, r * 0.5);
        fillOval(ctx, o.body, cx + r * 0.95, cy + r * 0.2, r * 0.65, r * 0.5);
        fillOval(ctx, o.body, cx - r * 0.4, cy - r * 0.28, r * 0.68, r * 0.62);
        fillOval(ctx, o.body, cx + r * 0.4, cy - r * 0.12, r * 0.62, r * 0.55);
        fillOval(ctx, o.body, cx, cy + r * 0.3, r * 1.45, r * 0.55);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.3)", cx - r * 0.55, cy - r * 0.55, r * 0.2, r * 0.12);
        cheeks(ctx, cx - r * 0.85, cx + r * 0.85, cy + r * 0.3, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.38, s * 0.04, o);
        return [{ x: cx - r * 0.5, y: cy, r: s * 0.06 }, { x: cx + r * 0.5, y: cy, r: s * 0.06 }];
    },
    sun: function(ctx, cx, base, s, b, o) {
        const g = geo.sun(cx, base, s, b), r = g.r, cy = g.cy, ray = mix(o.bodyS, o.accent, 0.5), rot = o.t * 0.4;
        tufts(ctx, ray, cx, cy, r * 1.02, r * 1.02, 12, r * 0.5, rot, rot + Math.PI * 2);
        fillOval(ctx, o.body, cx, cy, r, r);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.28)", cx - r * 0.42, cy - r * 0.6, r * 0.25, r * 0.13);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.3, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.38, s * 0.045, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.05, r: s * 0.06 }, { x: cx + r * 0.4, y: cy - r * 0.05, r: s * 0.06 }];
    },
    moon: function(ctx, cx, base, s, b, o) {
        const g = geo.moon(cx, base, s, b), R = g.r, cy = g.cy, c1 = cx - R * 0.12, d = R * 0.5, r2 = R * 0.72;
        const a = (R * R - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, R * R - a * a));
        ctx.fillStyle = o.body; ctx.beginPath();
        ctx.arc(c1, cy, R, Math.atan2(-h, a), Math.atan2(h, a), true);
        ctx.arc(c1 + d, cy, r2, Math.atan2(h, a - d), Math.atan2(-h, a - d), false);
        ctx.closePath(); ctx.fill();
        if (!o.sil) {
            ctx.fillStyle = o.accent; star(ctx, c1 + R * 0.72, cy - R * 0.3, s * 0.05 * (0.8 + 0.2 * Math.sin(o.t * 4)));
            spark(ctx, c1 + R * 0.4, cy + R * 0.5, s * 0.03);
        }
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", c1 - R * 0.62, cy - R * 0.62, R * 0.12, R * 0.07);
        cheeks(ctx, c1 - R * 0.8, c1 - R * 0.4, cy + R * 0.32, s * 0.03, o);
        mouth(ctx, c1 - R * 0.6, cy + R * 0.36, s * 0.03, o);
        return [{ x: c1 - R * 0.74, y: cy - R * 0.05, r: s * 0.045 }, { x: c1 - R * 0.46, y: cy - R * 0.05, r: s * 0.045 }];
    },
    snowman: function(ctx, cx, base, s, b, o) {
        const g = geo.snowman(cx, base, s, b), r = g.r, cy = g.cy, r2 = s * 0.27, by = base - r2, stick = mix(alt(o), "#8a5a3a", 0.6), carrot = mix(o.accent, "#ff9a3c", 0.8), coal = ink(o);
        ctx.strokeStyle = stick; ctx.lineWidth = Math.max(1.2, s * 0.02); ctx.lineCap = "round";
        [-1, 1].forEach(function(d) {
            ctx.beginPath(); ctx.moveTo(cx + d * r2 * 0.85, by - r2 * 0.1); ctx.lineTo(cx + d * r2 * 1.65, by - r2 * 0.55); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + d * r2 * 1.35, by - r2 * 0.37); ctx.lineTo(cx + d * r2 * 1.5, by - r2 * 0.12); ctx.stroke();
        });
        fillOval(ctx, o.body, cx, by, r2, r2);
        fillOval(ctx, o.body, cx, cy, r, r);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.35)", cx - r * 0.5, cy - r * 0.55, r * 0.2, r * 0.1);
        [0, 1, 2].forEach(function(k) { fillOval(ctx, coal, cx, by - r2 * 0.35 + k * r2 * 0.4, s * 0.016, s * 0.016); });
        fillOval(ctx, o.accent, cx, cy + r * 1.0, r * 0.85, r * 0.2);
        fillPoly(ctx, o.accent, [cx + r * 0.3, cy + r * 1.05, cx + r * 0.7, cy + r * 1.05, cx + r * 0.75, cy + r * 1.75, cx + r * 0.4, cy + r * 1.7]);
        fillPoly(ctx, carrot, [cx, cy + r * 0.2, cx + r * 0.75, cy + r * 0.3, cx, cy + r * 0.42]);
        cheeks(ctx, cx - r * 0.7, cx + r * 0.7, cy + r * 0.45, s * 0.03, o);
        mouth(ctx, cx, cy + r * 0.6, s * 0.03, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.1, r: s * 0.045 }, { x: cx + r * 0.4, y: cy - r * 0.1, r: s * 0.045 }];
    },
    // ---- retro and pixel
    invader: function(ctx, cx, base, s, b, o) {
        const g = geo.invader(cx, base, s, b), u = g.r, top = g.cy, x0 = cx - u * 5.5, dk = alt(o), hole = ink(o);
        const f = Math.floor(o.t * 2) % 2 === 0 ? [
            "..X.....X..", "...X...X...", "..XXXXXXX..", ".XXeXXXeXX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."
        ] : [
            "..X.....X..", "X..X...X..X", "X.XXXXXXX.X", "XXXeXXXeXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..X.....X..", ".X.......X."
        ];
        sprite(ctx, f, x0, top, u, function(ch, i, j) { return ch === "e" ? hole : (j >= 6 ? dk : o.body); });
        if (!o.sil) fillRect(ctx, o.accent, x0 + u * 4, top + u * 2, u * 3, u * 0.4);
        mouth(ctx, cx, top + u * 5.5, u * 0.9, o);
        return [{ x: cx - u * 2, y: top + u * 3.5, r: u * 0.55, square: true }, { x: cx + u * 2, y: top + u * 3.5, r: u * 0.55, square: true }];
    },
    chomper: function(ctx, cx, base, s, b, o) {
        const g = geo.chomper(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), pel = mix(o.accent, "#ffe38a", 0.7), ivory = mix(o.accent, "#ffffff", 0.9);
        const open = o.busy ? 1 : 0.5 + 0.5 * Math.sin(o.t * 5), mh = r * (0.1 + open * 0.28), my = cy + r * 0.38;
        [0, 1, 2].forEach(function(k) { fillRect(ctx, pel, cx + r * 1.15 + k * s * 0.045 - s * 0.01, base - s * 0.07, s * 0.022, s * 0.022); });
        [-1, 1].forEach(function(d) { fillOval(ctx, dk, cx + d * r * 0.45, base - s * 0.03, r * 0.3, s * 0.03); });
        fillOval(ctx, o.body, cx, cy, r, r);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", cx - r * 0.5, cy - r * 0.62, r * 0.2, r * 0.12);
        if (!o.sil) {
            if (o.mouthStyle === "none") { ctx.strokeStyle = o.eye; ctx.lineWidth = Math.max(1, s * 0.015); ctx.beginPath(); ctx.moveTo(cx - r * 0.5, my); ctx.lineTo(cx + r * 0.5, my); ctx.stroke(); }
            else {
                fillOval(ctx, ink(o), cx, my, r * 0.62, mh);
                [-2, -1, 0, 1, 2].forEach(function(k) { fillRect(ctx, ivory, cx + k * r * 0.22 - r * 0.07, my - mh, r * 0.14, Math.min(mh * 0.8, r * 0.14)); });
                [-1.5, -0.5, 0.5, 1.5].forEach(function(k) { fillRect(ctx, ivory, cx + k * r * 0.22 - r * 0.07, my + mh - Math.min(mh * 0.8, r * 0.14), r * 0.14, Math.min(mh * 0.8, r * 0.14)); });
            }
        }
        cheeks(ctx, cx - r * 0.7, cx + r * 0.7, cy + r * 0.1, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.3, r: s * 0.06 }, { x: cx + r * 0.4, y: cy - r * 0.3, r: s * 0.06 }];
    },
    pixelheart: function(ctx, cx, base, s, b, o) {
        const g = geo.pixelheart(cx, base, s, b), u = g.r, top = g.cy, x0 = cx - u * 5.5, edge = shade(o.bodyS, 0.4), hi = light(o.bodyS, 0.5);
        const rows = ["..XXX.XXX..", ".XXXXXXXXX.", "XXXXXXXXXXX", "XXXXXXXXXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..XXXXXXX..", "...XXXXX...", "....XXX....", ".....X....."];
        const on = function(i, j) { return j >= 0 && j < rows.length && i >= 0 && i < rows[j].length && rows[j][i] !== "."; };
        sprite(ctx, rows, x0, top, u, function(ch, i, j) {
            if (!on(i - 1, j) || !on(i + 1, j) || !on(i, j - 1) || !on(i, j + 1)) return edge;
            if (j <= 2 && i <= 3) return hi;
            return o.body;
        });
        cheeks(ctx, cx - u * 3, cx + u * 3, top + u * 5, u * 0.9, o);
        mouth(ctx, cx, top + u * 5.2, u * 0.9, o);
        return [{ x: cx - u * 2, y: top + u * 3.5, r: u * 0.6, square: true }, { x: cx + u * 2, y: top + u * 3.5, r: u * 0.6, square: true }];
    },
    cartridge: function(ctx, cx, base, s, b, o) {
        const g = geo.cartridge(cx, base, s, b), r = g.r, cy = g.cy, x0 = cx - s * 0.31, y0 = base - s * 0.8, w = s * 0.62, h = s * 0.78, dk = alt(o);
        const label = mix(o.accent, "#ffffff", 0.75), pin = mix(o.accent, "#f2c94c", 0.7);
        fillPoly(ctx, o.body, [x0, y0 + s * 0.08, x0 + s * 0.08, y0, x0 + w, y0, x0 + w, y0 + h - s * 0.1, x0 + w - s * 0.04, y0 + h, x0 + s * 0.04, y0 + h, x0, y0 + h - s * 0.1]);
        fillRect(ctx, dk, x0 + s * 0.06, base - s * 0.1, w - s * 0.12, s * 0.085);
        for (let i = 0; i < 8; i++) fillRect(ctx, pin, x0 + s * 0.09 + i * (w - s * 0.18) / 8, base - s * 0.085, (w - s * 0.18) / 8 * 0.55, s * 0.065);
        if (!o.sil) {
            ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [0.06, 0.1, 0.14].forEach(function(k) { ctx.beginPath(); ctx.moveTo(x0 + s * 0.12, y0 + s * k); ctx.lineTo(x0 + w - s * 0.1, y0 + s * k); ctx.stroke(); });
        }
        ctx.fillStyle = label; roundRect(ctx, x0 + s * 0.06, y0 + s * 0.2, w - s * 0.12, s * 0.4, s * 0.03); ctx.fill();
        if (!o.sil) { fillRect(ctx, o.accent, x0 + s * 0.06, y0 + s * 0.2, w - s * 0.12, s * 0.045); }
        cheeks(ctx, cx - s * 0.17, cx + s * 0.17, cy + s * 0.07, s * 0.03, o);
        mouth(ctx, cx, cy + s * 0.09, s * 0.035, o);
        return [{ x: cx - r * 0.34, y: cy, r: s * 0.05 }, { x: cx + r * 0.34, y: cy, r: s * 0.05 }];
    },
    joystick: function(ctx, cx, base, s, b, o) {
        const g = geo.joystick(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), metal = mix(light(o.accent, 0.1), "#8f9bab", 0.55);
        fillRect(ctx, metal, cx - s * 0.03, cy + r * 0.8, s * 0.06, base - s * 0.2 - (cy + r * 0.8));
        ctx.fillStyle = dk; roundRect(ctx, cx - s * 0.42, base - s * 0.2, s * 0.84, s * 0.18, s * 0.05); ctx.fill();
        fillOval(ctx, shade(dk, 0.3), cx, base - s * 0.2, s * 0.11, s * 0.028);
        fillOval(ctx, o.accent, cx + s * 0.22, base - s * 0.1, s * 0.04, s * 0.04);
        fillOval(ctx, mix(o.accent, "#ffd34d", 0.6), cx + s * 0.32, base - s * 0.12, s * 0.04, s * 0.04);
        fillOval(ctx, mix(o.accent, "#e23b3b", 0.6), cx - s * 0.27, base - s * 0.1, s * 0.035, s * 0.035);
        fillOval(ctx, o.body, cx, cy, r, r);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.3)", cx - r * 0.45, cy - r * 0.62, r * 0.22, r * 0.12);
        cheeks(ctx, cx - r * 0.66, cx + r * 0.66, cy + r * 0.3, s * 0.03, o);
        mouth(ctx, cx, cy + r * 0.42, s * 0.035, o);
        return [{ x: cx - r * 0.38, y: cy - r * 0.05, r: s * 0.05 }, { x: cx + r * 0.38, y: cy - r * 0.05, r: s * 0.05 }];
    },
    cassette: function(ctx, cx, base, s, b, o) {
        const g = geo.cassette(cx, base, s, b), r = g.r, cy = g.cy, y0 = base - s * 0.62, dk = alt(o), label = mix(o.accent, "#ffffff", 0.75), win = ink(o), spin = o.t * 3;
        ctx.fillStyle = o.body; roundRect(ctx, cx - s * 0.4, y0, s * 0.8, s * 0.54, s * 0.04); ctx.fill();
        ctx.fillStyle = label; roundRect(ctx, cx - s * 0.34, y0 + s * 0.04, s * 0.68, s * 0.2, s * 0.02); ctx.fill();
        if (!o.sil) {
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(cx - s * 0.28, y0 + s * 0.1); ctx.lineTo(cx + s * 0.2, y0 + s * 0.1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - s * 0.28, y0 + s * 0.16); ctx.lineTo(cx + s * 0.1, y0 + s * 0.16); ctx.stroke();
        }
        ctx.fillStyle = win; roundRect(ctx, cx - s * 0.3, y0 + s * 0.27, s * 0.6, s * 0.2, s * 0.04); ctx.fill();
        [-1, 1].forEach(function(d) {
            fillOval(ctx, light(o.accent, 0.4), cx + d * s * 0.15, cy, s * 0.085, s * 0.085);
            if (!o.sil) {
                ctx.strokeStyle = win; ctx.lineWidth = Math.max(1, s * 0.012);
                [0, 1, 2].forEach(function(k) { const a = spin * d + k * Math.PI * 2 / 3; ctx.beginPath(); ctx.moveTo(cx + d * s * 0.15, cy); ctx.lineTo(cx + d * s * 0.15 + Math.cos(a) * s * 0.08, cy + Math.sin(a) * s * 0.08); ctx.stroke(); });
            }
        });
        fillPoly(ctx, dk, [cx - s * 0.27, base - s * 0.08, cx - s * 0.19, base - s * 0.2, cx + s * 0.19, base - s * 0.2, cx + s * 0.27, base - s * 0.08]);
        [-1, 1].forEach(function(d) { fillOval(ctx, win, cx + d * s * 0.2, base - s * 0.115, s * 0.014, s * 0.014); });
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(p) { fillOval(ctx, dk, cx + p[0] * s * 0.36, y0 + (p[1] < 0 ? s * 0.03 : s * 0.51), s * 0.01, s * 0.01); });
        mouth(ctx, cx, base - s * 0.11, s * 0.03, Object.assign({}, o, { eye: light(dk, 0.8) }));
        return [{ x: cx - s * 0.15, y: cy, r: s * 0.05 }, { x: cx + s * 0.15, y: cy, r: s * 0.05 }];
    },

    // ---- dev and desk
    duck: function(ctx, cx, base, s, b, o) {
        const g = geo.duck(cx, base, s, b), r = g.r, cy = g.cy, beak = mix(o.accent, "#ff9a3c", 0.8), wing = shade(o.bodyS, 0.15);
        fillPoly(ctx, o.body, [cx + s * 0.3, base - s * 0.34, cx + s * 0.5, base - s * 0.5, cx + s * 0.44, base - s * 0.2]);
        fillOval(ctx, o.body, cx, base - s * 0.24, s * 0.4 * (1 + b), s * 0.24 * (1 - b));
        [-1, 1].forEach(function(d) { fillOval(ctx, wing, cx + d * s * 0.27, base - s * 0.26, s * 0.12, s * 0.16); });
        if (!o.sil) { fillOval(ctx, light(o.accent, 0.5), cx - s * 0.38, base - s * 0.03, s * 0.02, s * 0.02); fillOval(ctx, light(o.accent, 0.5), cx + s * 0.38, base - s * 0.05, s * 0.015, s * 0.015); }
        fillOval(ctx, o.body, cx, cy, r, r * 0.95);
        fillPoly(ctx, o.body, [cx - r * 0.15, cy - r * 0.85, cx + r * 0.15, cy - r * 0.85, cx + r * 0.02, cy - r * 1.3]);
        fillOval(ctx, beak, cx, cy + r * 0.32, r * 0.62, r * 0.3);
        cheeks(ctx, cx - r * 0.75, cx + r * 0.75, cy + r * 0.25, s * 0.03, o);
        mouth(ctx, cx, cy + r * 0.45, s * 0.03, o);
        return [{ x: cx - r * 0.45, y: cy - r * 0.12, r: s * 0.05 }, { x: cx + r * 0.45, y: cy - r * 0.12, r: s * 0.05 }];
    },
    coffee: function(ctx, cx, base, s, b, o) {
        const g = geo.coffee(cx, base, s, b), r = g.r, cy = g.cy, rim = base - s * 0.58, saucer = light(o.accent, 0.4), brew = mix(alt(o), "#5a3a22", 0.6), st = o.t * 3;
        if (!o.sil) {
            ctx.strokeStyle = light(o.accent, 0.4); ctx.lineWidth = Math.max(1, s * 0.016); ctx.lineCap = "round";
            [-0.12, 0, 0.12].forEach(function(k, i) { ctx.beginPath(); ctx.moveTo(cx + k * s, rim - s * 0.05); ctx.bezierCurveTo(cx + k * s + s * 0.04 * Math.sin(st + i), rim - s * 0.1, cx + k * s - s * 0.04 * Math.sin(st + i), rim - s * 0.16, cx + k * s, rim - s * 0.22); ctx.stroke(); });
        }
        fillOval(ctx, saucer, cx, base - s * 0.06, s * 0.46, s * 0.06);
        ctx.strokeStyle = o.body; ctx.lineWidth = s * 0.06; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(cx + s * 0.3, base - s * 0.32, s * 0.12, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.fillStyle = o.body; roundRect(ctx, cx - s * 0.3, rim, s * 0.6, s * 0.5, s * 0.08); ctx.fill();
        fillOval(ctx, light(o.bodyS, 0.3), cx, rim, s * 0.3, s * 0.055);
        fillOval(ctx, brew, cx, rim + s * 0.005, s * 0.26, s * 0.04);
        if (!o.sil) { ctx.fillStyle = mix(brew, "#ffffff", 0.45); heart(ctx, cx, rim, s * 0.022); }
        cheeks(ctx, cx - s * 0.2, cx + s * 0.2, cy + s * 0.06, s * 0.035, o);
        mouth(ctx, cx, cy + s * 0.06, s * 0.035, o);
        return [{ x: cx - s * 0.12, y: cy - s * 0.02, r: s * 0.055 }, { x: cx + s * 0.12, y: cy - s * 0.02, r: s * 0.055 }];
    },
    bulb: function(ctx, cx, base, s, b, o) {
        const g = geo.bulb(cx, base, s, b), r = g.r, cy = g.cy, metal = mix(light(o.accent, 0.1), "#8f9bab", 0.55), pulse = 0.85 + 0.15 * Math.sin(o.t * 4);
        if (!o.sil) {
            ctx.strokeStyle = light(o.accent, 0.35); ctx.lineWidth = Math.max(1, s * 0.016); ctx.lineCap = "round";
            [-0.9, -0.5, -0.1, 0.5 + 0.0].forEach(function() {});
            for (let k = 0; k < 7; k++) {
                const an = Math.PI * (1.08 + k * 0.14);
                ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r * 1.18, cy + Math.sin(an) * r * 1.18); ctx.lineTo(cx + Math.cos(an) * r * (1.18 + 0.2 * pulse), cy + Math.sin(an) * r * (1.18 + 0.2 * pulse)); ctx.stroke();
            }
        }
        fillPoly(ctx, o.body, [cx - r * 0.62, cy + r * 0.7, cx + r * 0.62, cy + r * 0.7, cx + r * 0.42, cy + r * 1.45, cx - r * 0.42, cy + r * 1.45]);
        fillOval(ctx, o.body, cx, cy, r, r);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.3)", cx - r * 0.55, cy - r * 0.55, r * 0.18, r * 0.1);
        [0, 1, 2].forEach(function(k) {
            ctx.fillStyle = k % 2 ? shade(metal, 0.2) : metal; roundRect(ctx, cx - r * 0.45 + k * r * 0.02, base - s * 0.17 + k * s * 0.05, r * 0.9 - k * r * 0.04, s * 0.045, s * 0.015); ctx.fill();
        });
        if (!o.sil) {
            ctx.strokeStyle = light(o.accent, 0.5); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineJoin = "round";
            ctx.beginPath(); ctx.moveTo(cx - r * 0.22, cy + r * 1.3); ctx.lineTo(cx - r * 0.22, cy + r * 0.7); ctx.lineTo(cx - r * 0.11, cy + r * 0.78); ctx.lineTo(cx, cy + r * 0.66); ctx.lineTo(cx + r * 0.11, cy + r * 0.78); ctx.lineTo(cx + r * 0.22, cy + r * 0.7); ctx.lineTo(cx + r * 0.22, cy + r * 1.3); ctx.stroke();
        }
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.3, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.38, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.05, r: s * 0.055 }, { x: cx + r * 0.4, y: cy - r * 0.05, r: s * 0.055 }];
    },
    bug: function(ctx, cx, base, s, b, o) {
        const g = geo.bug(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), sy = base - s * 0.3, wig = o.t * 10;
        ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1.2, s * 0.025); ctx.lineCap = "round";
        [-1, 1].forEach(function(d) {
            [-0.5, 0, 0.5].forEach(function(k, i) {
                const sw = Math.sin(wig + i * 2 + (d > 0 ? 1 : 0)) * s * 0.012;
                ctx.beginPath(); ctx.moveTo(cx + d * s * 0.28, sy + k * s * 0.3); ctx.lineTo(cx + d * s * 0.42, sy + k * s * 0.34 + sw); ctx.lineTo(cx + d * s * 0.46, sy + k * s * 0.34 + s * 0.06 + sw); ctx.stroke();
            });
            ctx.beginPath(); ctx.moveTo(cx + d * r * 0.4, cy - r * 0.7); ctx.quadraticCurveTo(cx + d * r * 0.7, cy - r * 1.4, cx + d * r * 1.2, cy - r * 1.35); ctx.stroke();
            fillOval(ctx, dk, cx + d * r * 1.2, cy - r * 1.35, s * 0.018, s * 0.018);
        });
        fillOval(ctx, o.body, cx, sy, s * 0.33, s * 0.3);
        if (!o.sil) {
            ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.015);
            ctx.beginPath(); ctx.moveTo(cx, sy - s * 0.2); ctx.lineTo(cx, sy + s * 0.3); ctx.stroke();
            [[-0.17, -0.02], [0.17, -0.02], [-0.19, 0.17], [0.19, 0.17], [-0.08, 0.26], [0.08, 0.26]].forEach(function(p) { fillOval(ctx, ink(o), cx + p[0] * s, sy + p[1] * s, s * 0.035, s * 0.035); });
        }
        fillOval(ctx, dk, cx, cy, r, r * 0.9);
        mouth(ctx, cx, cy + r * 0.5, s * 0.03, Object.assign({}, o, { eye: light(dk, 0.8) }));
        return [{ x: cx - r * 0.42, y: cy - r * 0.05, r: s * 0.05 }, { x: cx + r * 0.42, y: cy - r * 0.05, r: s * 0.05 }];
    },
    terminal: function(ctx, cx, base, s, b, o) {
        const g = geo.terminal(cx, base, s, b), cy = g.cy, x = cx - s * 0.39, y = base - s * 0.66, w = s * 0.78, h = s * 0.62, scr = ink(o);
        ctx.fillStyle = o.body; roundRect(ctx, x, y, w, h, s * 0.06); ctx.fill();
        [mix(o.accent, "#ff6b6b", 0.7), mix(o.accent, "#ffd34d", 0.7), mix(o.accent, "#5fd35f", 0.7)].forEach(function(c, i) { fillOval(ctx, c, x + s * 0.07 + i * s * 0.06, y + s * 0.05, s * 0.016, s * 0.016); });
        ctx.fillStyle = scr; roundRect(ctx, x + s * 0.03, y + s * 0.1, w - s * 0.06, h - s * 0.13, s * 0.03); ctx.fill();
        if (!o.sil) {
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.016); ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.beginPath(); ctx.moveTo(x + s * 0.08, y + s * 0.16); ctx.lineTo(x + s * 0.12, y + s * 0.19); ctx.lineTo(x + s * 0.08, y + s * 0.22); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + s * 0.15, y + s * 0.22); ctx.lineTo(x + s * 0.22, y + s * 0.22); ctx.stroke();
            if (Math.floor(o.t * 2) % 2 === 0) fillRect(ctx, o.accent, x + s * 0.08, y + h - s * 0.1, s * 0.04, s * 0.04);
        }
        mouth(ctx, cx, cy + s * 0.1, s * 0.035, Object.assign({}, o, { eye: o.accent }));
        return [{ x: cx - s * 0.12, y: cy, r: s * 0.05 }, { x: cx + s * 0.12, y: cy, r: s * 0.05 }];
    },
    floppy: function(ctx, cx, base, s, b, o) {
        const g = geo.floppy(cx, base, s, b), cy = g.cy, x0 = cx - s * 0.37, y0 = base - s * 0.78, w = s * 0.74, h = s * 0.74, metal = mix(light(o.accent, 0.1), "#8f9bab", 0.55), label = mix(o.accent, "#ffffff", 0.8);
        fillPoly(ctx, o.body, [x0, y0, x0 + w - s * 0.1, y0, x0 + w, y0 + s * 0.1, x0 + w, y0 + h, x0, y0 + h]);
        fillRect(ctx, metal, x0 + s * 0.16, y0, s * 0.4, s * 0.24);
        fillRect(ctx, ink(o), x0 + s * 0.42, y0 + s * 0.04, s * 0.09, s * 0.16);
        ctx.fillStyle = label; roundRect(ctx, x0 + s * 0.08, y0 + s * 0.36, w - s * 0.16, s * 0.34, s * 0.02); ctx.fill();
        if (!o.sil) {
            ctx.strokeStyle = o.accent; ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x0 + s * 0.12, y0 + s * 0.4); ctx.lineTo(x0 + s * 0.5, y0 + s * 0.4); ctx.stroke();
            fillRect(ctx, ink(o), x0 + w - s * 0.09, y0 + h - s * 0.06, s * 0.04, s * 0.04);
        }
        cheeks(ctx, cx - s * 0.17, cx + s * 0.17, cy + s * 0.05, s * 0.03, o);
        mouth(ctx, cx, cy + s * 0.07, s * 0.035, o);
        return [{ x: cx - s * 0.13, y: cy - s * 0.02, r: s * 0.05 }, { x: cx + s * 0.13, y: cy - s * 0.02, r: s * 0.05 }];
    },
    keycat: function(ctx, cx, base, s, b, o) {
        const g = geo.keycat(cx, base, s, b), r = g.r, cy = g.cy, dk = alt(o), key = mix(o.accent, "#ffffff", 0.7), press = Math.abs(Math.sin(o.t * 8)) * s * 0.02, press2 = Math.abs(Math.sin(o.t * 8 + 1.6)) * s * 0.02;
        ctx.fillStyle = dk; roundRect(ctx, cx - s * 0.45, base - s * 0.24, s * 0.9, s * 0.22, s * 0.03); ctx.fill();
        for (let i = 0; i < 8; i++) fillRect(ctx, i === 3 ? o.accent : key, cx - s * 0.41 + i * s * 0.103, base - s * 0.22, s * 0.085, s * 0.06);
        for (let j = 0; j < 7; j++) fillRect(ctx, j === 5 ? o.accent : key, cx - s * 0.36 + j * s * 0.103, base - s * 0.15, s * 0.085, s * 0.06);
        fillRect(ctx, key, cx - s * 0.25, base - s * 0.08, s * 0.5, s * 0.05);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, o.body, [cx + d * r * 0.85, cy - r * 0.3, cx + d * r * 0.78, cy - r * 1.35, cx + d * r * 0.15, cy - r * 0.88]);
            fillPoly(ctx, o.accent, [cx + d * r * 0.7, cy - r * 0.5, cx + d * r * 0.68, cy - r * 1.05, cx + d * r * 0.3, cy - r * 0.8]);
        });
        fillOval(ctx, o.body, cx, cy, r, r * 0.9);
        [-1, 1].forEach(function(d) { fillOval(ctx, o.body, cx + d * s * 0.2, base - s * 0.23 + (d < 0 ? press : press2), s * 0.07, s * 0.045); });
        if (!o.sil) {
            ctx.strokeStyle = shade(o.bodyS, 0.25); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [-0.12, 0, 0.12].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * s, cy - r * 0.85); ctx.lineTo(cx + k * s * 0.9, cy - r * 0.5); ctx.stroke(); });
        }
        fillPoly(ctx, o.accent, [cx - s * 0.025, cy + r * 0.12, cx + s * 0.025, cy + r * 0.12, cx, cy + r * 0.2]);
        cheeks(ctx, cx - r * 0.65, cx + r * 0.65, cy + r * 0.25, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.38, s * 0.04, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.05, r: s * 0.055 }, { x: cx + r * 0.4, y: cy - r * 0.05, r: s * 0.055 }];
    },
    paperclip: function(ctx, cx, base, s, b, o) {
        const k = 1 + b, lw = s * 0.07, xa = cx - s * 0.2 * k, xb = cx - s * 0.07 * k, xc = cx + s * 0.07 * k, xd = cx + s * 0.2 * k;
        const yTop = base - s * 0.54, yBot = base - s * 0.195, yIn = base - s * 0.5, pane = light(o.accent, 0.55);
        // the wire: up the inside, over a small loop, down, under the bottom, up the outside, over the big loop, down
        function trace() {
            ctx.beginPath();
            ctx.moveTo(xc, base - s * 0.3);
            ctx.lineTo(xc, yIn);
            ctx.arc(cx, yIn, xc - cx, 0, Math.PI, true);
            ctx.lineTo(xb, yBot);
            ctx.arc((xb + xd) / 2, yBot, (xd - xb) / 2, Math.PI, 0, true);
            ctx.lineTo(xd, yTop);
            ctx.arc(cx, yTop, xd - cx, 0, Math.PI, true);
            ctx.lineTo(xa, base - s * 0.2);
        }
        // a pane inside the big loop, so the face has something to sit on
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = pane; ctx.beginPath();
        ctx.moveTo(xa, base - s * 0.3); ctx.lineTo(xa, yTop); ctx.arc(cx, yTop, xd - cx, Math.PI, 0, false); ctx.lineTo(xd, base - s * 0.3); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = o.body; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
        trace(); ctx.stroke();
        if (!o.sil && o.shine !== false) {
            ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = lw * 0.28;
            trace(); ctx.stroke();
        }
        cheeks(ctx, cx - s * 0.13, cx + s * 0.13, base - s * 0.45, s * 0.03, o);
        mouth(ctx, cx, base - s * 0.42, s * 0.03, o);
        return [{ x: cx - s * 0.105 * k, y: base - s * 0.6, r: s * 0.065 }, { x: cx + s * 0.105 * k, y: base - s * 0.6, r: s * 0.065 }];
    },
    pencil: function(ctx, cx, base, s, b, o) {
        const w = s * 0.38 * (1 + b), x0 = cx - w / 2, yb0 = base - s * 0.6, yb1 = base - s * 0.18, yt = base - s * 0.84;
        const wood = mix(o.accent, "#f1c98e", 0.75), lead = ink(o), eraser = mix(o.accent, "#ff8fa3", 0.7), metal = mix(light(o.accent, 0.1), "#8f9bab", 0.55);
        fillPoly(ctx, wood, [x0, yb0, x0 + w, yb0, cx + w * 0.16, yt + s * 0.11, cx - w * 0.16, yt + s * 0.11]);
        fillPoly(ctx, lead, [cx - w * 0.16, yt + s * 0.11, cx + w * 0.16, yt + s * 0.11, cx, yt]);
        ctx.fillStyle = eraser; roundRect(ctx, x0, yb1 + s * 0.07, w, base - yb1 - s * 0.07, s * 0.04); ctx.fill();
        ctx.fillStyle = o.body; roundRect(ctx, x0, yb0, w, yb1 - yb0 + s * 0.02, s * 0.025); ctx.fill();
        ctx.fillStyle = metal; roundRect(ctx, x0 - s * 0.012, yb1, w + s * 0.024, s * 0.075, s * 0.015); ctx.fill();
        if (!o.sil) {
            ctx.strokeStyle = shade(o.bodyS, 0.22); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [-0.3, 0.3].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * w, yb0 + s * 0.02); ctx.lineTo(cx + k * w, yb1 - s * 0.01); ctx.stroke(); });
            ctx.strokeStyle = shade(wood, 0.25);
            ctx.beginPath(); ctx.moveTo(cx - w * 0.3, yb0 - s * 0.05); ctx.lineTo(cx - w * 0.12, yt + s * 0.13); ctx.moveTo(cx + w * 0.3, yb0 - s * 0.05); ctx.lineTo(cx + w * 0.12, yt + s * 0.13); ctx.stroke();
        }
        cheeks(ctx, cx - w * 0.3, cx + w * 0.3, base - s * 0.37, s * 0.03, o);
        mouth(ctx, cx, base - s * 0.34, s * 0.032, o);
        return [{ x: cx - s * 0.09, y: base - s * 0.47, r: s * 0.055 }, { x: cx + s * 0.09, y: base - s * 0.47, r: s * 0.055 }];
    },
    sticky: function(ctx, cx, base, s, b, o) {
        const w = s * 0.7 * (1 + b), h = s * 0.68 * (1 - b * 0.5), x0 = cx - w / 2, y0 = base - h - s * 0.04, fold = s * 0.17, tape = mix(o.accent, "#ffffff", 0.55);
        fillPoly(ctx, o.body, [x0, y0, x0 + w, y0, x0 + w, y0 + h - fold, x0 + w - fold, y0 + h, x0, y0 + h]);
        fillPoly(ctx, alt(o), [x0 + w, y0 + h - fold, x0 + w - fold, y0 + h, x0 + w - fold, y0 + h - fold]);
        ctx.globalAlpha = 0.85; fillPoly(ctx, tape, [cx - s * 0.11, y0 - s * 0.035, cx + s * 0.11, y0 - s * 0.035, cx + s * 0.11, y0 + s * 0.035, cx - s * 0.11, y0 + s * 0.035]); ctx.globalAlpha = 1;
        if (!o.sil) {
            ctx.strokeStyle = shade(o.bodyS, 0.2); ctx.lineWidth = Math.max(1, s * 0.014); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x0 + w * 0.16, y0 + h * 0.82); ctx.lineTo(x0 + w * 0.5, y0 + h * 0.82); ctx.moveTo(x0 + w * 0.16, y0 + h * 0.9); ctx.lineTo(x0 + w * 0.36, y0 + h * 0.9); ctx.stroke();
        }
        cheeks(ctx, cx - w * 0.3, cx + w * 0.3, y0 + h * 0.52, s * 0.04, o);
        mouth(ctx, cx, y0 + h * 0.58, s * 0.04, o);
        return [{ x: cx - w * 0.2, y: y0 + h * 0.38, r: s * 0.06 }, { x: cx + w * 0.2, y: y0 + h * 0.38, r: s * 0.06 }];
    },
    rocket: function(ctx, cx, base, s, b, o) {
        const hw = s * 0.27 * (1 + b), top = base - s * 0.84, bot = base - s * 0.2, dk = alt(o), flame = mix(o.accent, "#ffb347", 0.8), core = mix(o.accent, "#fff3b0", 0.85);
        const fl = s * (0.15 + 0.035 * Math.sin(o.t * 14) + 0.02 * Math.sin(o.t * 23));
        fillPoly(ctx, flame, [cx - hw * 0.45, bot - s * 0.01, cx + hw * 0.45, bot - s * 0.01, cx, bot + fl]);
        fillPoly(ctx, core, [cx - hw * 0.22, bot - s * 0.01, cx + hw * 0.22, bot - s * 0.01, cx, bot + fl * 0.6]);
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, dk, [cx + d * hw * 0.7, bot - s * 0.3, cx + d * hw * 1.55, bot + s * 0.04, cx + d * hw * 0.95, bot - s * 0.02]);
        });
        ctx.fillStyle = o.body; ctx.beginPath(); ctx.moveTo(cx, top);
        ctx.bezierCurveTo(cx + hw * 1.3, top + s * 0.18, cx + hw * 1.05, bot - s * 0.15, cx + hw * 0.9, bot);
        ctx.lineTo(cx - hw * 0.9, bot);
        ctx.bezierCurveTo(cx - hw * 1.05, bot - s * 0.15, cx - hw * 1.3, top + s * 0.18, cx, top);
        ctx.closePath(); ctx.fill();
        fillRect(ctx, dk, cx - hw * 0.92, bot - s * 0.05, hw * 1.84, s * 0.05);
        const wy = base - s * 0.5, wr = hw * 0.78;
        fillOval(ctx, light(o.accent, 0.55), cx, wy, wr * 1.14, wr * 1.14);
        fillOval(ctx, mix(o.accent, "#aee8ff", 0.55), cx, wy, wr, wr);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.35)", cx - wr * 0.5, wy - wr * 0.6, wr * 0.2, wr * 0.1);
        mouth(ctx, cx, wy + wr * 0.42, s * 0.03, o);
        return [{ x: cx - wr * 0.42, y: wy - wr * 0.1, r: s * 0.05 }, { x: cx + wr * 0.42, y: wy - wr * 0.1, r: s * 0.05 }];
    },
    icecream: function(ctx, cx, base, s, b, o) {
        const g = geo.icecream(cx, base, s, b), r = g.r, cy = g.cy, cone = mix(o.accent, "#e8b974", 0.8), top2 = mix(o.body, o.accent, 0.55), cherry = mix(o.accent, "#e23b4a", 0.85);
        fillPoly(ctx, cone, [cx - s * 0.2, base - s * 0.34, cx + s * 0.2, base - s * 0.34, cx, base - s * 0.02]);
        if (!o.sil) {
            ctx.strokeStyle = shade(cone, 0.22); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round";
            [-1, 0, 1].forEach(function(k) { ctx.beginPath(); ctx.moveTo(cx + k * s * 0.1, base - s * 0.33); ctx.lineTo(cx + k * s * 0.02, base - s * 0.06); ctx.stroke(); });
            [0.12, 0.22].forEach(function(f) { ctx.beginPath(); ctx.moveTo(cx - s * 0.2 * (1 - f * 2.1), base - s * 0.34 + f * s * 0.3); ctx.lineTo(cx + s * 0.2 * (1 - f * 2.1), base - s * 0.34 + f * s * 0.3); ctx.stroke(); });
        }
        fillOval(ctx, top2, cx, base - s * 0.7, s * 0.16 * (1 + b), s * 0.14);
        fillOval(ctx, cherry, cx + s * 0.02, base - s * 0.86, s * 0.04, s * 0.04);
        if (!o.sil) { ctx.strokeStyle = shade(cherry, 0.4); ctx.lineWidth = Math.max(1, s * 0.012); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx + s * 0.02, base - s * 0.9); ctx.quadraticCurveTo(cx + s * 0.05, base - s * 0.96, cx + s * 0.09, base - s * 0.95); ctx.stroke(); }
        fillOval(ctx, o.body, cx, cy, r * 1.05, r * 0.92);
        [-1.5, -0.5, 0.5, 1.5].forEach(function(k) { fillOval(ctx, o.body, cx + k * r * 0.5, cy + r * 0.75, r * 0.27, r * 0.22 + (Math.abs(k) < 1 ? r * 0.06 : 0)); });
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", cx - r * 0.5, cy - r * 0.5, r * 0.2, r * 0.12);
        cheeks(ctx, cx - r * 0.62, cx + r * 0.62, cy + r * 0.18, s * 0.035, o);
        mouth(ctx, cx, cy + r * 0.2, s * 0.035, o);
        return [{ x: cx - r * 0.4, y: cy - r * 0.08, r: s * 0.05 }, { x: cx + r * 0.4, y: cy - r * 0.08, r: s * 0.05 }];
    },
    axolotl: function(ctx, cx, base, s, b, o) {
        const g = geo.axolotl(cx, base, s, b), r = g.r, cy = g.cy, gill = mix(o.accent, "#ff7a9c", 0.75), dk = alt(o);
        // tail fin behind, feathery gills on both sides
        fillPoly(ctx, dk, [cx + r * 0.6, base - s * 0.2, cx + r * 1.25, base - s * 0.36, cx + r * 1.2, base - s * 0.05, cx + r * 0.5, base - s * 0.06]);
        ctx.strokeStyle = gill; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.lineCap = "round";
        [-1, 1].forEach(function(d) {
            [-0.5, 0, 0.5].forEach(function(k) {
                const x1 = cx + d * r * (1.0 + 0.32 * Math.cos(k)), y1 = cy - r * 0.3 + k * r * 0.62 - r * 0.34;
                ctx.beginPath(); ctx.moveTo(cx + d * r * 0.82, cy - r * 0.1 + k * r * 0.34); ctx.lineTo(x1, y1 + r * 0.2); ctx.stroke();
                fillOval(ctx, gill, x1, y1 + r * 0.2, s * 0.032, s * 0.032);
            });
        });
        fillOval(ctx, o.body, cx, base - s * 0.15, s * 0.3, s * 0.13);
        [-1, 1].forEach(function(d) { fillOval(ctx, dk, cx + d * s * 0.2, base - s * 0.04, s * 0.07, s * 0.04); });
        fillOval(ctx, o.body, cx, cy, r, r * 0.84);
        if (o.shine !== false) fillOval(ctx, "rgba(255,255,255,0.25)", cx - r * 0.45, cy - r * 0.5, r * 0.2, r * 0.1);
        cheeks(ctx, cx - r * 0.68, cx + r * 0.68, cy + r * 0.2, s * 0.04, o);
        mouth(ctx, cx, cy + r * 0.25, s * 0.045, o);
        return [{ x: cx - r * 0.5, y: cy - r * 0.05, r: s * 0.05 }, { x: cx + r * 0.5, y: cy - r * 0.05, r: s * 0.05 }];
    }
    // @@more-shapes
};

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ---- dress-up -----------------------------------------------------------------------------------
// o: { kind, custom, items: [{ id, color, size, dy }], t, lookX, lookY, blink, eye, eyeStyle }
// pass: "back" draws what goes behind the pal (cape, wings), "front" the rest.
function dress(ctx, w, h, o, pass) {
    ctx.clearRect(0, 0, w, h);
    const items = o.items || [];
    if (!items.length) return;
    const a = layout(o.custom ? "custom" : o.kind, w, h);
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (let i = 0; i < items.length; i++) {
        const d = items[i], fn = dressDraw[d.id];
        if (!fn) continue;
        const back = d.id === "cape" || d.id === "wings";
        if ((pass === "back") !== back) continue;
        ctx.globalAlpha = 1;
        fn(ctx, a, d.color, d.size / 100, a.s * d.dy / 100, o, i);
    }
    ctx.restore();
}

function stroked(ctx, c, lw) { ctx.strokeStyle = c; ctx.lineWidth = lw; }

var dressDraw = {
    tophat: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.62 * k, y = a.top + s * 0.035 + dy;
        fillRect(ctx, c, a.cx - w * 0.38, y - s * 0.26 * k, w * 0.76, s * 0.26 * k);
        fillOval(ctx, c, a.cx, y - s * 0.26 * k, w * 0.38, s * 0.025 * k);
        fillRect(ctx, "rgba(255,255,255,0.3)", a.cx - w * 0.38, y - s * 0.07 * k, w * 0.76, s * 0.04 * k);
        fillOval(ctx, c, a.cx, y, w * 0.62, s * 0.035 * k);
    },
    party: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.62 * k, y = a.top + s * 0.04 + dy;
        fillPoly(ctx, c, [a.cx - w * 0.42, y, a.cx + w * 0.42, y, a.cx, y - s * 0.34 * k]);
        stroked(ctx, "rgba(255,255,255,0.5)", s * 0.015 * k);
        ctx.beginPath(); ctx.moveTo(a.cx - w * 0.25, y - s * 0.09 * k); ctx.lineTo(a.cx + w * 0.25, y - s * 0.09 * k); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.cx - w * 0.12, y - s * 0.2 * k); ctx.lineTo(a.cx + w * 0.12, y - s * 0.2 * k); ctx.stroke();
        fillOval(ctx, "#ffffff", a.cx, y - s * 0.34 * k, s * 0.03 * k, s * 0.03 * k);
    },
    crown: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.6 * k, y = a.top + s * 0.04 + dy, x = a.cx;
        fillPoly(ctx, c, [x - w * 0.4, y, x - w * 0.4, y - s * 0.16 * k, x - w * 0.2, y - s * 0.08 * k, x, y - s * 0.19 * k,
                          x + w * 0.2, y - s * 0.08 * k, x + w * 0.4, y - s * 0.16 * k, x + w * 0.4, y]);
        fillOval(ctx, "#e84c4c", x, y - s * 0.05 * k, s * 0.018 * k, s * 0.018 * k);
        fillOval(ctx, "#4da3ff", x - w * 0.24, y - s * 0.05 * k, s * 0.014 * k, s * 0.014 * k);
        fillOval(ctx, "#4da3ff", x + w * 0.24, y - s * 0.05 * k, s * 0.014 * k, s * 0.014 * k);
    },
    cap: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.62 * k, y = a.top + s * 0.06 + dy;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a.cx, y, w * 0.5, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillOval(ctx, c, a.cx + w * 0.4, y, w * 0.42, s * 0.03 * k);
        fillOval(ctx, "rgba(0,0,0,0.2)", a.cx + w * 0.4, y + s * 0.006, w * 0.42, s * 0.02 * k);
        fillOval(ctx, "rgba(255,255,255,0.5)", a.cx, y - w * 0.5, s * 0.012, s * 0.012);
    },
    beanie: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.66 * k, y = a.top + s * 0.07 + dy;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a.cx, y, w * 0.5, Math.PI, 0); ctx.closePath(); ctx.fill();
        fillRect(ctx, "rgba(255,255,255,0.3)", a.cx - w * 0.5, y - s * 0.01, w, s * 0.055 * k);
        fillOval(ctx, "#ffffff", a.cx, y - w * 0.5 - s * 0.01, s * 0.035 * k, s * 0.035 * k);
    },
    wizardhat: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.7 * k, y = a.top + s * 0.04 + dy;
        fillPoly(ctx, c, [a.cx - w * 0.55, y, a.cx + w * 0.55, y, a.cx + w * 0.1, y - s * 0.5 * k]);
        fillOval(ctx, c, a.cx, y, w * 0.68, s * 0.035 * k);
        ctx.fillStyle = "#ffe066"; star(ctx, a.cx, y - s * 0.16 * k, s * 0.035 * k);
    },
    santa: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.62 * k, y = a.top + s * 0.05 + dy;
        fillPoly(ctx, c, [a.cx - w * 0.45, y, a.cx + w * 0.45, y, a.cx + w * 0.75, y - s * 0.28 * k, a.cx - w * 0.1, y - s * 0.3 * k]);
        fillRect(ctx, "#ffffff", a.cx - w * 0.5, y - s * 0.02, w, s * 0.05 * k);
        fillOval(ctx, "#ffffff", a.cx + w * 0.75, y - s * 0.28 * k, s * 0.035 * k, s * 0.035 * k);
    },
    halo: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.top - s * 0.05 + dy;
        stroked(ctx, c, s * 0.025 * k);
        ctx.beginPath(); oval(ctx, a.cx, y, a.headW * 0.27 * k, s * 0.045 * k); ctx.stroke();
    },
    horns: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.6 * k, y = a.top + s * 0.03 + dy;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, c, [a.cx + d * w * 0.2, y, a.cx + d * w * 0.42, y, a.cx + d * w * 0.48, y - s * 0.15 * k]);
        });
    },
    catears: function(ctx, a, c, k, dy) {
        const s = a.s, w = a.headW * 0.62 * k, y = a.top + s * 0.05 + dy;
        [-1, 1].forEach(function(d) {
            fillPoly(ctx, c, [a.cx + d * w * 0.2, y, a.cx + d * w * 0.58, y, a.cx + d * w * 0.52, y - s * 0.15 * k]);
            fillPoly(ctx, "rgba(255,255,255,0.35)", [a.cx + d * w * 0.3, y - s * 0.01, a.cx + d * w * 0.5, y - s * 0.01, a.cx + d * w * 0.48, y - s * 0.09 * k]);
        });
    },
    headphones: function(ctx, a, c, k, dy) {
        const s = a.s, hw = a.headW * 0.5 * k, y = a.eyeY + dy;
        stroked(ctx, c, s * 0.035 * k);
        ctx.beginPath(); ctx.arc(a.cx, y, hw, Math.PI, 0); ctx.stroke();
        fillOval(ctx, c, a.cx - hw, y + s * 0.01, s * 0.045 * k, s * 0.075 * k);
        fillOval(ctx, c, a.cx + hw, y + s * 0.01, s * 0.045 * k, s * 0.075 * k);
    },
    flower: function(ctx, a, c, k, dy) {
        const s = a.s, x = a.cx - a.headW * 0.26, y = a.top + s * 0.03 + dy, r = s * 0.035 * k;
        for (let i = 0; i < 5; i++) {
            const an = i * 2 * Math.PI / 5;
            fillOval(ctx, c, x + Math.cos(an) * r * 1.1, y + Math.sin(an) * r * 1.1, r * 0.85, r * 0.85);
        }
        fillOval(ctx, "#ffe066", x, y, r * 0.7, r * 0.7);
    },
    glasses: function(ctx, a, c, k, dy, o) {
        const s = a.s, r = a.eyeR * 1.55 * k, y = a.eyeY + dy;
        stroked(ctx, c, s * 0.018 * k);
        [-1, 1].forEach(function(d) { ctx.beginPath(); oval(ctx, a.cx + d * a.eyeDx, y, r, r); ctx.stroke(); });
        ctx.beginPath(); ctx.moveTo(a.cx - a.eyeDx + r, y); ctx.lineTo(a.cx + a.eyeDx - r, y); ctx.stroke();
    },
    shades: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.eyeY + dy, rx = a.eyeR * 1.75 * k, ry = a.eyeR * 1.35 * k;
        fillRect(ctx, c, a.cx - a.eyeDx, y - s * 0.012, a.eyeDx * 2, s * 0.024);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, c, a.cx + d * a.eyeDx, y, rx, ry);
            fillOval(ctx, "rgba(255,255,255,0.25)", a.cx + d * a.eyeDx - rx * 0.35, y - ry * 0.4, rx * 0.3, ry * 0.2);
        });
    },
    monocle: function(ctx, a, c, k, dy) {
        const s = a.s, r = a.eyeR * 1.6 * k, x = a.cx + a.eyeDx, y = a.eyeY + dy;
        stroked(ctx, c, s * 0.02 * k);
        ctx.beginPath(); oval(ctx, x, y, r, r); ctx.stroke();
        stroked(ctx, c, s * 0.01);
        ctx.beginPath(); ctx.moveTo(x + r * 0.6, y + r * 0.8); ctx.quadraticCurveTo(x + r * 1.6, y + s * 0.15, x + r * 0.9, y + s * 0.28); ctx.stroke();
    },
    eyepatch: function(ctx, a, c, k, dy) {
        const s = a.s, r = a.eyeR * 1.5 * k, x = a.cx - a.eyeDx, y = a.eyeY + dy;
        stroked(ctx, c, s * 0.015);
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(a.cx - a.headW * 0.48, y - s * 0.09); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(a.cx + a.headW * 0.48, y - s * 0.12); ctx.stroke();
        fillOval(ctx, c, x, y, r, r * 1.1);
    },
    mask: function(ctx, a, c, k, dy, o) {
        const s = a.s, y = a.eyeY + dy, rx = a.eyeR * 2.0 * k, ry = a.eyeR * 1.6 * k;
        fillRect(ctx, c, a.cx - a.eyeDx, y - ry * 0.55, a.eyeDx * 2, ry * 1.1);
        [-1, 1].forEach(function(d) {
            fillOval(ctx, c, a.cx + d * a.eyeDx, y, rx, ry);
            fillPoly(ctx, c, [a.cx + d * (a.eyeDx + rx * 0.7), y - ry * 0.6, a.cx + d * (a.eyeDx + rx * 1.5), y - ry * 1.1, a.cx + d * (a.eyeDx + rx * 1.1), y + ry * 0.2]);
        });
        if (!o.custom) [-1, 1].forEach(function(d) { eye(ctx, { x: a.cx + d * a.eyeDx, y: y, r: a.eyeR, side: d }, o); });
    },
    mustache: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.eyeY + a.eyeR * 2.7 * k + dy;
        [-1, 1].forEach(function(d) {
            ctx.fillStyle = c; ctx.beginPath();
            ctx.moveTo(a.cx, y);
            ctx.quadraticCurveTo(a.cx + d * s * 0.06 * k, y - s * 0.04 * k, a.cx + d * s * 0.12 * k, y - s * 0.01 * k);
            ctx.quadraticCurveTo(a.cx + d * s * 0.07 * k, y + s * 0.045 * k, a.cx, y + s * 0.02 * k);
            ctx.closePath(); ctx.fill();
        });
    },
    bow: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, x = a.cx;
        [-1, 1].forEach(function(d) { fillPoly(ctx, c, [x, y, x + d * s * 0.11 * k, y - s * 0.055 * k, x + d * s * 0.11 * k, y + s * 0.055 * k]); });
        fillOval(ctx, c, x, y, s * 0.025 * k, s * 0.03 * k);
    },
    scarf: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, x = a.cx;
        fillOval(ctx, c, x, y, a.headW * 0.4 * k, s * 0.04 * k);
        fillPoly(ctx, c, [x + s * 0.05 * k, y, x + s * 0.13 * k, y + s * 0.02, x + s * 0.11 * k, y + s * 0.17 * k, x + s * 0.03 * k, y + s * 0.15 * k]);
        fillRect(ctx, "rgba(255,255,255,0.3)", x + s * 0.045 * k, y + s * 0.1 * k, s * 0.075 * k, s * 0.02 * k);
    },
    tie: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, x = a.cx;
        fillPoly(ctx, c, [x - s * 0.03 * k, y, x + s * 0.03 * k, y, x + s * 0.02 * k, y + s * 0.03 * k, x - s * 0.02 * k, y + s * 0.03 * k]);
        fillPoly(ctx, c, [x - s * 0.02 * k, y + s * 0.03 * k, x + s * 0.02 * k, y + s * 0.03 * k, x + s * 0.04 * k, y + s * 0.15 * k, x, y + s * 0.18 * k, x - s * 0.04 * k, y + s * 0.15 * k]);
    },
    bell: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, x = a.cx;
        fillOval(ctx, "#e84c4c", x, y, a.headW * 0.36 * k, s * 0.025 * k);
        fillOval(ctx, c, x, y + s * 0.05 * k, s * 0.04 * k, s * 0.04 * k);
        fillRect(ctx, "rgba(0,0,0,0.35)", x - s * 0.02 * k, y + s * 0.06 * k, s * 0.04 * k, s * 0.006);
    },
    medal: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, x = a.cx;
        fillPoly(ctx, "#e84c4c", [x - s * 0.08 * k, y - s * 0.03, x - s * 0.03 * k, y - s * 0.03, x + s * 0.03 * k, y + s * 0.05 * k, x - s * 0.02 * k, y + s * 0.05 * k]);
        fillPoly(ctx, "#3a6fe8", [x + s * 0.08 * k, y - s * 0.03, x + s * 0.03 * k, y - s * 0.03, x - s * 0.03 * k, y + s * 0.05 * k, x + s * 0.02 * k, y + s * 0.05 * k]);
        fillOval(ctx, c, x, y + s * 0.075 * k, s * 0.04 * k, s * 0.04 * k);
        fillOval(ctx, "rgba(0,0,0,0.2)", x, y + s * 0.075 * k, s * 0.022 * k, s * 0.022 * k);
    },
    cape: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy, hw = a.headW;
        fillPoly(ctx, c, [a.cx - hw * 0.36, y - s * 0.03, a.cx + hw * 0.36, y - s * 0.03, a.cx + hw * 0.62 * k, a.base, a.cx - hw * 0.62 * k, a.base]);
    },
    wings: function(ctx, a, c, k, dy) {
        const s = a.s, y = a.neckY + dy - s * 0.06;
        [-1, 1].forEach(function(d) {
            ctx.save(); ctx.translate(a.cx + d * a.headW * 0.52, y); ctx.rotate(d * 0.5);
            ctx.globalAlpha = 0.95; fillOval(ctx, c, 0, -s * 0.1 * k, s * 0.09 * k, s * 0.2 * k);
            ctx.globalAlpha = 0.25; fillOval(ctx, "#000000", d * s * 0.015, -s * 0.08 * k, s * 0.05 * k, s * 0.14 * k);
            ctx.restore();
        });
    },
    sparkles: function(ctx, a, c, k, dy, o) {
        const s = a.s, pts = [[-0.62, -0.18], [0.6, -0.28], [-0.5, 0.3], [0.55, 0.22]];
        for (let i = 0; i < pts.length; i++) {
            ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(o.t * 2 + i * 1.7));
            ctx.fillStyle = c;
            spark(ctx, a.cx + pts[i][0] * a.headW, a.eyeY + dy + pts[i][1] * a.headW, s * 0.045 * k * (0.7 + 0.3 * (i % 2)));
        }
    },
    hearts: function(ctx, a, c, k, dy, o) {
        const s = a.s;
        for (let i = 0; i < 3; i++) {
            const ph = (o.t * 0.35 + i / 3) % 1;
            ctx.globalAlpha = 1 - ph;
            ctx.fillStyle = c;
            heart(ctx, a.cx + (i - 1) * a.headW * 0.3 + Math.sin(o.t * 2 + i) * s * 0.02, a.top + dy - ph * s * 0.35, s * 0.035 * k);
        }
    }
};
