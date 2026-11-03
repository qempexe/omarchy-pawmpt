#!/usr/bin/env node
// Preview sheets. Run: node tools/preview.js <out-dir> [--only a,b,c] [--category Anime] [--dress]
// Renders Draw.js on a real canvas in headless Chrome and writes PNG sheets:
//   characters.png  every character in 3 skins (and a 20 px copy for the bar button)
//   dress.png       a few characters wearing every dress item (with --dress)
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
function chromePath() {
    const c = [process.env.CHROME, "/opt/google/chrome/chrome", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "google-chrome", "chromium"];
    for (const p of c) if (p && (!p.startsWith("/") || fs.existsSync(p))) return p;
    return "google-chrome";
}
const out = path.resolve(process.argv[2] || "preview");
const args = process.argv.slice(3);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
fs.mkdirSync(out, { recursive: true });

const strip = (f) => fs.readFileSync(path.join(root, f), "utf8").replace(/^\s*\.pragma library.*$/m, "");
const only = val("--only") ? val("--only").split(",") : null;
const category = val("--category");

const page = (title, body, script, w, h) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>html,body{margin:0;background:#1b1714;color:#e9dccb;font:11px monospace}
.g{display:grid;gap:6px;padding:10px;width:${w - 20}px}.c{text-align:center}canvas{display:block;margin:0 auto;background:#241e1a;border-radius:6px}
.l{opacity:.7;margin-top:2px}</style>
<body>${body}
<script>
${strip("qml/js/Skins.js")}
</script><script>
${strip("qml/js/Draw.js")}
</script><script>
${script}
</script>`;

const common = `
// Qt's Canvas.ellipse(x, y, w, h) takes a bounding box; the browser's takes seven numbers
(function(){var e=CanvasRenderingContext2D.prototype.ellipse;CanvasRenderingContext2D.prototype.ellipse=function(x,y,w,h){if(arguments.length===4){e.call(this,x+w/2,y+h/2,Math.max(0,w/2),Math.max(0,h/2),0,0,Math.PI*2);}else e.apply(this,arguments);};})();
function skinOf(p){var d={body:"#ff6fa8",body2:"#c4457a",eye:"#2a1020",accent:"#ffd1e3",outline:"#2a1020",outlineWidth:0,pattern:"none",patternColor:"#ffffff",patternSize:100,fill:"flat",glow:0,shine:true,blush:true,eyeStyle:"normal",mouthStyle:"smile"};
 var map={palBody:"body",palBody2:"body2",palEye:"eye",palAccent:"accent",palOutline:"outline",palPattern:"patternColor",outlineWidth:"outlineWidth",pattern:"pattern",patternSize:"patternSize",bodyFill:"fill",glow:"glow",shine:"shine",blush:"blush",eyeStyle:"eyeStyle",mouthStyle:"mouthStyle"};
 for(var k in map) if(p[k]!==undefined) d[map[k]]=p[k]; return d;}
function pre(n){for(var i=0;i<presets.length;i++)if(presets[i].name===n)return skinOf(presets[i]);}
function cv(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;c.style.width=w+"px";c.style.height=h+"px";return c;}
function cell(parent,label,c){var d=document.createElement("div");d.className="c";d.appendChild(c);var l=document.createElement("div");l.className="l";l.textContent=label;d.appendChild(l);parent.appendChild(d);}
`;

// read the character list straight from Skins.js
const sk = new Function(strip("qml/js/Skins.js") + "; return { characters: characters };")();
let chars = sk.characters;
if (only) chars = chars.filter((c) => only.includes(c.key));
if (category) chars = chars.filter((c) => c.category === category);
const keys = chars.map((c) => c.key);

function shot(file, html, w, h) {
    const htmlPath = path.join(out, file.replace(/\.png$/, ".html"));
    fs.writeFileSync(htmlPath, html);
    const r = spawnSync(chromePath(), ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--window-size=" + w + "," + h, "--virtual-time-budget=2000",
        "--screenshot=" + path.join(out, file), "file://" + htmlPath], { encoding: "utf8" });
    if (r.status !== 0) console.error(r.stderr);
    else console.log("wrote " + path.join(out, file));
}

// ---- characters in 3 skins -------------------------------------------------------------------
const SKINS = ["Bubblegum", "Galaxy", "Tiger"];
const cols = 6;
const cellW = 140, cellH = 150;
const rows = Math.ceil(keys.length / cols) * SKINS.length;
const W = cols * (cellW + 6) + 20;
const perRowGroup = SKINS.length * cellH;
const H = Math.ceil(keys.length / cols) * (perRowGroup + 10) + 40;
const script1 = common + `
var keys=${JSON.stringify(keys)}, skins=${JSON.stringify(SKINS)};
var root=document.getElementById("g"); root.style.gridTemplateColumns="repeat(${cols},1fr)";
keys.forEach(function(k){
  var box=document.createElement("div"); box.style.display="contents";
  skins.forEach(function(s){
    var c=cv(120,120), ctx=c.getContext("2d");
    var o=pre(s); o.kind=k; o.t=0.6; o.breathe=true; o.lookX=0; o.lookY=0; o.blink=0; o.busy=false;
    draw(ctx,120,120,o);
    var wrap=document.createElement("div"); wrap.className="c";
    wrap.appendChild(c);
    var small=cv(20,20); var o2=pre(s); o2.kind=k; o2.t=0; o2.breathe=false; o2.lookX=0;o2.lookY=0;o2.blink=0;o2.busy=false; draw(small.getContext("2d"),20,20,o2);
    small.style.display="inline-block"; small.style.margin="2px 4px 0 0"; small.style.background="#241e1a";
    var l=document.createElement("div"); l.className="l"; l.textContent=k+" / "+s; wrap.appendChild(l); wrap.appendChild(small);
    root.appendChild(wrap);
  });
});
`;
// one column per character group of 3 skins would be too wide, so each character is 3 cells in a row
const cols3 = 2;   // characters per row (each takes 3 cells)
const W1 = cols3 * 3 * 140 + 40;
const H1 = Math.ceil(keys.length / cols3) * 190 + 30;
fs.writeFileSync(path.join(out, ".size"), JSON.stringify({ W1, H1 }));
shot("characters.png", page("characters", '<div class="g" id="g" style="grid-template-columns:repeat(' + (cols3 * 3) + ',1fr)"></div>',
    script1.replace('root.style.gridTemplateColumns="repeat(' + cols + ',1fr)";', ""), W1, H1), W1, H1);

// ---- dress test sheet -------------------------------------------------------------------------
if (args.includes("--dress")) {
    const dressKeys = (only || ["blob", "cat", "robot", "penguin", "onigiri", "wizard"]);
    const dW = 140 * 9 + 40;
    const dItems = new Function(strip("qml/js/Skins.js") + "; return dressItems;")();
    const per = 9;
    const rowsD = Math.ceil(dItems.length / per) * dressKeys.length;
    const dH = rowsD * 150 + 40;
    const script2 = common + `
var chars=${JSON.stringify(dressKeys)}, items=dressItems;
var root=document.getElementById("g"); root.style.gridTemplateColumns="repeat(${per},1fr)";
chars.forEach(function(k){
  items.forEach(function(it){
    var c=cv(120,120), ctx=c.getContext("2d"); var sk=pre("Mint");
    var o=Object.assign({},sk,{kind:k,t:0.6,breathe:true,lookX:0,lookY:0,blink:0,busy:false});
    var d={kind:k,custom:false,items:[{id:it.id,color:it.color,size:100,dy:0}],t:0.6,lookX:0,lookY:0,blink:0,eye:sk.eye,eyeStyle:sk.eyeStyle};
    var back=cv(120,120), bctx=back.getContext("2d");
    c.style.position="relative";
    // back layer, body, front layer composited onto one canvas
    var tmp=cv(120,120);
    dress(tmp.getContext("2d"),120,120,d,"back"); ctx.drawImage(tmp,0,0);
    var tmp2=cv(120,120); draw(tmp2.getContext("2d"),120,120,o); ctx.drawImage(tmp2,0,0);
    var tmp3=cv(120,120); dress(tmp3.getContext("2d"),120,120,d,"front"); ctx.drawImage(tmp3,0,0);
    var wrap=document.createElement("div"); wrap.className="c"; wrap.appendChild(c);
    var l=document.createElement("div"); l.className="l"; l.textContent=k+" + "+it.id; wrap.appendChild(l); root.appendChild(wrap);
  });
});
`;
    shot("dress.png", page("dress", '<div class="g" id="g"></div>', script2, dW, dH), dW, dH);
}
