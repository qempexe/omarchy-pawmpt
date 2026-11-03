.pragma library

// Everything you can pick for the pal: characters (in categories), ready made skins
// and the dress-up items. How each one is drawn is in Draw.js (same keys).

// ---- characters ---------------------------------------------------------------------------
// Pictures you add show up under "Yours", or under the name of the folder they are in
// (~/.config/pawmpt/characters/Anime/neko.png is in the category Anime).
var categories = ["Classic", "Animals", "Anime", "Game heroes", "Fantasy", "Sci-fi", "Spooky", "Food", "Nature", "Retro and pixel", "Dev and desk"];

var characters = [
    { key: "blob",      label: "Blob",      category: "Classic" },
    { key: "ghost",     label: "Ghost",     category: "Classic" },
    { key: "cat",       label: "Cat",       category: "Classic" },
    { key: "slime",     label: "Slime",     category: "Classic" },
    { key: "robot",     label: "Robot",     category: "Classic" },
    { key: "frog",      label: "Frog",      category: "Classic" },
    { key: "bunny",     label: "Bunny",     category: "Animals" },
    { key: "penguin",   label: "Penguin",   category: "Animals" },
    { key: "owl",       label: "Owl",       category: "Animals" },
    { key: "panda",     label: "Panda",     category: "Animals" },
    { key: "dog",       label: "Dog",       category: "Animals" },
    { key: "chibi",     label: "Chibi",     category: "Anime" },
    { key: "kitsune",   label: "Kitsune",   category: "Anime" },
    { key: "ninja",     label: "Ninja",     category: "Anime" },
    { key: "onigiri",   label: "Onigiri",   category: "Anime" },
    { key: "hero",      label: "Hero",      category: "Game heroes" },
    { key: "knight",    label: "Knight",    category: "Game heroes" },
    { key: "wizard",    label: "Wizard",    category: "Fantasy" },
    { key: "astronaut", label: "Astronaut", category: "Sci-fi" },
    { key: "dragon",    label: "Dragon",    category: "Fantasy" },
    { key: "alien",     label: "Alien",     category: "Sci-fi" },
    { key: "monster",   label: "Monster",   category: "Spooky" },
    { key: "mahou",      label: "Magical girl", category: "Anime" },
    { key: "shonen",     label: "Shonen hero",  category: "Anime" },
    { key: "student",    label: "Student",      category: "Anime" },
    { key: "samurai",    label: "Samurai",      category: "Anime" },
    { key: "nekogirl",   label: "Neko girl",    category: "Anime" },
    { key: "oni",        label: "Oni",          category: "Anime" },
    { key: "builder",    label: "Builder",      category: "Game heroes" },
    { key: "speedster",  label: "Speedster",    category: "Game heroes" },
    { key: "adventurer", label: "Adventurer",   category: "Game heroes" },
    { key: "marine",     label: "Marine",       category: "Game heroes" },
    { key: "hunter",     label: "Hunter",       category: "Game heroes" },
    { key: "bomber",     label: "Bomber",       category: "Game heroes" },
    { key: "racer",      label: "Racer",        category: "Game heroes" },
    { key: "sidekick",   label: "Sidekick",     category: "Game heroes" },
    { key: "elf", label: "Elf", category: "Fantasy" },
    { key: "dwarf", label: "Dwarf", category: "Fantasy" },
    { key: "fairy", label: "Fairy", category: "Fantasy" },
    { key: "unicorn", label: "Unicorn", category: "Fantasy" },
    { key: "mermaid", label: "Mermaid", category: "Fantasy" },
    { key: "goblin", label: "Goblin", category: "Fantasy" },
    { key: "phoenix", label: "Phoenix", category: "Fantasy" },
    { key: "cyborg", label: "Cyborg", category: "Sci-fi" },
    { key: "android", label: "Android", category: "Sci-fi" },
    { key: "ufo", label: "UFO", category: "Sci-fi" },
    { key: "spacecat", label: "Space cat", category: "Sci-fi" },
    { key: "vampire", label: "Vampire", category: "Spooky" },
    { key: "werewolf", label: "Werewolf", category: "Spooky" },
    { key: "mummy", label: "Mummy", category: "Spooky" },
    { key: "zombie", label: "Zombie", category: "Spooky" },
    { key: "yeti", label: "Yeti", category: "Spooky" },
    { key: "cyclops", label: "Cyclops", category: "Spooky" },
    { key: "fox", label: "Fox", category: "Animals" },
    { key: "bear", label: "Bear", category: "Animals" },
    { key: "hamster", label: "Hamster", category: "Animals" },
    { key: "sushi", label: "Sushi", category: "Food" },
    { key: "ramen", label: "Ramen", category: "Food" },
    { key: "pizza", label: "Pizza slice", category: "Food" },
    { key: "donut", label: "Donut", category: "Food" },
    { key: "cupcake", label: "Cupcake", category: "Food" },
    { key: "burger", label: "Burger", category: "Food" },
    { key: "boba", label: "Boba tea", category: "Food" },
    { key: "dumpling", label: "Dumpling", category: "Food" },
    { key: "mushroom", label: "Mushroom", category: "Nature" },
    { key: "cactus", label: "Cactus", category: "Nature" },
    { key: "sprout", label: "Sprout", category: "Nature" },
    { key: "cloud", label: "Cloud", category: "Nature" },
    { key: "sun", label: "Sun", category: "Nature" },
    { key: "moon", label: "Moon", category: "Nature" },
    { key: "snowman", label: "Snowman", category: "Nature" },
    { key: "invader", label: "Pixel invader", category: "Retro and pixel" },
    { key: "chomper", label: "Chomper", category: "Retro and pixel" },
    { key: "pixelheart", label: "8-bit heart", category: "Retro and pixel" },
    { key: "cartridge", label: "Cartridge", category: "Retro and pixel" },
    { key: "joystick", label: "Joystick buddy", category: "Retro and pixel" },
    { key: "cassette", label: "Cassette", category: "Retro and pixel" },
    { key: "duck", label: "Rubber duck", category: "Dev and desk" },
    { key: "coffee", label: "Coffee cup", category: "Dev and desk" },
    { key: "bulb", label: "Lightbulb", category: "Dev and desk" },
    { key: "bug", label: "Bug", category: "Dev and desk" },
    { key: "terminal", label: "Terminal prompt", category: "Dev and desk" },
    { key: "floppy", label: "Floppy disk", category: "Dev and desk" },
    { key: "keycat", label: "Keyboard cat", category: "Dev and desk" },
    { key: "paperclip", label: "Paperclip", category: "Dev and desk" },
    { key: "pencil", label: "Pencil", category: "Dev and desk" },
    { key: "sticky", label: "Sticky note", category: "Dev and desk" },
    { key: "rocket", label: "Rocket", category: "Sci-fi" },
    { key: "icecream", label: "Ice cream", category: "Food" },
    { key: "axolotl", label: "Axolotl", category: "Animals" }
];

function characterKeys() { return characters.map(function(c) { return c.key; }); }
function isBuiltIn(key) { return characterKeys().indexOf(key) >= 0; }

// ---- skins ----------------------------------------------------------------------------------
// A skin is a set of the Skin settings (the keys are the setting keys). What a preset leaves
// out goes back to the default. "Theme" takes its colors from the Omarchy theme (palTheme), live.
var presets = [
    { name: "Bubblegum", palBody: "#ff6fa8", palEye: "#2a1020", palAccent: "#ffd1e3" },
    { name: "Mint",      palBody: "#6fe0b4", palEye: "#0f2a20", palAccent: "#d6fff0" },
    { name: "Lava",      palBody: "#ff5a36", palEye: "#2a0a04", palAccent: "#ffc04d", bodyFill: "vertical", palBody2: "#c4210a" },
    { name: "Ocean",     palBody: "#4da3ff", palEye: "#06203d", palAccent: "#bfe1ff" },
    { name: "Grape",     palBody: "#a06bff", palEye: "#1c0d33", palAccent: "#e2d1ff" },
    { name: "Lemon",     palBody: "#ffe066", palEye: "#332a00", palAccent: "#fff6c7" },
    { name: "Ghostly",   palBody: "#e8eef2", palEye: "#20262b", palAccent: "#b9c7d1" },
    { name: "Night",     palBody: "#2b2f3a", palEye: "#ffd36b", palAccent: "#5b6478", eyeStyle: "sparkle" },
    { name: "Sunset",    palBody: "#ff7aa2", palEye: "#2b1020", palAccent: "#ffd7a8", bodyFill: "vertical", palBody2: "#ffa24d" },
    { name: "Cotton",    palBody: "#fff1f6", palEye: "#3a2030", palAccent: "#ffb3cc", pattern: "spots", palPattern: "#ff8fb4" },
    { name: "Tiger",     palBody: "#ffa23a", palEye: "#1d1208", palAccent: "#fff0d0", pattern: "stripes", palPattern: "#3a1c05", outlineWidth: 2, palOutline: "#3a1c05" },
    { name: "Galaxy",    palBody: "#7b5cff", palEye: "#10083a", palAccent: "#e9e0ff", bodyFill: "radial", palBody2: "#1c1060", pattern: "stars", palPattern: "#ffffff", glow: 30, eyeStyle: "sparkle" },
    { name: "Matcha",    palBody: "#a7c080", palEye: "#1f2a14", palAccent: "#e6f0cf", pattern: "hearts", palPattern: "#5d7a3a" },
    { name: "Gold",      palBody: "#f2c94c", palEye: "#3a2a00", palAccent: "#fff1b8", bodyFill: "vertical", palBody2: "#c8901a", outlineWidth: 2, palOutline: "#7a5200", glow: 25 },
    { name: "Theme",     theme: true, palTheme: true }
];

function preset(name) {
    for (var i = 0; i < presets.length; i++) if (presets[i].name === name) return presets[i];
    return null;
}
function isHex(s) { return /^#[0-9a-fA-F]{6}$/.test(String(s)); }

// ---- dress ----------------------------------------------------------------------------------
// slot: where it goes. color: the default color (you can change it per item).
var slots = [
    { key: "head",  label: "Head" },
    { key: "face",  label: "Face" },
    { key: "neck",  label: "Neck" },
    { key: "back",  label: "Back" },
    { key: "extra", label: "Extras" }
];

var dressItems = [
    { id: "tophat",     label: "Top hat",     slot: "head",  color: "#2b2b33" },
    { id: "party",      label: "Party hat",   slot: "head",  color: "#ff5fa2" },
    { id: "crown",      label: "Crown",       slot: "head",  color: "#f2c94c" },
    { id: "cap",        label: "Cap",         slot: "head",  color: "#e84c4c" },
    { id: "beanie",     label: "Beanie",      slot: "head",  color: "#4da3ff" },
    { id: "wizardhat",  label: "Wizard hat",  slot: "head",  color: "#6a4cff" },
    { id: "santa",      label: "Santa hat",   slot: "head",  color: "#e23b3b" },
    { id: "halo",       label: "Halo",        slot: "head",  color: "#ffe066" },
    { id: "horns",      label: "Horns",       slot: "head",  color: "#d63b3b" },
    { id: "catears",    label: "Cat ears",    slot: "head",  color: "#ff9ec4" },
    { id: "headphones", label: "Headphones",  slot: "head",  color: "#3a3f4b" },
    { id: "flower",     label: "Flower",      slot: "head",  color: "#ff7ab0" },
    { id: "glasses",    label: "Glasses",     slot: "face",  color: "#2b2b33" },
    { id: "shades",     label: "Sunglasses",  slot: "face",  color: "#15151b" },
    { id: "monocle",    label: "Monocle",     slot: "face",  color: "#f2c94c" },
    { id: "eyepatch",   label: "Eye patch",   slot: "face",  color: "#1b1b22" },
    { id: "mask",       label: "Hero mask",   slot: "face",  color: "#e84c4c" },
    { id: "mustache",   label: "Mustache",    slot: "face",  color: "#3a2412" },
    { id: "bow",        label: "Bow",         slot: "neck",  color: "#ff5fa2" },
    { id: "scarf",      label: "Scarf",       slot: "neck",  color: "#e84c4c" },
    { id: "tie",        label: "Tie",         slot: "neck",  color: "#3a6fe8" },
    { id: "bell",       label: "Bell",        slot: "neck",  color: "#f2c94c" },
    { id: "medal",      label: "Medal",       slot: "neck",  color: "#f2c94c" },
    { id: "cape",       label: "Cape",        slot: "back",  color: "#d63b3b" },
    { id: "wings",      label: "Wings",       slot: "back",  color: "#ffffff" },
    { id: "sparkles",   label: "Sparkles",    slot: "extra", color: "#ffe066" },
    { id: "hearts",     label: "Hearts",      slot: "extra", color: "#ff5f8f" }
];

var dressSwatches = ["#ffffff", "#15151b", "#e84c4c", "#ff5fa2", "#ff9a3c", "#f2c94c",
                     "#7ed957", "#2fc4b2", "#4da3ff", "#6a4cff", "#a06bff", "#8a5a3a"];

function dressItem(id) {
    for (var i = 0; i < dressItems.length; i++) if (dressItems[i].id === id) return dressItems[i];
    return null;
}

// what is worn: [{ id, color, size (50..160 %), dy (-40..40, in % of the pal's height) }]
function cleanDress(list) {
    var out = [];
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length && out.length < 12; i++) {
        var d = list[i];
        if (!d || typeof d !== "object" || !dressItem(String(d.id))) continue;
        var dup = false;
        for (var j = 0; j < out.length; j++) if (out[j].id === d.id) dup = true;
        if (dup) continue;
        var size = parseInt(d.size, 10), dy = parseInt(d.dy, 10);
        out.push({
            id: String(d.id),
            color: isHex(d.color) ? String(d.color).toLowerCase() : dressItem(String(d.id)).color,
            size: isFinite(size) ? Math.max(50, Math.min(160, size)) : 100,
            dy: isFinite(dy) ? Math.max(-40, Math.min(40, dy)) : 0
        });
    }
    return out;
}

function wearing(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
}
