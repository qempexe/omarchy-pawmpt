.pragma library

// Every setting, in the groups and order the panel shows them. resolve() turns what is
// saved into clean values, so a hand-edited settings.json can't break anything.
//
//   tab      settings or wardrobe (where the group is shown); "none" is never shown
//   kind     enum, int, bool, string, or palette (a few colors edited together)
//   control  how an enum is drawn: scheme, tiles, seg or chips (seg or chips when left out)
//   section  a heading the row sits under, inside its group
//   when     the row is dimmed unless another setting has one of these values
//   models   a row that is drawn as the model list (opencode and Ollama)

const swatches = [
    "#141414", "#1d1510", "#1a1b26", "#282a36", "#2e3440", "#2d353b", "#1f1f28", "#3b2a1f",
    "#e0e0e0", "#eadbc8", "#ffffff", "#c0caf5", "#d8dee9", "#dcd7ba", "#f8f8f2", "#e0def4",
    "#d4a35a", "#c8925a", "#7aa2f7", "#cba6f7", "#a7c080", "#88c0d0", "#fabd2f", "#ff6a1f"
];
const palSwatches = [
    "#ff6fa8", "#ff5a36", "#ffa23a", "#ffe066", "#a7c080", "#6fe0b4", "#4da3ff", "#a06bff",
    "#ffffff", "#e8eef2", "#b9c7d1", "#5b6478", "#2b2f3a", "#15151b", "#2a1020", "#ffd1e3"
];

const CLICKS = ["ask", "voice", "menu", "settings", "characters", "wardrobe", "newChat", "nextCharacter", "nextSkin", "surprise", "hide", "none"];
const CLICK_LABELS = {
    ask: "Ask something", voice: "Ask by voice", menu: "Menu", settings: "Settings", characters: "Characters", wardrobe: "Wardrobe",
    newChat: "New chat", nextCharacter: "Next character", nextSkin: "Next skin", surprise: "Surprise me",
    hide: "Hide", none: "Nothing"
};

const groups = [
    // ---------------------------------------------------------------- Settings tab
    {
        title: "Pal", tab: "settings",
        items: [
            { key: "size", label: "Size", kind: "int", fallback: 88, min: 40, max: 260, step: 4, section: "Look",
              hint: "How big the pal is on the desktop, in pixels." },
            { key: "opacity", label: "Opacity", kind: "int", fallback: 100, min: 30, max: 100, step: 5, section: "Look",
              hint: "100 is solid." },
            { key: "shadow", label: "Shadow", kind: "bool", fallback: false, section: "Look",
              hint: "A soft shadow on the ground under it." },
            { key: "idle", label: "While idle", kind: "enum", fallback: "breathe", control: "tiles", section: "Life",
              options: ["breathe", "bob", "sway", "hop", "still", "wobble", "twirl", "shiver", "float", "dance", "jumpy", "heartbeat", "tilt", "flip", "boing", "drowsy"],
              labels: { breathe: "Breathe", bob: "Bob", sway: "Sway", hop: "Hop", still: "Still", wobble: "Wobble", twirl: "Twirl",
                        shiver: "Shiver", float: "Float", dance: "Dance", jumpy: "Jumpy", heartbeat: "Heartbeat",
                        tilt: "Tilt", flip: "Flip", boing: "Boing", drowsy: "Drowsy" },
              hint: "What it does when you leave it alone. Wobble squashes and stretches like jelly, Twirl turns like a coin, Shiver trembles, Float drifts slowly, Dance rocks side to side, Jumpy leaps now and then, Heartbeat pulses twice and rests, Tilt cocks its head from side to side, Flip does a somersault now and then, Boing bounces and squashes like a rubber ball, Drowsy nods off slowly and jerks awake." },
            { key: "blink", label: "Blink", kind: "bool", fallback: true, section: "Life", hint: "Now and then." },
            { key: "eyesFollow", label: "Eyes follow the mouse", kind: "bool", fallback: true, section: "Life",
              hint: "It looks at your pointer." },
            { key: "sleepAfter", label: "Fall asleep after", kind: "int", fallback: 0, min: 0, max: 120, step: 5, section: "Life",
              hint: "Minutes of quiet before it dozes off. Come near it, click it or ask it something to wake it. 0 never." },
            { key: "shuffle", label: "Surprise me", kind: "enum", fallback: "off", section: "Variety",
              options: ["off", "start", "hour", "day"],
              labels: { off: "Never", start: "At every start", hour: "Every hour", day: "Every day" },
              hint: "Picks a random character and skin by itself." },
            { key: "startHidden", label: "Start hidden", kind: "bool", fallback: false, section: "Variety",
              hint: "Show it from the bar button or Ask." }
        ]
    },
    {
        title: "Movement", tab: "settings",
        items: [
            { key: "moveMode", label: "Moves", kind: "enum", fallback: "still", control: "tiles", section: "Style",
              options: ["still", "stroll", "random", "bounce", "horizontal", "vertical", "follow", "circle", "wave", "patrol", "dart", "flee", "spiral", "figure8", "orbitmouse", "leap"],
              labels: { still: "Stays put", stroll: "Strolls", random: "Roams the screen", bounce: "Bounces (DVD)",
                        horizontal: "Left and right", vertical: "Up and down", follow: "Follows the mouse",
                        circle: "Circles", wave: "Rides a wave", patrol: "Patrols the edges", dart: "Darts about", flee: "Runs from the mouse",
                        spiral: "Spirals", figure8: "Figure eight", orbitmouse: "Orbits the mouse", leap: "Leaps about" },
              hint: "Bounces goes diagonally and turns at the screen edges, like the DVD logo. Roams picks a random spot on the screen again and again. Circles goes round and round. Rides a wave travels left and right along a sine curve. Patrols walks the edges of the screen. Darts dashes to a spot, pauses, and dashes again. Runs from the mouse keeps away from your pointer. Spirals circles with a radius that grows and shrinks. Figure eight traces an eight. Orbits the mouse circles your pointer. Leaps about jumps in arcs from spot to spot." },
            { key: "moveSpeed", label: "Speed", kind: "int", fallback: 60, min: 10, max: 600, step: 10, section: "Style",
              hint: "Pixels per second." },
            { key: "areaMargin", label: "Keep away from the edges", kind: "int", fallback: 0, min: 0, max: 300, step: 10, section: "Style",
              hint: "How far the screen's edges are kept free. Useful for a bar or a dock." },
            { key: "moveRest", label: "Rest now and then", kind: "bool", fallback: true, section: "Strolling and roaming",
              when: [{ key: "moveMode", is: ["stroll", "random", "dart", "leap"] }],
              hint: "Stops for a moment every time it arrives." },
            { key: "restSeconds", label: "Rest for about", kind: "int", fallback: 4, min: 1, max: 30, step: 1, section: "Strolling and roaming",
              when: [{ key: "moveMode", is: ["stroll", "random", "dart", "leap"] }, { key: "moveRest", is: [true] }],
              hint: "Seconds." },
            { key: "bounceAngle", label: "Starts going", kind: "enum", fallback: "diagonal", section: "Bouncing",
              options: ["diagonal", "random"], labels: { diagonal: "Straight diagonal", random: "A random angle" },
              when: [{ key: "moveMode", is: ["bounce"] }],
              hint: "The direction it sets off in." },
            { key: "bounceChange", label: "On every bounce", kind: "enum", fallback: "none", section: "Bouncing",
              options: ["none", "skin", "character"], labels: { none: "Nothing", skin: "Next skin", character: "Next character" },
              when: [{ key: "moveMode", is: ["bounce", "horizontal", "vertical"] }],
              hint: "Changes it every time it hits an edge. A corner makes it hop." },
            { key: "followDistance", label: "Keeps this far away", kind: "int", fallback: 120, min: 20, max: 500, step: 10, section: "Following",
              when: [{ key: "moveMode", is: ["follow", "flee", "orbitmouse"] }],
              hint: "Pixels between it and the pointer. When it follows, it stops this far away. When it runs from the mouse, it starts running once you are closer than this. When it orbits the mouse, it is the radius of the circle." },
            { key: "faceMovement", label: "Face where it goes", kind: "bool", fallback: true, section: "Manners",
              hint: "Turns around when it changes direction." },
            { key: "lean", label: "Lean into the move", kind: "bool", fallback: false, section: "Manners",
              hint: "Tilts a little the way it is going." },
            { key: "pauseHover", label: "Stop when the mouse is on it", kind: "bool", fallback: true, section: "Manners",
              hint: "So you can click it." },
            { key: "pauseAsking", label: "Stop while the agent works", kind: "bool", fallback: true, section: "Manners",
              hint: "And while you type a question." }
        ]
    },
    {
        title: "Controls", tab: "settings",
        items: [
            { key: "leftClick", label: "Left click", kind: "enum", fallback: "ask", control: "chips", section: "Clicks",
              options: CLICKS, labels: CLICK_LABELS },
            { key: "rightClick", label: "Right click", kind: "enum", fallback: "menu", control: "chips", section: "Clicks",
              options: CLICKS, labels: CLICK_LABELS },
            { key: "middleClick", label: "Middle click", kind: "enum", fallback: "settings", control: "chips", section: "Clicks",
              options: CLICKS, labels: CLICK_LABELS },
            { key: "draggable", label: "Drag it around", kind: "bool", fallback: true, section: "Dragging",
              hint: "Hold the left button on it and move." },
            { key: "rememberPosition", label: "Remember where it was", kind: "bool", fallback: true, section: "Dragging",
              hint: "It comes back to the same spot after a restart." },
            { key: "edgeToNextScreen", label: "Drop it at the side to change screen", kind: "bool", fallback: true, section: "Dragging",
              hint: "With several screens: let go at a screen's side edge to send it to the next one." },
            { key: "moveAcross", label: "Walk onto other monitors", kind: "bool", fallback: false, section: "Screens",
              when: [{ key: "moveMode", is: ["bounce", "horizontal", "wave", "stroll", "random", "dart"] }],
              hint: "With several monitors: when it reaches the side of a screen it goes on to the monitor next to it, and comes back the same way. Bounces, Left and right, Rides a wave carry on across; Strolls, Roams and Darts about now and then head for the next monitor. On the outer sides it turns round as usual. Monitors are taken in the order they sit from left to right." }
        ]
    },
    {
        title: "Agent", tab: "settings",
        items: [
            { key: "agent", label: "Agent", kind: "enum", fallback: "opencode", control: "tiles", section: "Agent",
              options: ["opencode", "ollama", "custom"], labels: { opencode: "opencode", ollama: "Ollama", custom: "Your command" },
              hint: "Who answers. opencode and Ollama have to be installed; your command can be anything that prints an answer." },
            { key: "agentModel", label: "Model", kind: "models", fallback: "", maxLength: 120, section: "Agent",
              hint: "Every model your providers offer. Add a provider with opencode auth login, then Refresh." },
            { key: "agentCommand", label: "Command", kind: "string", fallback: "claude -p {prompt}", maxLength: 300, section: "Agent",
              presets: ["claude -p {prompt}", "gemini -p {prompt}", "codex exec {prompt}"],
              when: [{ key: "agent", is: ["custom"] }],
              hint: "{prompt} is replaced by what you ask; without it your question goes last. It runs without a shell, so no pipes or quotes." },
            { key: "agentMode", label: "Agent mode", kind: "enum", fallback: "build", section: "How it works",
              options: ["build", "plan"], labels: { build: "Build (does the work)", plan: "Plan (only reads and suggests)" },
              when: [{ key: "agent", is: ["opencode"] }] },
            { key: "agentVariant", label: "Thinking effort", kind: "enum", fallback: "", section: "How it works",
              options: ["", "low", "medium", "high", "max"],
              labels: { "": "Model default", low: "Low", medium: "Medium", high: "High", max: "Max" },
              when: [{ key: "agent", is: ["opencode"] }],
              hint: "Only models that think support this; others ignore it." },
            { key: "agentAuto", label: "Let it act", kind: "bool", fallback: false, section: "How it works",
              when: [{ key: "agent", is: ["opencode"] }],
              hint: "Runs commands and edits files without asking. Off: anything it needs permission for is turned down, so it can only read and answer." },
            { key: "agentPrefix", label: "Always tell it", kind: "string", fallback: "", maxLength: 400, section: "How it works",
              hint: "A line put in front of every question, for example: Answer in two sentences." },
            { key: "agentStyle", label: "Answer style", kind: "enum", fallback: "normal", section: "Answers",
              options: ["normal", "short", "detailed", "steps", "simple"],
              labels: { normal: "As it likes", short: "Short", detailed: "Detailed", steps: "Step by step", simple: "Simple" },
              hint: "How answers are written. It is added as a line in front of every question, so it works with every agent." },
            { key: "agentLanguage", label: "Answer in", kind: "string", fallback: "", maxLength: 40, section: "Answers",
              presets: ["English", "Nederlands", "Français", "Deutsch", "Español", "Italiano", "Português"],
              hint: "A language for every answer, whatever language you ask in. Empty answers in the language of the question. Translate then translates into it." },
            { key: "remember", label: "Remember the conversation", kind: "bool", fallback: true, section: "Conversation",
              hint: "Follow-ups continue the same chat until New chat." },
            { key: "rememberMinutes", label: "Start a new chat after", kind: "int", fallback: 45, min: 5, max: 480, step: 5, section: "Conversation",
              when: [{ key: "remember", is: [true] }], hint: "Minutes of quiet." },
            { key: "memoryTurns", label: "Look back on", kind: "int", fallback: 4, min: 0, max: 10, step: 1, section: "Conversation",
              when: [{ key: "agent", is: ["ollama", "custom"] }, { key: "remember", is: [true] }],
              hint: "Ollama and your own command have no chat of their own, so the last few questions and answers are sent along with a follow-up. How many exchanges. 0 sends none." },
            { key: "tellWindow", label: "Tell it about the active window", kind: "bool", fallback: true, section: "Context",
              hint: "Adds the window's app, title and folder to your question." },
            { key: "tellSelection", label: "Tell it what I have selected", kind: "bool", fallback: false, section: "Context",
              hint: "Adds the text you have selected, in any app, to your question. It is read only at the moment you ask, and only up to the limit below." },
            { key: "tellClipboard", label: "Tell it what I copied", kind: "bool", fallback: false, section: "Context",
              hint: "Adds what is in the clipboard, up to the limit below, to your question." },
            { key: "contextChars", label: "Most text to send", kind: "int", fallback: 4000, min: 500, max: 20000, step: 500, section: "Context",
              hint: "Characters taken from the selection or the clipboard, for the quick actions too. More costs more tokens." },
            { key: "workIn", label: "Work in", kind: "enum", fallback: "window", control: "chips", section: "Context",
              options: ["window", "home", "folder"], labels: { window: "The active window's folder", home: "Home", folder: "A folder" },
              hint: "The active window's folder is where its terminal shell is; other apps fall back to Home." },
            { key: "workFolder", label: "Folder", kind: "string", fallback: "", maxLength: 300, section: "Context",
              when: [{ key: "workIn", is: ["folder"] }], hint: "For example ~/Projects/my-app" },
            { key: "showQuick", label: "Show quick actions", kind: "bool", fallback: true, section: "Quick actions",
              hint: "Explain, Summarize, Fix it, Translate, Reply and Shorter, under the question box. Each one works on the text you have selected, or else on what you copied." },
            { key: "quickLabel", label: "Your own: name", kind: "string", fallback: "", maxLength: 16, section: "Quick actions",
              presets: ["Proofread", "Rephrase", "Define", "Code review"],
              hint: "A seventh button of your own. Its name, up to 16 characters. It needs the prompt below too." },
            { key: "quickPrompt", label: "Your own: what to do", kind: "string", fallback: "", maxLength: 300, section: "Quick actions",
              presets: ["Proofread this and list the fixes:", "Rephrase this more politely:", "Define the terms in this:", "Review this code and point out bugs:"],
              hint: "What the button asks. The selected or copied text is put after it. From a terminal: quick custom." },
            { key: "copyAnswer", label: "Copy the answer when it is ready", kind: "bool", fallback: false, section: "When an answer is ready",
              hint: "Puts the finished answer on the clipboard, ready to paste. It needs wl-copy (the wl-clipboard package)." },
            { key: "notifyDone", label: "Notify me when an answer is ready", kind: "bool", fallback: false, section: "When an answer is ready",
              hint: "A desktop notification when the agent has finished, for the long ones you walk away from." },
            { key: "notifyAfter", label: "Only if it took longer than", kind: "int", fallback: 0, min: 0, max: 300, step: 5, section: "When an answer is ready",
              when: [{ key: "notifyDone", is: [true] }],
              hint: "Seconds. A quick answer you were already looking at needs no notification. 0 always notifies." },
            { key: "agentTimeout", label: "Give up after", kind: "int", fallback: 300, min: 30, max: 1800, step: 30, section: "Limits",
              hint: "Seconds." },
            { key: "agentRetries", label: "Try again when it fails", kind: "int", fallback: 0, min: 0, max: 3, step: 1, section: "Limits",
              hint: "How many more times to ask when the agent stops with an error, for a provider that now and then drops out. A run you stop, a timeout and a missing agent are not tried again. 0 never." },
            { key: "voice", label: "Ask by voice", kind: "enum", fallback: "off", control: "chips", section: "Voice",
              options: ["off", "hex"], labels: { off: "Off", hex: "Hex" },
              hint: "Speak your question. Hex (anoma.ly/hex) is local voice dictation: Pawmpt tells it to start and stop recording and sends what you said. Install and set up Hex first, and keep it running. Then use Ask by voice on a click, the mic in the question box, or: omarchy-shell io.github.qempexe.pawmpt voice." },
            { key: "voiceSend", label: "Send when I stop speaking", kind: "bool", fallback: true, section: "Voice",
              when: [{ key: "voice", is: ["hex"] }],
              hint: "Off puts what you said in the question box, so you can read and change it before you press Enter." },
            { key: "voiceMaxSeconds", label: "Stop listening after", kind: "int", fallback: 30, min: 5, max: 120, step: 5, section: "Voice",
              when: [{ key: "voice", is: ["hex"] }],
              hint: "Seconds. If you forget to stop, it stops and sends for you." },
            { key: "voiceCommand", label: "Hex command", kind: "string", fallback: "hex", maxLength: 120, section: "Voice",
              presets: ["hex", "~/.local/bin/hex"], when: [{ key: "voice", is: ["hex"] }],
              hint: "How to run Hex, if it is not on the PATH. ~/.local/bin/hex is looked at when hex is not found." }
        ]
    },
    {
        title: "Bubble", tab: "settings",
        items: [
            { key: "bubbleWidth", label: "Width", kind: "int", fallback: 340, min: 200, max: 700, step: 10, section: "Speech bubble",
              hint: "Pixels." },
            { key: "bubbleFont", label: "Text size", kind: "int", fallback: 13, min: 10, max: 22, step: 1, section: "Speech bubble",
              hint: "Pixels." },
            { key: "bubbleSeconds", label: "Close after", kind: "int", fallback: 0, min: 0, max: 60, step: 5, section: "Speech bubble",
              hint: "Seconds. 0 keeps the answer until you close it." },
            { key: "bubblePlace", label: "Opens", kind: "enum", fallback: "auto", section: "Speech bubble",
              options: ["auto", "above", "below"], labels: { auto: "Where there is room", above: "Above it", below: "Below it" } },
            { key: "showActivity", label: "Show what it is doing", kind: "bool", fallback: true, section: "Details",
              hint: "The steps while it works: › bash: git status" },
            { key: "showUsage", label: "Show tokens and folder", kind: "bool", fallback: true, section: "Details",
              hint: "The small line under an answer." },
            { key: "showFollowUps", label: "Follow-up buttons", kind: "bool", fallback: true, section: "Details",
              hint: "Go on and Simpler, under an answer, to carry on the chat in one click. They show when the conversation is remembered." }
        ]
    },
    {
        title: "Colors", tab: "settings",
        items: [
            { key: "colorMode", label: "Colors", kind: "enum", fallback: "theme", control: "scheme", section: "Scheme",
              options: ["theme", "borders", "custom", "monochrome"],
              labels: { theme: "Follow theme", borders: "Window borders", custom: "Custom", monochrome: "Monochrome" },
              hint: "The colors of this panel and the speech bubble. Follow theme matches your Omarchy theme live. Window borders takes the accent from your theme's window border. Monochrome removes every hue." },
            { key: "customColors", label: "Custom colors", kind: "palette", section: "Scheme",
              fallback: { customBg: "#141414", customFg: "#e0e0e0", accentColor: "#d4a35a" },
              targets: [{ key: "customBg", label: "Background" }, { key: "customFg", label: "Text" }, { key: "accentColor", label: "Accent" }],
              presets: swatches,
              hint: "Choose Background, Text or Accent, then pick a swatch or type a hex.",
              when: [{ key: "colorMode", is: ["custom"] }] },
            { key: "textColor", label: "Text", kind: "enum", fallback: "auto", section: "Text",
              options: ["auto", "theme", "custom"], labels: { auto: "Always readable", theme: "Theme", custom: "My text color" },
              when: [{ key: "colorMode", is: ["theme", "borders"] }],
              hint: "Always readable keeps your theme's text color and switches to black or white when it would be hard to read." }
        ]
    },
    {
        title: "Appearance", tab: "settings",
        items: [
            { key: "cardStyle", label: "Row style", kind: "enum", fallback: "soft", control: "tiles",
              options: ["soft", "outline", "flat"], labels: { soft: "Soft", outline: "Outline", flat: "Flat" },
              hint: "Soft fills the rows lightly, outline draws a border only, flat has neither." },
            { key: "density", label: "Spacing", kind: "enum", fallback: "comfortable", control: "tiles",
              options: ["compact", "comfortable", "spacious"], labels: { compact: "Compact", comfortable: "Comfortable", spacious: "Spacious" },
              hint: "How much air there is between things." },
            { key: "cornerRadius", label: "Roundness", kind: "int", fallback: 4, min: 0, max: 20, step: 2,
              hint: "0 is square, 20 is very round." },
            { key: "fontScale", label: "Text size", kind: "int", fallback: 100, min: 80, max: 150, step: 5, divisor: 100, decimals: 2,
              hint: "1 is normal, 1.25 is a quarter bigger." }
        ]
    },
    {
        title: "Window", tab: "settings",
        items: [
            { key: "windowWidth", label: "Panel width", kind: "int", fallback: 560, min: 440, max: 1000, step: 20, section: "Size",
              hint: "How wide the bar panel and the window are." },
            { key: "windowHeight", label: "Panel height", kind: "int", fallback: 680, min: 460, max: 1100, step: 20, section: "Size",
              hint: "How tall." },
            { key: "openAs", label: "Open as", kind: "enum", fallback: "panel", control: "tiles", section: "Layout",
              options: ["panel", "window"], labels: { panel: "Bar panel", window: "Own window" },
              hint: "Where the bar button opens Pawmpt. You can always pop it out or dock it back from the header." },
            { key: "frame", label: "Window outline", kind: "bool", fallback: false, section: "Look",
              hint: "Draw the edge in your window border's colors instead of a plain neutral line." },
            { key: "frameGradient", label: "Outline gradient", kind: "bool", fallback: true, section: "Look",
              when: [{ key: "frame", is: [true] }],
              hint: "Use the window border's whole gradient, at its angle, when it has more than one color." },
            { key: "frameColor", label: "Outline color", kind: "enum", fallback: "accent", section: "Look",
              options: ["accent", "first", "middle", "last"],
              labels: { accent: "Accent", first: "Border's first", middle: "Border's middle", last: "Border's last" },
              when: [{ key: "frame", is: [true] }],
              hint: "The one color the outline takes when it isn't a gradient." },
            { key: "surfaceTint", label: "Window tint", kind: "int", fallback: 0, min: 0, max: 30, step: 2, section: "Look",
              hint: "How much of the accent washes over the background. 0 keeps it plain." },
            { key: "winOpacity", label: "Window opacity", kind: "int", fallback: 97, min: 50, max: 100, step: 1, section: "Look",
              hint: "100 is solid." }
        ]
    },
    {
        title: "Bar", tab: "settings",
        items: [
            { key: "barShows", label: "Bar button shows", kind: "enum", fallback: "pal", section: "Button",
              options: ["pal", "icon"], labels: { pal: "A tiny copy of your pal", icon: "An icon" } },
            { key: "barLeft", label: "Left click", kind: "enum", fallback: "toggle", control: "chips", section: "Button",
              options: ["toggle", "panel", "wardrobe", "ask", "voice", "none"],
              labels: { toggle: "Show or hide the pal", panel: "Open Pawmpt", wardrobe: "Open the wardrobe", ask: "Ask something", voice: "Ask by voice", none: "Nothing" } },
            { key: "barMiddle", label: "Middle click", kind: "enum", fallback: "ask", control: "chips", section: "Button",
              options: ["toggle", "panel", "wardrobe", "ask", "voice", "none"],
              labels: { toggle: "Show or hide the pal", panel: "Open Pawmpt", wardrobe: "Open the wardrobe", ask: "Ask something", voice: "Ask by voice", none: "Nothing" } },
            { key: "barRight", label: "Right click", kind: "enum", fallback: "panel", control: "chips", section: "Button",
              options: ["toggle", "panel", "wardrobe", "ask", "voice", "none"],
              labels: { toggle: "Show or hide the pal", panel: "Open Pawmpt", wardrobe: "Open the wardrobe", ask: "Ask something", voice: "Ask by voice", none: "Nothing" } }
        ]
    },
    // ---------------------------------------------------------------- Wardrobe tab
    {
        title: "Skin", tab: "wardrobe",
        items: [
            { key: "palTheme", label: "Use the theme's colors", kind: "bool", fallback: false, section: "Colors", skin: true,
              hint: "Body, eyes and details follow your Omarchy theme, live. Picking a color yourself puts the theme's colors in its place to start from." },
            { key: "palColors", label: "Main colors", kind: "palette", section: "Colors",
              fallback: { palBody: "#ff6fa8", palEye: "#2a1020", palAccent: "#ffd1e3" },
              targets: [{ key: "palBody", label: "Body" }, { key: "palEye", label: "Eyes" }, { key: "palAccent", label: "Details" }],
              presets: palSwatches, skin: true,
              hint: "Details are the cheeks, ears, belly and so on. Used exactly as you pick them." },
            { key: "palColors2", label: "More colors", kind: "palette", section: "Colors",
              fallback: { palBody2: "#c4457a", palOutline: "#2a1020", palPattern: "#ffffff" },
              targets: [{ key: "palBody2", label: "Second body" }, { key: "palOutline", label: "Outline" }, { key: "palPattern", label: "Pattern" }],
              presets: palSwatches, skin: true,
              hint: "The second body color is for the fills below; the outline and the pattern have their own switches." },
            { key: "bodyFill", label: "Body fill", kind: "enum", fallback: "flat", control: "tiles", section: "Body", skin: true,
              options: ["flat", "vertical", "radial"], labels: { flat: "One color", vertical: "Top to bottom", radial: "Centre to edge" },
              hint: "The two body colors blend." },
            { key: "pattern", label: "Pattern", kind: "enum", fallback: "none", section: "Body", skin: true,
              options: ["none", "spots", "stripes", "stars", "hearts"],
              labels: { none: "None", spots: "Spots", stripes: "Stripes", stars: "Stars", hearts: "Hearts" } },
            { key: "patternSize", label: "Pattern size", kind: "int", fallback: 100, min: 50, max: 200, step: 10, section: "Body", skin: true,
              when: [{ key: "pattern", is: ["spots", "stripes", "stars", "hearts"] }], hint: "Percent." },
            { key: "outlineWidth", label: "Outline", kind: "int", fallback: 0, min: 0, max: 6, step: 1, section: "Body", skin: true,
              hint: "A line around the pal in the outline color. 0 has none." },
            { key: "glow", label: "Glow", kind: "int", fallback: 0, min: 0, max: 60, step: 5, section: "Body", skin: true,
              hint: "A soft glow around it in the details color." },
            { key: "shine", label: "Shine", kind: "bool", fallback: true, section: "Face", skin: true,
              hint: "The little white highlight on the body of the round characters. It is not the glow: the glow is the soft light outside the pal, the shine is a spot on it, so you can use both or either." },
            { key: "blush", label: "Blush", kind: "bool", fallback: true, section: "Face", skin: true,
              hint: "Cheeks, in the details color." },
            { key: "eyeStyle", label: "Eyes", kind: "enum", fallback: "normal", section: "Face", skin: true,
              options: ["normal", "round", "wide", "sleepy", "happy", "sparkle", "dots", "real", "angry", "slit", "hearts", "stars", "cross", "lashes"],
              labels: { normal: "Normal", round: "Round", wide: "Wide", sleepy: "Sleepy", happy: "Happy", sparkle: "Sparkly", dots: "Dots", real: "Realistic", angry: "Angry", slit: "Cat slit", hearts: "Hearts", stars: "Stars", cross: "Crossed", lashes: "Lashes" } },
            { key: "mouthStyle", label: "Mouth", kind: "enum", fallback: "smile", section: "Face", skin: true,
              options: ["smile", "open", "cat", "flat", "fang", "none", "real", "grin", "tongue", "smirk", "wavy", "pout"],
              labels: { smile: "Smile", open: "Open", cat: "Cat", flat: "Flat", fang: "Fang", none: "None", real: "Realistic", grin: "Grin", tongue: "Tongue out", smirk: "Smirk", wavy: "Wavy", pout: "Pout" } }
        ]
    },
    // ---------------------------------------------------------------- kept, never drawn as rows
    {
        title: "Core", tab: "none",
        items: [
            { key: "character", label: "Character", kind: "string", fallback: "blob", maxLength: 120 },
            { key: "skin", label: "Skin", kind: "string", fallback: "Bubblegum", maxLength: 24 }
        ]
    }
];

// palette rows store their target keys (palBody...), not their own key
const colorKeys = {};

const defaults = (function() {
    const d = {};
    for (let gi = 0; gi < groups.length; gi++) {
        const items = groups[gi].items;
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.kind === "palette") {
                for (let t = 0; t < it.targets.length; t++) {
                    d[it.targets[t].key] = it.fallback[it.targets[t].key];
                    colorKeys[it.targets[t].key] = it.fallback[it.targets[t].key];
                }
            } else d[it.key] = it.fallback;
        }
    }
    return d;
})();

const itemByKey = (function() {
    const m = {};
    for (let gi = 0; gi < groups.length; gi++)
        for (let i = 0; i < groups[gi].items.length; i++) m[groups[gi].items[i].key] = groups[gi].items[i];
    return m;
})();

// the keys that make up a skin
const skinKeys = (function() {
    const out = [];
    for (let gi = 0; gi < groups.length; gi++)
        for (let i = 0; i < groups[gi].items.length; i++) {
            const it = groups[gi].items[i];
            if (!it.skin) continue;
            if (it.kind === "palette") for (let t = 0; t < it.targets.length; t++) out.push(it.targets[t].key);
            else out.push(it.key);
        }
    return out;
})();

function validHex(s) { return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(s)); }

// one value, made safe: a known option, a whole number in range, a real boolean, a hex
// color, or plain text that is not too long. Anything else is the default.
function clean(key, v) {
    if (colorKeys[key] !== undefined) return validHex(v) ? String(v).toLowerCase() : colorKeys[key];
    const it = itemByKey[key];
    if (!it) return undefined;
    if (v === null || v === undefined) return it.fallback;
    switch (it.kind) {
    case "enum":
        return it.options.indexOf(String(v)) >= 0 ? String(v) : it.fallback;
    case "int": {
        const n = typeof v === "number" ? v : (typeof v === "string" && /^-?[0-9]{1,7}$/.test(v) ? parseInt(v, 10) : NaN);
        return isFinite(n) ? Math.max(it.min, Math.min(it.max, Math.round(n))) : it.fallback;
    }
    case "bool":
        if (v === true || v === "true") return true;
        if (v === false || v === "false") return false;
        return it.fallback;
    default: {
        if (typeof v !== "string") return it.fallback;
        return v.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, it.maxLength || 64);
    }
    }
}

function resolve(values) {
    const out = {};
    const src = values && typeof values === "object" ? values : {};
    for (const k in defaults) out[k] = clean(k, src[k]);
    return out;
}

function isSetting(key) { return defaults[key] !== undefined; }

// ---- helpers for the settings views --------------------------------------------------------
function groupTitles(tab) {
    const out = [];
    for (let i = 0; i < groups.length; i++) if (groups[i].tab === tab) out.push(groups[i].title);
    return out;
}

// the rows of a group, split under their section headings, in order
function sections(title) {
    let g = null;
    for (let i = 0; i < groups.length; i++) if (groups[i].title === title) g = groups[i];
    if (!g) return [];
    const out = [], byName = {};
    for (let j = 0; j < g.items.length; j++) {
        const name = g.items[j].section || "";
        if (byName[name] === undefined) { byName[name] = out.length; out.push({ title: name, items: [] }); }
        out[byName[name]].items.push(g.items[j]);
    }
    return out;
}

// every key that belongs to a tab (palette rows count by their targets)
function keysOf(tab) {
    const out = [];
    for (let gi = 0; gi < groups.length; gi++) {
        if (groups[gi].tab !== tab) continue;
        for (let i = 0; i < groups[gi].items.length; i++) {
            const it = groups[gi].items[i];
            if (it.kind === "palette") for (let t = 0; t < it.targets.length; t++) out.push(it.targets[t].key);
            else out.push(it.key);
        }
    }
    return out;
}

// how many settings of a tab differ from their defaults
function countChanged(cfg, tab) {
    let n = 0;
    for (let gi = 0; gi < groups.length; gi++) {
        if (groups[gi].tab !== tab) continue;
        for (let i = 0; i < groups[gi].items.length; i++) {
            const it = groups[gi].items[i];
            if (it.kind === "palette") {
                for (let t = 0; t < it.targets.length; t++) { const k = it.targets[t].key; if (cfg[k] !== it.fallback[k]) { n++; break; } }
            } else if (cfg[it.key] !== it.fallback) n++;
        }
    }
    return n;
}

// ---- helpers for the panel: what changed, putting it back, and the search -----------------------
// the keys one row stands for (a palette row is several colors)
function itemKeys(it) {
    if (it.kind !== "palette") return [it.key];
    const out = [];
    for (let t = 0; t < it.targets.length; t++) out.push(it.targets[t].key);
    return out;
}
// does this row differ from its default?
function isChanged(cfg, it) {
    const ks = itemKeys(it);
    for (let i = 0; i < ks.length; i++) if (cfg[ks[i]] !== defaults[ks[i]]) return true;
    return false;
}
function groupByTitle(title) {
    for (let i = 0; i < groups.length; i++) if (groups[i].title === title) return groups[i];
    return null;
}
// which tab a group is on (settings or wardrobe), "" if there is none
function groupTab(title) { const g = groupByTitle(title); return g && g.tab !== "none" ? g.tab : ""; }
// the page a group is shown as: the skin settings are the Customize page of the wardrobe
function pageName(title) { return title === "Skin" ? "Customize" : title; }
function groupOfPage(page) { return page === "Customize" ? "Skin" : page; }
// how many rows of a group differ from their defaults
function changedIn(cfg, title) {
    const g = groupByTitle(title);
    let n = 0;
    if (!g) return 0;
    for (let i = 0; i < g.items.length; i++) if (isChanged(cfg, g.items[i])) n++;
    return n;
}
// every key of a group, to put it back
function keysOfGroup(title) {
    const g = groupByTitle(title), out = [];
    if (!g) return out;
    for (let i = 0; i < g.items.length; i++) {
        const ks = itemKeys(g.items[i]);
        for (let j = 0; j < ks.length; j++) out.push(ks[j]);
    }
    return out;
}
// the rows (of these tabs) that match every word of a query, looking at the label, the hint,
// the names of the options, the group and the section. [{ group, section, item }]
function search(query, tabs) {
    const words = String(query || "").toLowerCase().split(/\s+/).filter(function(w) { return w !== ""; });
    const out = [];
    if (words.length === 0) return out;
    for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        if (tabs.indexOf(g.tab) < 0) continue;
        for (let i = 0; i < g.items.length; i++) {
            const it = g.items[i];
            const names = [];
            if (it.labels) for (let k in it.labels) names.push(it.labels[k]);
            if (it.kind === "palette") for (let t = 0; t < it.targets.length; t++) names.push(it.targets[t].label);
            const hay = [pageName(g.title), it.section || "", it.label, it.hint || "", names.join(" ")].join(" ").toLowerCase();
            let ok = true;
            for (let w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) { ok = false; break; }
            if (ok) out.push({ group: g.title, section: it.section || "", item: it });
            if (out.length >= 60) return out;
        }
    }
    return out;
}

// ---- settings saved by Pawmpt 1.0 ------------------------------------------------------------
function needsMigrate(v) {
    return !!v && (v.body !== undefined || v.eye !== undefined || v.accent !== undefined || v.wander !== undefined
        || v.wanderSpeed !== undefined || v.flipWhenWalking !== undefined);
}
function migrateSkin(s) {
    const o = {};
    for (let k in s) o[k] = s[k];
    if (s.body !== undefined) { o.palBody = s.body; delete o.body; }
    if (s.eye !== undefined) { o.palEye = s.eye; delete o.eye; }
    if (s.accent !== undefined) { o.palAccent = s.accent; delete o.accent; }
    return o;
}
function migrate(v) {
    let o = {};
    for (let k in v) o[k] = v[k];
    o = migrateSkin(o);
    if (v.wander === true && o.moveMode === undefined) o.moveMode = "stroll";
    if (v.wanderSpeed !== undefined && o.moveSpeed === undefined) o.moveSpeed = v.wanderSpeed;
    if (v.flipWhenWalking !== undefined && o.faceMovement === undefined) o.faceMovement = v.flipWhenWalking;
    delete o.wander; delete o.wanderSpeed; delete o.flipWhenWalking;
    if (Array.isArray(o.skins)) o.skins = o.skins.map(function(s) { return s && typeof s === "object" ? migrateSkin(s) : s; });
    return o;
}

if (typeof module !== "undefined") module.exports = { groups: groups, defaults: defaults, clean: clean, resolve: resolve, skinKeys: skinKeys, migrate: migrate };
