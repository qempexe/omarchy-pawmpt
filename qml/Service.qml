import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons as Commons
import "js/Skins.js" as Skins
import "js/Schema.js" as Schema
import "js/Theme.js" as Theme
import "js/Prompt.js" as Prompt
import "js/Voice.js" as Voice
import "js/Registry.js" as Registry

// Pawmpt's shared state: the settings (saved in ~/.config/pawmpt/settings.json, every one of
// them described in Schema.js), the skins and what the pal wears, the characters you added
// (pictures in ~/.config/pawmpt/characters, in folders for categories), and the agent that
// answers what you ask.
Item {
    id: root

    readonly property string version: "1.0.2"
    readonly property string home: Quickshell.env("HOME") || ("/home/" + Quickshell.env("USER"))
    readonly property string configDir: (Quickshell.env("XDG_CONFIG_HOME") || home + "/.config") + "/pawmpt"
    readonly property string charactersDir: configDir + "/characters"
    // settings, saved skins and what it wears live in the state folder; the characters stay in the
    // config folder, and 1.0's settings are read once
    readonly property string stateDir: (Quickshell.env("XDG_STATE_HOME") || home + "/.local/state") + "/omarchy-pawmpt"
    // This plugin used to be called Omapal. What it saved under that name is read once and moved over.
    readonly property string oldConfigDir: (Quickshell.env("XDG_CONFIG_HOME") || home + "/.config") + "/omapal"
    readonly property string oldStateDir: (Quickshell.env("XDG_STATE_HOME") || home + "/.local/state") + "/omarchy-omapal"

    readonly property var defaults: Schema.defaults

    property var settings: Schema.resolve({})
    property var skins: []                  // skins you saved: { name, <skin settings>, dress }
    property var pals: []                   // pals you saved, whole: { name, character, skin, <skin settings>, dress }
    property var dress: []                  // what the pal wears: [{ id, color, size, dy }]
    property double lastShuffle: 0
    property var palPos: ({})               // where the pal was: { screen, fx, fy } as fractions of its screen
    property bool loaded: false
    property bool shown: true
    property bool settingsOpen: false
    property string panelTab: "settings"    // settings or wardrobe
    property string surface: "panel"        // where the panel is open now: "panel" (by the bar) or "window"
    property bool barPanelReady: false      // BarWidget.qml sets it once Panel.qml has loaded
    // Set only by the header's Pop out and Dock. Until then Settings > Window > Open as decides where
    // the panel opens, every time, so a change there takes effect at once.
    property bool userPicked: false
    property var customCharacters: []       // paths in charactersDir, like "Anime/neko.png"

    signal askRequested()
    signal menuRequested()
    signal bounced(bool corner)             // a bounce off a screen edge, from Pal.qml

    // ---- the colors of the current skin ---------------------------------------------------
    readonly property bool themeSkin: settings.palTheme === true
    // the look to draw for any set of skin settings: the current ones, a saved skin, a saved pal
    function optsOf(src) {
        const t = src.palTheme === true
        return {
            body: t ? String(Commons.Color.accent) : src.palBody,
            body2: t ? String(Commons.Color.accent) : src.palBody2,
            eye: t ? String(Commons.Color.background) : src.palEye,
            accent: t ? String(Commons.Color.foreground) : src.palAccent,
            outline: src.palOutline,
            outlineWidth: src.outlineWidth,
            pattern: src.pattern,
            patternColor: src.palPattern,
            patternSize: src.patternSize,
            fill: src.bodyFill,
            glow: src.glow,
            shine: src.shine,
            blush: src.blush,
            eyeStyle: src.eyeStyle,
            mouthStyle: src.mouthStyle
        }
    }
    readonly property var skinOpts: optsOf(settings)
    readonly property color bodyColor: skinOpts.body
    readonly property color eyeColor: skinOpts.eye
    readonly property color accentColor: skinOpts.accent

    // ---- the look of the panel and the speech bubble (the Colors and Appearance settings) ---------
    function lum(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b }
    function gray(c) { const l = lum(c); return Qt.rgba(l, l, l, c.a) }
    function mix(a, b, f) { return Qt.rgba(a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f, 1) }
    readonly property string colorMode: settings.colorMode
    readonly property color uiBg: {
        const c = colorMode === "custom" ? Qt.color(settings.customBg) : Commons.Color.popups.background
        return colorMode === "monochrome" ? gray(c) : c
    }
    readonly property color uiAccent: {
        const c = colorMode === "custom" ? Qt.color(settings.accentColor)
            : colorMode === "borders" ? Commons.Color.popups.border : Commons.Color.accent
        return colorMode === "monochrome" ? gray(c) : c
    }
    readonly property color uiFg: {
        let c = colorMode === "custom" ? Qt.color(settings.customFg) : Commons.Color.popups.text
        const textMode = colorMode === "custom" ? "theme" : settings.textColor
        if (textMode === "custom") c = Qt.color(settings.customFg)
        if (textMode === "auto" && Math.abs(lum(c) - lum(uiBg)) < 0.35) c = lum(uiBg) > 0.5 ? "#111111" : "#f2f2f2"
        return colorMode === "monochrome" ? gray(c) : c
    }
    readonly property color uiLine: Qt.rgba(uiFg.r, uiFg.g, uiFg.b, 0.14)
    readonly property color uiSurface: mix(uiBg, settings.surfaceTint > 0 ? uiAccent : uiFg, settings.surfaceTint > 0 ? settings.surfaceTint / 100 : 0.05)
    readonly property real uiScale: settings.fontScale / 100
    readonly property real uiRadius: settings.cornerRadius
    readonly property real uiGap: settings.density === "compact" ? 6 : settings.density === "spacious" ? 14 : 10

    // ---- the panel's window: its state, and the colors it takes from the bar and the theme ----------
    // BarWidget.qml hands in the bar's own colors and font. With no bar button, the shell's palette is used.
    property color barFg: Commons.Color.foreground
    property color barBg: Commons.Color.background
    property string barFont: ""
    readonly property string fontName: barFont !== "" ? barFont : Commons.Style.font.family

    // The shell theme's accent, tried under a few likely names. Unknown names are skipped, and with
    // none found the panel falls back to the text color.
    function themeColor(names) {
        for (const name of names) {
            let raw
            try { raw = Commons.Color[name] } catch (e) { raw = undefined }
            if (raw === undefined || raw === null) continue
            try {
                const c = Qt.color(raw)
                if (c && c.valid !== false) return c
            } catch (e2) { }
        }
        return null
    }
    readonly property var shellAccent: themeColor(["accent", "primary", "highlight", "accentColor", "color4", "blue"])

    // One UiState feeds the bar panel and the window, so the tab and the search survive popping out
    // and docking back.
    UiState {
        id: uiState
        service: root
        store: root
        cfg: root.settings
        opened: root.settingsOpen
        popped: root.surface === "window"
        barFg: root.barFg
        barBg: root.barBg
        fontName: root.fontName
        themeAccent: root.shellAccent ? root.shellAccent : "transparent"
        onPopOutRequested: root.popOut()
        onDockRequested: root.dock()
        onCloseRequested: root.closeSettings()
    }
    readonly property var ux: uiState
    function setTab(name) { panelTab = name === "wardrobe" ? "wardrobe" : "settings" }

    // opening a link: only plain https addresses, through xdg-open
    function openUrl(url) {
        const u = String(url || "")
        if (!/^https:\/\/[A-Za-z0-9.-]+(\/[A-Za-z0-9._~%!$&'()*+,;=:@\/?#-]*)?$/.test(u) || u.length > 300) return
        opener.command = ["xdg-open", u]
        opener.running = true
    }
    Process { id: opener }

    function readText(fv) {
        try { return String(typeof fv.text === "function" ? fv.text() : fv.text) } catch (e) { return "" }
    }

    // ---- the theme's window border ----------------------------------------------------------------
    // For the Window borders color scheme and the window outline: the active border's colors and
    // angle, from the theme's hyprland.lua (or .conf, or the line some themes keep in colors.toml).
    // Only #rrggbb values and an angle are taken from these files.
    property var tomlBorder: ({ colors: [], angle: 0 })
    property var luaBorder: ({ colors: [], angle: 0 })
    property var confBorder: ({ colors: [], angle: 0 })
    property bool luaMissing: false
    readonly property var borderColors: luaBorder.colors.length > 0 ? luaBorder.colors
        : (confBorder.colors.length > 0 ? confBorder.colors : tomlBorder.colors)
    readonly property real borderAngle: luaBorder.colors.length > 0 ? luaBorder.angle
        : (confBorder.colors.length > 0 ? confBorder.angle : tomlBorder.angle)
    readonly property string themeDir: {
        try { return Commons.Color.currentThemePath ? String(Commons.Color.currentThemePath) : "" } catch (e) { return "" }
    }

    FileView {
        id: paletteFile
        path: root.themeDir !== "" ? root.themeDir + "/colors.toml" : ""
        watchChanges: true
        onFileChanged: reload()
        onLoaded: root.tomlBorder = Theme.parseBorder(root.readText(paletteFile))
        onLoadFailed: { root.tomlBorder = ({ colors: [], angle: 0 }); root.retryTheme() }
    }
    FileView {
        id: borderLua
        path: root.themeDir !== "" ? root.themeDir + "/hyprland.lua" : ""
        watchChanges: true
        onFileChanged: reload()
        onLoaded: { root.luaMissing = false; root.luaBorder = Theme.parseBorder(root.readText(borderLua)) }
        onLoadFailed: { root.luaBorder = ({ colors: [], angle: 0 }); root.luaMissing = true }
    }
    FileView {
        id: borderConf
        // only looked at when the theme has no hyprland.lua
        path: root.themeDir !== "" && root.luaMissing ? root.themeDir + "/hyprland.conf" : ""
        watchChanges: true
        onFileChanged: reload()
        onPathChanged: if (path === "") root.confBorder = ({ colors: [], angle: 0 })
        onLoaded: root.confBorder = Theme.parseBorder(root.readText(borderConf))
        onLoadFailed: root.confBorder = ({ colors: [], angle: 0 })
    }
    // A theme switch replaces the theme folder, so for a moment the files are gone and the watch can
    // lose track of them: read them again shortly after, a few times at most.
    property int themeTries: 0
    function retryTheme() { if (themeTries < 3) { themeTries++; themeRetry.restart() } }
    Timer {
        id: themeRetry
        interval: 800
        onTriggered: { paletteFile.reload(); borderLua.reload(); borderConf.reload() }
    }
    Connections {
        target: Commons.Color
        ignoreUnknownSignals: true
        function onAccentChanged() { root.themeTries = 0; themeRetry.restart() }
        function onBackgroundChanged() { root.themeTries = 0; themeRetry.restart() }
    }

    // ---- clipboard paste (capped, no shell) -------------------------------------------------------
    // Pasting into a text field never reads the clipboard on the UI thread. wl-paste runs directly
    // (no shell) and its output is read in chunks. Reading stops as soon as 1024 bytes are in, or
    // after 2 seconds, and the process is stopped. The text is then sent back through `pasted`,
    // addressed to the field that asked.
    property string pasteKey: ""
    property string pasteBuf: ""
    readonly property int pasteMax: 1024
    signal pasted(string key, string text)

    function requestPaste(key) {
        if (pasteKey !== "" || pasteProc.running) return   // one paste at a time
        pasteKey = key
        pasteBuf = ""
        pasteProc.running = true
        pasteKill.restart()
    }
    function finishPaste() {
        const k = pasteKey
        if (k === "") return                              // already delivered
        pasteKey = ""
        pasteKill.stop()
        const text = pasteBuf.slice(0, pasteMax)
        pasteBuf = ""
        if (pasteProc.running) pasteProc.running = false  // stop reading the clipboard
        root.pasted(k, text)
    }
    Timer { id: pasteKill; interval: 2000; onTriggered: root.finishPaste() }
    Process {
        id: pasteProc
        running: false
        command: ["wl-paste", "--no-newline", "--type", "text"]
        stdout: SplitParser {
            splitMarker: ""
            onRead: function(data) {
                if (root.pasteBuf.length >= root.pasteMax) return
                root.pasteBuf += data
                if (root.pasteBuf.length >= root.pasteMax) root.finishPaste()
            }
        }
        onExited: root.finishPaste()
    }

    // ---- changing settings -------------------------------------------------------------------
    // The colors of the Omarchy theme as a skin has them: body, second body, eyes, details.
    function hex(c) {
        const q = Qt.color(c)
        const h = (v) => ("0" + Math.round(v * 255).toString(16)).slice(-2)
        return "#" + h(q.r) + h(q.g) + h(q.b)
    }
    function themeColors() {
        return { palBody: hex(Commons.Color.accent), palBody2: hex(Commons.Color.accent),
                 palEye: hex(Commons.Color.background), palAccent: hex(Commons.Color.foreground) }
    }
    readonly property var themedKeys: ["palBody", "palBody2", "palEye", "palAccent"]
    // Leaving the theme's colors (a color picked, or the switch turned off) keeps what they are now.
    function leavingTheme(values) {
        if (settings.palTheme !== true) return false
        if (values.palTheme === false) return true
        for (let i = 0; i < themedKeys.length; i++) if (values[themedKeys[i]] !== undefined) return true
        return false
    }
    function set(key, value) {
        const v = {}
        v[key] = value
        setMany(v)
    }
    function setMany(values) {
        if (!values) return
        const s = Object.assign({}, settings)
        if (leavingTheme(values)) { Object.assign(s, themeColors()); s.palTheme = false }
        let skinTouched = false
        for (const k in values) {
            if (!Schema.isSetting(k)) continue
            s[k] = Schema.clean(k, values[k])
            if (Schema.skinKeys.indexOf(k) >= 0) skinTouched = true
        }
        if (skinTouched) s.skin = "Custom"
        settings = s
        saveTimer.restart()
    }
    // puts back the settings of a tab (or all of them), keeping your skins and what it wears
    function resetTab(tab) {
        const keys = tab ? Schema.keysOf(tab) : Object.keys(Schema.defaults)
        const s = Object.assign({}, settings)
        for (let i = 0; i < keys.length; i++) s[keys[i]] = Schema.defaults[keys[i]]
        if (!tab || tab === "wardrobe") { s.skin = "Custom"; dress = [] }
        settings = s
        saveTimer.restart()
    }

    // ---- skins -----------------------------------------------------------------------------------
    function allSkins() { return Skins.presets.concat(skins) }
    function skinByName(name) {
        const p = Skins.preset(name)
        if (p) return p
        for (let i = 0; i < skins.length; i++) if (skins[i].name === name) return skins[i]
        return null
    }
    function isPreset(name) { return Skins.preset(name) !== null }
    function applySkin(name) {
        const p = skinByName(name)
        if (!p) return
        const s = Object.assign({}, settings)
        for (let i = 0; i < Schema.skinKeys.length; i++) s[Schema.skinKeys[i]] = Schema.defaults[Schema.skinKeys[i]]
        for (let i = 0; i < Schema.skinKeys.length; i++) {
            const k = Schema.skinKeys[i]
            if (p[k] !== undefined) s[k] = Schema.clean(k, p[k])
        }
        s.skin = name
        settings = s
        if (Array.isArray(p.dress)) dress = Skins.cleanDress(p.dress)
        saveTimer.restart()
    }
    function saveSkin(name, withDress) {
        name = String(name || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 24)
        if (!name || Skins.preset(name) || name === "Custom") return false
        const k = { name: name }
        for (let i = 0; i < Schema.skinKeys.length; i++) k[Schema.skinKeys[i]] = settings[Schema.skinKeys[i]]
        if (withDress) k.dress = dress.slice()
        const list = skins.filter((x) => x.name !== name)
        if (list.length >= 60) return false
        list.push(k)
        skins = list
        const s = Object.assign({}, settings, { skin: name })
        settings = s
        saveTimer.restart()
        return true
    }
    function deleteSkin(name) {
        skins = skins.filter((x) => x.name !== name)
        if (settings.skin === name) settings = Object.assign({}, settings, { skin: "Custom" })
        saveTimer.restart()
    }

    // ---- saved pals: a character with its skin, colors and clothes, kept as one ---------------------
    function cleanName(name) { return String(name || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 24) }
    function savePal(name) {
        name = cleanName(name)
        if (!name) return false
        const list = pals.filter((x) => x.name !== name)
        if (list.length >= 60) return false
        const k = { name: name, character: settings.character, skin: settings.skin, dress: dress.slice() }
        for (let i = 0; i < Schema.skinKeys.length; i++) k[Schema.skinKeys[i]] = settings[Schema.skinKeys[i]]
        list.push(k)
        pals = list
        saveTimer.restart()
        return true
    }
    function applyPal(name) {
        let p = null
        for (let i = 0; i < pals.length; i++) if (pals[i].name === name) p = pals[i]
        if (!p) return
        const s = Object.assign({}, settings)
        s.character = Schema.clean("character", p.character)
        for (let i = 0; i < Schema.skinKeys.length; i++) s[Schema.skinKeys[i]] = Schema.clean(Schema.skinKeys[i], p[Schema.skinKeys[i]])
        s.skin = typeof p.skin === "string" && (p.skin === "Custom" || skinByName(p.skin) !== null) ? p.skin : "Custom"
        settings = s
        dress = Skins.cleanDress(p.dress)
        saveTimer.restart()
    }
    function deletePal(name) { pals = pals.filter((x) => x.name !== name); saveTimer.restart() }

    // ---- dress ---------------------------------------------------------------------------------------
    function wearing(id) { return Skins.wearing(dress, id) }
    function wear(id) {
        const it = Skins.dressItem(id)
        if (!it || wearing(id)) return
        // one hat, one pair of glasses, one neck piece, one back piece; extras add up
        const list = dress.filter((d) => {
            const o = Skins.dressItem(d.id)
            return !(o && it.slot !== "extra" && o.slot === it.slot)
        })
        list.push({ id: id, color: it.color, size: 100, dy: 0 })
        dress = Skins.cleanDress(list)
        saveTimer.restart()
    }
    function unwear(id) { dress = dress.filter((d) => d.id !== id); saveTimer.restart() }
    function toggleWear(id) { if (wearing(id)) unwear(id); else wear(id) }
    function tweak(id, patch) {
        dress = Skins.cleanDress(dress.map((d) => d.id === id ? Object.assign({}, d, patch) : d))
        saveTimer.restart()
    }
    function clearDress() { dress = []; saveTimer.restart() }

    // ---- characters ---------------------------------------------------------------------------------
    // { key, label, category }; yours are "custom:<path>", in the category of their folder
    function customList() {
        return customCharacters.map((p) => {
            const i = p.lastIndexOf("/")
            const name = (i >= 0 ? p.slice(i + 1) : p).replace(/\.[^.]+$/, "")
            return { key: "custom:" + p, label: name, category: i >= 0 ? p.slice(0, i) : "Yours" }
        })
    }
    function allCharacters() { return Skins.characters.concat(customList()) }
    function categoryList() {
        const out = Skins.categories.slice()
        const c = customList()
        for (let i = 0; i < c.length; i++) if (out.indexOf(c[i].category) < 0) out.push(c[i].category)
        return out
    }
    function charactersIn(category) { return allCharacters().filter((c) => c.category === category) }
    function characterKeys() { return allCharacters().map((c) => c.key) }
    function characterLabel(key) {
        const c = allCharacters().find((x) => x.key === key)
        return c ? c.label : key
    }
    function nextCharacter() {
        const k = characterKeys()
        set("character", k[(Math.max(0, k.indexOf(settings.character)) + 1) % k.length])
    }
    function nextSkin() {
        const s = allSkins().map((k) => k.name)
        applySkin(s[(s.indexOf(settings.skin) + 1) % s.length])
    }
    function surprise() {
        const k = characterKeys()
        const s = allSkins()
        set("character", k[Math.floor(Math.random() * k.length)])
        applySkin(s[Math.floor(Math.random() * s.length)].name)
        lastShuffle = Date.now()
    }

    // ---- what a click does ---------------------------------------------------------------------------
    function perform(action) {
        switch (action) {
        case "ask": ask(); break
        case "voice": voice("toggle"); break
        case "menu": menuRequested(); break
        case "settings": toggleSettings("settings"); break
        case "characters": toggleSettings("wardrobe"); break
        case "wardrobe": toggleSettings("wardrobe"); break
        case "newChat": newChat(); break
        case "nextCharacter": nextCharacter(); break
        case "nextSkin": nextSkin(); break
        case "surprise": surprise(); break
        case "hide": shown = false; break
        }
    }
    function savePos(screen, fx, fy) {
        palPos = { screen: String(screen), fx: Math.max(0, Math.min(1, fx)), fy: Math.max(0, Math.min(1, fy)) }
        saveTimer.restart()
    }
    function toggleShown() { shown = !shown }
    // the panel: opens where Settings > Window > Open as says, on the tab you ask for. Opening it
    // again on the tab it is already showing closes it (so one key or command does both).
    // Which screen the bar panel opens on: the focused one, or the first with a bar button when the
    // focused one has none. Each bar button tells the service its screen (registerBar).
    property var barScreens: []
    property string panelScreen: ""
    property var hypr: null
    Component.onCompleted: {
        Registry.set(root)
        loadSaved()
        try {
            hypr = Qt.createQmlObject('import QtQuick\nimport Quickshell.Hyprland\nQtObject { readonly property string name: Hyprland.focusedMonitor ? String(Hyprland.focusedMonitor.name) : "" }', root, "PawmptFocusedScreen")
        } catch (e) { hypr = null }
    }
    function registerBar(name) {
        if (name && barScreens.indexOf(name) < 0) barScreens = barScreens.concat([name])
    }
    function pickScreen() {
        const f = hypr ? hypr.name : ""
        return barScreens.indexOf(f) >= 0 ? f : (barScreens.length > 0 && f !== "" ? barScreens[0] : "")
    }
    function openSettings(tab) {
        panelTab = tab === "wardrobe" ? "wardrobe" : "settings"
        if (!settingsOpen) panelScreen = pickScreen()
        if (!settingsOpen) surface = userPicked ? (surface === "panel" && !barPanelReady ? "window" : surface) : wantSurface
        settingsOpen = true
    }
    function closeSettings() { settingsOpen = false }
    function toggleSettings(tab) {
        const t = tab === "wardrobe" ? "wardrobe" : "settings"
        if (settingsOpen && panelTab === t) closeSettings()
        else openSettings(t)
    }
    // Where the panel opens: by the bar, or in a window of its own. Without a bar button to hang
    // from it is always the window. A change in Settings > Window > Open as moves an open panel
    // at once, until Pop out or Dock has been used.
    readonly property string wantSurface: settings.openAs === "window" || !barPanelReady ? "window" : "panel"
    onWantSurfaceChanged: if (settingsOpen && !userPicked) {
        console.warn("Pawmpt: the panel moves to the " + wantSurface + " (Open as, or the bar panel became " + (barPanelReady ? "ready" : "unavailable") + ")")
        surface = wantSurface
    }
    function popOut() { userPicked = true; surface = "window" }    // from the header of the panel
    function dock() {
        if (!barPanelReady) return
        userPicked = true
        surface = "panel"
    }
    function statusLine() {
        return JSON.stringify({
            version: version, pal: shown ? "shown" : "hidden", character: settings.character, skin: settings.skin,
            dressed: dress.map((d) => d.id), busy: busy, voice: voiceState, conversation: sessionId !== "" || history.length > 0,
            panel: settingsOpen ? { surface: surface, tab: panelTab } : null,
            movement: settings.moveMode
        })
    }
    function ask() { shown = true; askRequested() }

    // ---- asking by voice (Hex) ----------------------------------------------------------------------
    // Pawmpt does not listen itself. It tells the running Hex to start recording, and later to stop and
    // print what was said (qml/js/Voice.js has the commands), then sends that like a typed question.
    property string voiceState: "idle"      // idle, starting, listening, transcribing
    property string voiceNote: ""           // what the bubble says while it is not idle
    property string draft: ""               // what was said, when it goes in the question box instead of being sent
    property int draftSerial: 0
    readonly property bool voiceOn: settings.voice === "hex"

    function voiceFail(message) {
        voiceMaxTimer.stop()
        voiceNote = ""
        voiceState = "idle"
        replyOk = false
        reply = message
        replySerial++
    }
    // mode: toggle (the default), start, stop or cancel
    function voice(mode) {
        mode = String(mode || "toggle")
        if (!voiceOn) { voiceFail("Voice input is off. Turn it on under Settings > Agent > Voice."); return }
        if (voiceState === "idle") {
            if (mode !== "toggle" && mode !== "start") return
            if (busy || agent.running || retryTimer.running || voiceStart.running || voiceStop.running) return
            shown = true
            draft = ""
            voiceCancelled = false
            reply = ""; replyOk = true; activity = []
            voiceNote = "Waking Hex up…"
            voiceState = "starting"
            voiceStart.command = Voice.argv(Voice.startScript(), settings.voiceCommand ? expand(settings.voiceCommand) : "hex")
            voiceStart.running = true
        } else if (voiceState === "listening") {
            if (mode === "toggle" || mode === "stop") voiceStopNow()
            else if (mode === "cancel") voiceCancel()
        } else if (mode === "cancel") voiceCancel()
    }
    function voiceStopNow() {
        voiceMaxTimer.stop()
        voiceNote = "Turning what you said into text…"
        voiceState = "transcribing"
        voiceStop.command = Voice.argv(Voice.stopScript(), settings.voiceCommand ? expand(settings.voiceCommand) : "hex")
        voiceStop.running = true
    }
    function voiceCancel() {
        voiceMaxTimer.stop()
        if (voiceStart.running) voiceCancelled = true      // the start that is still on its way is dropped
        voiceNote = ""
        voiceState = "idle"
        voiceAbort.command = Voice.argv(Voice.cancelScript(), settings.voiceCommand ? expand(settings.voiceCommand) : "hex")
        voiceAbort.running = true
    }
    property bool voiceCancelled: false
    Timer { id: voiceMaxTimer; onTriggered: if (root.voiceState === "listening") root.voiceStopNow() }
    Process {
        id: voiceStart
        stderr: StdioCollector { id: voiceStartErr }
        onExited: (code) => {
            if (root.voiceCancelled) { root.voiceCancelled = false; return }
            if (root.voiceState !== "starting") return
            if (code !== 0) { root.voiceFail(Voice.startProblem(code, voiceStartErr.text)); return }
            root.voiceNote = "Listening… say it, then click the mic (or run voice again) to send."
            root.voiceState = "listening"
            voiceMaxTimer.interval = Math.max(5, root.settings.voiceMaxSeconds || 30) * 1000
            voiceMaxTimer.restart()
        }
    }
    Process {
        id: voiceStop
        stdout: StdioCollector { id: voiceStopOut }
        stderr: StdioCollector { id: voiceStopErr }
        onExited: (code) => {
            if (root.voiceState !== "transcribing") return
            const problem = Voice.stopProblem(code, voiceStopOut.text, voiceStopErr.text)
            if (problem) { root.voiceFail(problem); return }
            const said = Voice.clean(voiceStopOut.text)
            root.voiceNote = ""
            root.voiceState = "idle"
            root.shown = true
            if (root.settings.voiceSend) root.send(said)
            else { root.draft = said; root.draftSerial++; root.askRequested() }
        }
    }
    Process { id: voiceAbort }

    // ---- saving and loading -----------------------------------------------------------------------
    Process {
        id: mkdir
        running: true
        command: ["mkdir", "-p", "-m", "700", "--", root.stateDir, root.configDir, root.charactersDir]
        onExited: { moveOld.running = true; root.refreshCharacters() }
    }
    // the pictures you added under the old name are copied over, never over ones that are already here
    Process {
        id: moveOld
        command: ["sh", "-c", '[ -d "$1/characters" ] && cp -rn "$1/characters/." "$2/characters/"', "sh", root.oldConfigDir, root.configDir]
        onExited: root.refreshCharacters()
    }

    // Reads a saved file into the state. Returns false, and changes nothing, when the text is not a
    // settings object (empty, cut short, corrupt), so the next copy can be tried instead.
    function ingest(text) {
        let got
        try { got = JSON.parse(text) } catch (e) { return false }
        if (!got || typeof got !== "object" || Array.isArray(got)) return false
        if (Schema.needsMigrate(got)) got = Schema.migrate(got)
        // the Theme skin used to be recognised by its name; now it is the palTheme setting
        if (got.skin === "Theme" && got.palTheme === undefined) got.palTheme = true
        // 1.0 stored the skin in body/eye/accent; those are the palette keys now
        root.settings = Schema.resolve(got)
        const sk = []
        if (Array.isArray(got.skins))
            for (let i = 0; i < got.skins.length && sk.length < 60; i++) {
                const x = got.skins[i]
                if (!x || typeof x !== "object" || typeof x.name !== "string" || !x.name.trim() || Skins.preset(x.name)) continue
                const k = { name: x.name.trim().slice(0, 24) }
                for (let j = 0; j < Schema.skinKeys.length; j++) k[Schema.skinKeys[j]] = Schema.clean(Schema.skinKeys[j], x[Schema.skinKeys[j]])
                if (Array.isArray(x.dress)) k.dress = Skins.cleanDress(x.dress)
                sk.push(k)
            }
        root.skins = sk
        const pl = []
        if (Array.isArray(got.pals))
            for (let i = 0; i < got.pals.length && pl.length < 60; i++) {
                const x = got.pals[i]
                if (!x || typeof x !== "object" || typeof x.name !== "string" || !x.name.trim()) continue
                const k = { name: x.name.trim().slice(0, 24), character: Schema.clean("character", x.character),
                            skin: typeof x.skin === "string" ? x.skin.slice(0, 24) : "Custom" }
                for (let j = 0; j < Schema.skinKeys.length; j++) k[Schema.skinKeys[j]] = Schema.clean(Schema.skinKeys[j], x[Schema.skinKeys[j]])
                k.dress = Skins.cleanDress(x.dress)
                pl.push(k)
            }
        root.pals = pl
        root.dress = Skins.cleanDress(got.dress)
        root.lastShuffle = typeof got.lastShuffle === "number" ? got.lastShuffle : 0
        if (got.palPos && typeof got.palPos === "object") root.palPos = got.palPos
        if (!root.loaded) {
            if (root.settings.startHidden) root.shown = false
            if (root.settings.shuffle === "start") root.surprise()
        }
        // a skin that is gone is a custom one
        if (root.settings.skin !== "Custom" && root.skinByName(root.settings.skin) === null)
            root.settings = Object.assign({}, root.settings, { skin: "Custom" })
        root.loaded = true
        return true
    }

    // Where everything is kept, in the order it is looked for when the pal starts:
    //   1. ~/.local/state/omarchy-pawmpt/settings.json   the settings, your saved skins, what it wears
    //   2. ~/.config/pawmpt/last-good.json         a second copy of the same, written every time
    //   3. ~/.config/pawmpt/settings.json                what 1.0 kept (read only if 1 and 2 are missing)
    // Nothing is written until one of them has been read (or none exists, on a first run), so a slow or
    // failed read can never overwrite what you saved with the defaults. Writes are done on the spot, not
    // queued, so they also finish when the shell is stopped, a session ends or the machine shuts down.
    property bool diskKnown: false

    // The three copies are only ever read on request (preload is off), one after the other, so an old
    // copy can never be read after the new one and take its place.
    property bool syncing: false
    FileView {
        id: file
        blockLoading: true
        path: root.stateDir + "/settings.json"
        preload: false
        printErrors: false
        blockWrites: true
        onLoaded: { if (root.syncing || root.diskKnown) return; if (root.ingest(file.text())) root.diskKnown = true; else backup.reload() }
        onLoadFailed: { if (!root.syncing && !root.diskKnown) backup.reload() }
    }
    FileView {
        id: backup
        blockLoading: true
        path: root.configDir + "/last-good.json"
        preload: false
        printErrors: false
        blockWrites: true
        onLoaded: { if (root.syncing || root.diskKnown) return; if (root.ingest(backup.text())) { root.diskKnown = true; saveTimer.restart() } else legacy.reload() }
        onLoadFailed: { if (!root.syncing && !root.diskKnown) legacy.reload() }
    }
    FileView {
        id: oldState
        blockLoading: true
        path: root.oldStateDir + "/settings.json"
        preload: false
        printErrors: false
    }
    FileView {
        id: oldBackup
        blockLoading: true
        path: root.oldConfigDir + "/last-good.json"
        preload: false
        printErrors: false
    }
    FileView {
        id: legacy
        blockLoading: true
        path: root.configDir + "/settings.json"
        preload: false
        printErrors: false
        onLoaded: { if (root.syncing || root.diskKnown) return; if (root.ingest(legacy.text())) saveTimer.restart(); root.diskKnown = true; root.loaded = true }   // keep it in the new place
        onLoadFailed: { if (!root.syncing && !root.diskKnown) { root.diskKnown = true; root.loaded = true } }
    }
    // if the settings never report back, show the pal anyway (nothing is written meanwhile)
    Timer { interval: 2000; running: !root.loaded; onTriggered: root.loaded = true }

    // At startup the saved file is read on the spot, before anything is drawn, so the pal comes up
    // looking the way you left it. The first copy that reads wins and the others are never looked at.
    // If none can be read this way, the reads above run one after the other.
    function loadSaved() {
        syncing = true
        const copies = [file, backup, oldState, oldBackup, legacy]
        let found = false
        for (let i = 0; i < copies.length && !found; i++) {
            let text = ""
            try { copies[i].reload(); text = String(copies[i].text()) } catch (e) { text = "" }
            if (text.trim() === "") continue
            if (ingest(text)) {
                diskKnown = true
                found = true
                if (copies[i] !== file) saveTimer.restart()      // keep it in the usual place
                console.log("Pawmpt: settings read from " + copies[i].path)
            }
        }
        syncing = false
        if (!found) file.reload()      // nothing readable yet: the slower route decides (and a first run starts fresh)
    }

    function writeNow() {
        if (!diskKnown) return false
        const text = JSON.stringify(Object.assign({}, root.settings, {
            skins: root.skins, pals: root.pals, dress: root.dress, lastShuffle: root.lastShuffle, palPos: root.palPos
        }), null, 2) + "\n"
        file.setText(text)
        backup.setText(text)
        return true
    }
    Timer {
        id: saveTimer
        interval: 300
        onTriggered: if (!root.writeNow()) restart()      // not read yet: try again shortly
    }
    Component.onDestruction: { Registry.clear(root); if (saveTimer.running) { saveTimer.stop(); root.writeNow() } }
    // Surprise me: every hour or every day
    Timer {
        interval: 60000
        repeat: true
        running: root.loaded && (root.settings.shuffle === "hour" || root.settings.shuffle === "day")
        onTriggered: {
            const every = root.settings.shuffle === "hour" ? 3600000 : 86400000
            if (Date.now() - root.lastShuffle >= every) root.surprise()
        }
    }

    // ---- characters you added ----------------------------------------------------------------------
    function refreshCharacters() { if (!lister.running) lister.running = true }
    Process {
        id: lister
        command: ["find", root.charactersDir, "-maxdepth", "2", "-type", "f", "-regextype", "posix-extended",
                  "-iregex", ".*\\.(png|jpe?g|gif|webp|svg)$", "-printf", "%P\\n"]
        stdout: StdioCollector {
            onStreamFinished: root.customCharacters = text.split("\n")
                .filter((n) => n.length > 0 && n.length < 200 && n.split("/").length <= 2).sort()
        }
    }
    // category: a folder name, or empty for "Yours"
    readonly property var namePattern: /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/
    readonly property var categoryPattern: /^[A-Za-z0-9][A-Za-z0-9 _-]{0,23}$/
    function addCharacter(path, category) {
        path = String(path || "").trim().replace(/^file:\/\//, "")
        if (path.startsWith("~/")) path = Quickshell.env("HOME") + path.slice(1)
        if (!/^\/.+\.(png|jpe?g|gif|webp|svg)$/i.test(path)) return false
        category = String(category || "").trim()
        if (category === "Yours") category = ""
        if (category && !categoryPattern.test(category)) return false
        if (copier.running) return false
        copier.command = ["sh", "-c", 'mkdir -p -- "$2" && cp -- "$1" "$2/"', "pawmpt", path,
                          root.charactersDir + (category ? "/" + category : "")]
        copier.running = true
        return true
    }
    Process { id: copier; onExited: root.refreshCharacters() }
    function openCharactersFolder() { Quickshell.execDetached(["xdg-open", root.charactersDir]) }
    function openCategoryFolder(category) {
        const ok = category && category !== "Yours" && categoryPattern.test(category)
        Quickshell.execDetached(["xdg-open", root.charactersDir + (ok ? "/" + category : "")])
    }
    // the categories you made yourself (the folders), not the built-in ones
    function customCategories() {
        const out = []
        const c = customList()
        for (let i = 0; i < c.length; i++) if (c[i].category !== "Yours" && out.indexOf(c[i].category) < 0) out.push(c[i].category)
        return out
    }

    // changing the characters you added: rename, move to a category, delete. A path is "Folder/name.png"
    // or "name.png". If the one in use changes, the setting follows it (or goes back to the blob).
    property string pendingFrom: ""
    property string pendingTo: ""
    function splitPath(p) {
        const i = p.lastIndexOf("/")
        const file = i >= 0 ? p.slice(i + 1) : p
        const j = file.lastIndexOf(".")
        return { dir: i >= 0 ? p.slice(0, i) : "", name: j > 0 ? file.slice(0, j) : file, ext: j > 0 ? file.slice(j) : "" }
    }
    function validCustomPath(p) {
        return /^[A-Za-z0-9][A-Za-z0-9 _.-]*(\/[A-Za-z0-9][A-Za-z0-9 _.-]*)?$/.test(String(p)) && String(p).indexOf("..") < 0
    }
    function moveCharacter(path, newName, newCategory) {
        if (editor.running || !validCustomPath(path)) return false
        const a = splitPath(path)
        newName = String(newName === undefined || newName === null || newName === "" ? a.name : newName).trim()
        newCategory = newCategory === undefined || newCategory === null ? a.dir : String(newCategory).trim()
        if (newCategory === "Yours") newCategory = ""
        if (!namePattern.test(newName) || (newCategory && !categoryPattern.test(newCategory))) return false
        const dest = (newCategory ? newCategory + "/" : "") + newName + a.ext
        if (dest === path) return true
        pendingFrom = "custom:" + path
        pendingTo = "custom:" + dest
        editor.command = ["sh", "-c", 'mkdir -p -- "$3" && test ! -e "$2" && mv -- "$1" "$2"', "pawmpt",
                          root.charactersDir + "/" + path, root.charactersDir + "/" + dest,
                          root.charactersDir + (newCategory ? "/" + newCategory : "")]
        editor.running = true
        return true
    }
    function deleteCharacter(path) {
        if (editor.running || !validCustomPath(path)) return false
        pendingFrom = "custom:" + path
        pendingTo = "blob"
        editor.command = ["sh", "-c", 'rm -f -- "$1"; d=$(dirname -- "$1"); if [ "$d" != "$2" ]; then rmdir -- "$d" 2>/dev/null; fi; true', "pawmpt",
                          root.charactersDir + "/" + path, root.charactersDir]
        editor.running = true
        return true
    }
    Process {
        id: editor
        onExited: (code) => {
            if (code === 0 && root.pendingFrom !== "" && root.settings.character === root.pendingFrom) root.set("character", root.pendingTo)
            root.pendingFrom = ""; root.pendingTo = ""
            root.refreshCharacters()
        }
    }
    function characterSource(key) {
        if (!String(key).startsWith("custom:")) return ""
        return "file://" + root.charactersDir + "/" + String(key).slice(7).split("/").map((p) => encodeURIComponent(p)).join("/")
    }

    // ---- the agent --------------------------------------------------------------------------
    property bool busy: false
    property string reply: ""
    property bool replyOk: true
    property int replySerial: 0

    // ---- models: listed by the agent itself ---------------------------------------------------
    property var models: []
    property bool modelsBusy: false
    property string modelsError: ""
    property string modelsFor: ""
    function loadModels() {
        const a = settings.agent
        if (a !== "opencode" && a !== "ollama") { models = []; modelsError = ""; return }
        if (lister2.running) return
        modelsBusy = true
        modelsError = ""
        modelsFor = a
        lister2.command = a === "opencode" ? ["timeout", "60", "opencode", "models"] : ["timeout", "20", "ollama", "list"]
        lister2.running = true
    }
    Process {
        id: lister2
        workingDirectory: Quickshell.env("HOME")
        stdout: StdioCollector { id: modelsOut }
        stderr: StdioCollector { id: modelsErr }
        onExited: (code) => {
            root.modelsBusy = false
            const clean = (t) => String(t || "").replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")
            const lines = clean(modelsOut.text).split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
            let list = []
            if (root.modelsFor === "opencode") list = lines.filter((l) => /^[A-Za-z0-9._-]+\/\S+$/.test(l))
            else list = lines.slice(1).map((l) => l.split(/\s+/)[0]).filter((l) => l.length > 0)
            list = Array.from(new Set(list)).sort()
            root.models = list
            if (code === 127) root.modelsError = root.modelsFor + " is not installed"
            else if (code !== 0 && list.length === 0) root.modelsError = (clean(modelsErr.text).trim() || ("listing models failed (" + code + ")")).slice(0, 300)
            else if (list.length === 0) root.modelsError = "No models found. Connect a provider in " + root.modelsFor + " first."
        }
    }
    onLoadedChanged: if (loaded) loadModels()

    // ---- the conversation -------------------------------------------------------------------
    property string sessionId: ""           // opencode's session, kept until New chat
    property string lastQuestion: ""        // what was asked last, for Retry
    property bool lastQuick: false
    property var asked: []                  // the questions of this session, for the up arrow in the question box
    property string pendingSel: ""          // the text selected (or copied) when asked
    property string pendingClip: ""
    property bool quickMode: false          // a quick action works on the selected text, or else the copied text
    property double lastAsked: 0
    property var activity: []               // what it is doing: tools it runs, files it reads
    property string workDir: ""             // the folder the last request ran in
    property string usage: ""               // tokens and cost of the last answer
    property string pendingPrompt: ""
    property var win: ({})                  // the active window when asked

    readonly property var followUps: Prompt.followUps
    // can a follow-up carry on from the last answer? opencode keeps a session; the others have the history
    readonly property bool conversationKept: settings.remember && (sessionId !== "" || history.length > 0)
    property var history: []                // [{ q, a }]: what Ollama and your own command are reminded of
    property string lastBody: ""            // the last question with its quoted text, for the history
    property double askedAt: 0              // when the question was asked (for Only notify if it took longer)
    property int failTries: 0               // how often a failed run has been asked again

    function newChat() { sessionId = ""; history = []; reply = ""; activity = []; usage = ""; replySerial++ }
    function stop() {
        if (agent.running) { stopped = true; agent.running = false }
        else if (retryTimer.running) {      // waiting to try again: stop that too
            retryTimer.stop()
            stopped = true
            finish(true, (reply.trim() ? reply.trim() + "\n\n" : "") + "(stopped)")
        }
    }
    property bool stopped: false
    Timer { id: retryTimer; interval: 1500; onTriggered: root.run() }

    function expand(path) {
        path = String(path || "").trim()
        if (path.startsWith("~")) path = Quickshell.env("HOME") + path.slice(1)
        return path
    }

    // The question never goes in the command's arguments, where any user on the machine can read it
    // (ps, /proc/<pid>/cmdline). opencode and Ollama read it from stdin; so does your own command, unless
    // you put {prompt} in it yourself. argvFor() says which: stdinPrompt is true when the question is to
    // be written to stdin.
    property bool stdinPrompt: true
    // the presets of earlier versions, which put the question in the arguments
    readonly property var oldCommands: ({ "claude -p {prompt}": "claude -p", "gemini -p {prompt}": "gemini", "codex exec {prompt}": "codex exec -" })
    function argvFor(prompt) {
        const a = settings.agent || "opencode"
        const m = String(settings.agentModel || "").trim()
        if (a === "opencode") {
            // opencode runs in the work folder itself (no --dir: not every version has it).
            // A flag this opencode doesn't know is dropped and the question asked again.
            const argv = ["opencode", "run"]
            const add = (flag, value) => {
                if (unsupported[flag]) return
                argv.push(flag)
                if (value !== undefined) argv.push(value)
            }
            add("--format", "json")
            if (m) add("--model", m)
            if (settings.agentMode && settings.agentMode !== "build") add("--agent", settings.agentMode)
            if (settings.agentVariant) add("--variant", settings.agentVariant)
            if (settings.agentAuto) add("--auto")
            if (sessionId) add("--session", sessionId)
            else add("--title", "Pawmpt")
            stdinPrompt = true
            return argv
        }
        if (a === "ollama") { stdinPrompt = true; return ["ollama", "run", m || "llama3.2"] }
        let cmd = String(settings.agentCommand || "").trim()
        if (oldCommands[cmd] !== undefined) cmd = oldCommands[cmd]
        const parts = cmd.split(/\s+/).filter((p) => p.length > 0)
        if (parts.length === 0) return []
        // {prompt} in your own command is your choice to pass it as an argument
        let used = false
        const argv = parts.map((p) => { if (p.indexOf("{prompt}") >= 0) { used = true; return p.split("{prompt}").join(prompt) } return p })
        stdinPrompt = !used
        return argv
    }

    // With Let it act off, opencode gets permissions that only let it read and look things up. Its
    // Build agent allows everything by default, and `opencode run` only turns down what would ask,
    // so without these it could still edit files and run commands. They go in through the
    // environment (OPENCODE_CONFIG_CONTENT, loaded after your own config files), not the arguments.
    readonly property string readOnlyConfig: JSON.stringify({ permission: {
        "*": "deny", edit: "deny", bash: "deny", task: "deny", skill: "deny", external_directory: "deny",
        doom_loop: "deny", question: "deny",
        read: { "*": "allow", "*.env": "deny", "*.env.*": "deny", "*.env.example": "allow" },
        glob: "allow", grep: "allow", list: "allow", lsp: "allow", todowrite: "allow", todoread: "allow",
        webfetch: "allow", websearch: "allow", codesearch: "allow"
    } })

    // 1. which window is active, 2. which folder it is in, 3. ask
    // Quick actions: a prompt that works on the text you have selected, or else on what you copied.
    readonly property var quickActions: Prompt.quickList(settings)
    function quick(key) {
        for (let i = 0; i < quickActions.length; i++)
            if (quickActions[i].key === key) { send(quickActions[i].prompt, true); return true }
        return false
    }
    function retry() {
        if (!lastQuestion) return
        // the exchange that is asked again is not part of the reminder for the new try
        if (history.length > 0 && history[history.length - 1].q === lastBody) history = history.slice(0, -1)
        send(lastQuestion, lastQuick)
    }
    // the last fenced code block of the answer, if there is one
    function lastCode() {
        const re = /```[^\n]*\n([\s\S]*?)```/g
        let m, code = ""
        while ((m = re.exec(reply)) !== null) code = m[1]
        return code.trim()
    }
    // text taken from the selection or the clipboard: no control characters, not too long
    function grabbed(t) { return Prompt.grab(t, settings.contextChars) }

    // 0. what is selected and what is copied, 1. which window is active, 2. which folder it is in, 3. ask
    function send(prompt, quick) {
        prompt = String(prompt || "").trim()
        if (!prompt || agent.running || retryTimer.running || winProbe.running || cwdProbe.running || selProbe.running || clipProbe.running) return
        // a long pause starts a fresh conversation
        if (!settings.remember || Date.now() - lastAsked > settings.rememberMinutes * 60 * 1000) { sessionId = ""; history = [] }
        askedAt = Date.now()
        quickMode = quick === true
        lastQuestion = prompt
        lastQuick = quickMode
        if (!quickMode) asked = asked.filter((x) => x !== prompt).concat([prompt]).slice(-30)
        pendingPrompt = prompt
        pendingSel = ""
        pendingClip = ""
        busy = true
        stopped = false
        reply = ""
        activity = []
        usage = ""
        win = ({})
        if (quickMode || settings.tellSelection) selProbe.running = true
        else if (settings.tellClipboard) clipProbe.running = true
        else winProbe.running = true
    }
    // the selection and the clipboard are read once, by wl-paste, for at most two seconds each
    Process {
        id: selProbe
        // text only, and at most 64 KB, so a huge clipboard or a copied picture never fills the shell
        command: ["sh", "-c", 'timeout 2 wl-paste --primary --no-newline --type text 2>/dev/null | head -c 65536']
        stdout: StdioCollector { id: selOut }
        onExited: {
            root.pendingSel = root.grabbed(selOut.text)
            if ((root.quickMode && root.pendingSel === "") || (!root.quickMode && root.settings.tellClipboard)) clipProbe.running = true
            else winProbe.running = true
        }
    }
    Process {
        id: clipProbe
        command: ["sh", "-c", 'timeout 2 wl-paste --no-newline --type text 2>/dev/null | head -c 65536']
        stdout: StdioCollector { id: clipOut }
        onExited: { root.pendingClip = root.grabbed(clipOut.text); winProbe.running = true }
    }
    Process {
        id: winProbe
        command: ["hyprctl", "activewindow", "-j"]
        stdout: StdioCollector { id: winOut }
        onExited: {
            let w = {}
            try { w = JSON.parse(winOut.text) || {} } catch (e) { w = {} }
            root.win = { cls: String(w.class || ""), title: String(w.title || ""), pid: parseInt(w.pid, 10) || 0 }
            if (root.settings.workIn === "window" && root.win.pid > 0) {
                cwdProbe.command = ["bash", "-c",
                    'p=$1; for i in 1 2 3 4 5 6 7 8; do c=$(pgrep -P "$p" | tail -n 1); [ -z "$c" ] && break; p=$c; done; readlink "/proc/$p/cwd"',
                    "pawmpt", String(root.win.pid)]
                cwdProbe.running = true
            } else root.launch("")
        }
    }
    Process {
        id: cwdProbe
        stdout: StdioCollector { id: cwdOut }
        onExited: root.launch(cwdOut.text.trim())
    }
    function launch(windowDir) {
        const home = Quickshell.env("HOME")
        let dir = home
        if (settings.workIn === "folder" && settings.workFolder) dir = expand(settings.workFolder)
        else if (settings.workIn === "window" && windowDir.startsWith("/") && windowDir !== "/") dir = windowDir
        // a conversation stays in the folder it started in
        if (!sessionId || !workDir) workDir = dir
        if (quickMode && pendingSel === "" && pendingClip === "") { finish(false, "Select some text, or copy it, and try again."); return }
        // opencode keeps its own conversation; the others are reminded of the last exchanges
        const agentName = settings.agent || "opencode"
        const composed = Prompt.compose({
            prompt: pendingPrompt, quick: quickMode, sel: pendingSel, clip: pendingClip,
            prefix: settings.agentPrefix, style: settings.agentStyle, language: settings.agentLanguage,
            history: agentName !== "opencode" && settings.remember ? history : [], turns: settings.memoryTurns,
            tellWindow: settings.tellWindow, windowClass: win.cls, windowTitle: win.title, workDir: workDir
        })
        const prompt = composed.prompt
        lastBody = composed.body
        lastPrompt = prompt
        retries = 0
        failTries = 0
        run()
    }
    function run() {
        const argv = argvFor(lastPrompt)
        if (argv.length === 0) { finish(false, "Set an agent command in Settings › Agent."); return }
        lastAsked = Date.now()
        jsonMode = argv[0] === "opencode" && !unsupported["--format"]
        reply = ""
        activity = []
        rawOut = ""
        errText = ""
        agent.workingDirectory = workDir
        agent.environment = (argv[0] === "opencode" && !settings.agentAuto) ? ({ OPENCODE_CONFIG_CONTENT: readOnlyConfig }) : ({})
        // the question is written to stdin once it has started, then stdin is closed (see onStarted)
        agentInput = stdinPrompt ? lastPrompt : ""
        agent.stdinEnabled = true
        agent.command = ["timeout", "-k", "5", String(Math.max(10, settings.agentTimeout || 300))].concat(argv)
        agent.running = true
    }
    function finish(ok, text) {
        const answered = ok && !stopped && String(text || "").trim() !== "" && text !== "(no answer)" && text !== "Done."
        busy = false
        replyOk = ok
        reply = text
        replySerial++
        // the other agents have no chat of their own: keep the exchange to remind them of it
        if (answered && settings.remember && (settings.agent || "opencode") !== "opencode" && settings.memoryTurns > 0 && lastBody !== "")
            history = history.concat([{ q: lastBody, a: String(text) }]).slice(-10)
        if (answered && settings.copyAnswer) copyText(String(text))
        // only a plain line: the answer itself would sit in notify-send's arguments and in the notification history
        if (settings.notifyDone && Date.now() - askedAt >= (settings.notifyAfter || 0) * 1000)
            Quickshell.execDetached(["notify-send", "-a", "Pawmpt", ok ? "Answer ready" : "Pawmpt ran into a problem",
                ok ? "Click your pal to read it." : "Your pal has the details."])
    }

    // ---- reading the answer as it comes -------------------------------------------------------
    property var unsupported: ({})          // flags this opencode turned down
    property int retries: 0
    property string lastPrompt: ""
    property bool jsonMode: false
    property string rawOut: ""
    property string errText: ""
    function note(line) {
        const a = activity.slice(-7)
        a.push(line)
        activity = a
    }
    function toolLine(part) {
        const st = part.state || {}
        const inp = st.input || {}
        const what = st.title || inp.description || inp.command || inp.filePath || inp.path || inp.pattern || inp.url || ""
        return (st.status === "error" ? "✗ " : "› ") + (part.tool || "tool") + (what ? ": " + String(what).split("\n")[0].slice(0, 90) : "")
    }
    function onLine(line) {
        if (!jsonMode) { rawOut += line + "\n"; reply = clean(rawOut).slice(-6000); return }
        let e = null
        try { e = JSON.parse(line) } catch (x) { e = null }
        if (!e || typeof e !== "object") { if (line.trim()) note(clean(line).slice(0, 120)); return }
        if (e.sessionID && settings.remember) sessionId = String(e.sessionID)
        const part = e.part || {}
        if (e.type === "text" && part.text) {
            reply = (reply ? reply + "\n\n" : "") + String(part.text).trim()
        } else if (e.type === "tool_use") {
            note(toolLine(part))
        } else if (e.type === "step_finish") {
            const t = part.tokens || {}
            const n = (t.input || 0) + (t.output || 0) + (t.reasoning || 0)
            if (n > 0) usage = n.toLocaleString() + " tokens" + (part.cost ? " · $" + Number(part.cost).toFixed(4) : "")
        } else if (e.type === "error") {
            const er = e.error || {}
            errText = String((er.data && er.data.message) || er.message || er.name || "error")
        }
    }
    // Copying: wl-copy reads the text from stdin, so it is never in a command's arguments.
    property string copyQueue: ""
    property bool copyQueued: false
    function copyText(text) {
        text = String(text || "")
        if (text === "") return
        if (copier2.running) { copyQueue = text; copyQueued = true; return }
        copyInput = text
        copier2.stdinEnabled = true
        copier2.running = true
    }
    property string copyInput: ""
    Process {
        id: copier2
        command: ["wl-copy"]
        onStarted: { copier2.write(root.copyInput); root.copyInput = ""; copier2.stdinEnabled = false }
        onExited: { if (root.copyQueued) { root.copyQueued = false; const t = root.copyQueue; root.copyQueue = ""; Qt.callLater(root.copyText, t) } }
    }

    function clean(t) { return String(t || "").replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "") }

    property string agentInput: ""
    Process {
        id: agent
        // the question on stdin, then end of input, so the agent starts right away
        onStarted: { if (root.agentInput !== "") agent.write(root.agentInput); root.agentInput = ""; agent.stdinEnabled = false }
        stdout: SplitParser { onRead: (line) => root.onLine(line) }
        stderr: StdioCollector { id: agentErr }
        onExited: (code) => {
            const err = root.clean(agentErr.text).trim()
            const text = root.reply.trim()
            // a flag this opencode doesn't have: leave it out and ask again
            const bad = /Unrecognized flag:?\s*(--?[A-Za-z][\w-]*)|Unknown (?:argument|option)s?:?\s*-*([A-Za-z][\w-]*)/i.exec(err + "\n" + root.errText + "\n" + root.rawOut + "\n" + text)
            if (!root.stopped && code !== 0 && bad && root.retries < 6 && (root.settings.agent || "opencode") === "opencode") {
                const flag = bad[1] ? bad[1] : "--" + bad[2]
                if (!root.unsupported[flag]) {
                    const u = Object.assign({}, root.unsupported)
                    u[flag] = true
                    root.unsupported = u
                    root.retries++
                    root.errText = ""
                    root.rawOut = ""
                    console.log("pawmpt: this opencode has no " + flag + ", asking again without it")
                    Qt.callLater(root.run)
                    return
                }
            }
            // a failed run is asked again, if Try again when it fails says so (not a stop, a timeout or a missing agent)
            const failed = !root.stopped && ((code !== 0 && code !== 124 && code !== 137 && code !== 127) || (code === 0 && root.errText !== "" && text === ""))
            if (failed && root.failTries < (root.settings.agentRetries || 0)) {
                root.failTries++
                console.log("pawmpt: the agent failed, asking again (" + root.failTries + " of " + root.settings.agentRetries + ")")
                retryTimer.restart()
                return
            }
            if (root.stopped) root.finish(true, (text ? text + "\n\n" : "") + "(stopped)")
            else if (root.errText) root.finish(false, (text ? text + "\n\n" : "") + root.errText)
            else if (code === 0 && text) root.finish(true, text)
            else if (code === 0) root.finish(true, root.activity.length ? "Done." : "(no answer)")
            else if (code === 124 || code === 137) root.finish(false, (text ? text + "\n\n" : "") + "It took longer than " + root.settings.agentTimeout + " s, so it was stopped. Raise the limit in Settings › Agent.")
            else if (code === 127) root.finish(false, "Agent not found: " + root.argvFor("")[0] + ". Install it or pick another agent in Settings › Agent.")
            else root.finish(false, (text ? text + "\n\n" : "") + (err.split("\n").slice(-6).join("\n") || ("The agent stopped with code " + code)).slice(0, 1200))
        }
    }

    // open the conversation in opencode itself, in a terminal
    function openInTerminal() {
        if (!sessionId) return
        Quickshell.execDetached(["xdg-terminal-exec", "--dir=" + (workDir || Quickshell.env("HOME")), "opencode", workDir || Quickshell.env("HOME"), "--session", sessionId])
    }

    IpcHandler {
        target: "pawmpt"
        function toggle(): void { root.toggleShown() }
        function show(): void { root.shown = true }
        function hide(): void { root.shown = false }
        function ask(): void { root.ask() }
        function voice(mode: string): void { root.voice(mode) }
        function send(prompt: string): void { root.shown = true; root.send(prompt) }
        function quick(name: string): void { root.shown = true; root.quick(name) }
        function retry(): void { root.retry() }
        function newChat(): void { root.newChat() }
        function settings(): void { root.toggleSettings("settings") }
        function panel(): void { root.toggleSettings("settings") }
        function wardrobe(): void { root.toggleSettings("wardrobe") }
        function status(): string { return root.statusLine() }
        function character(name: string): void { root.set("character", name) }
        function skin(name: string): void { root.applySkin(name) }
        function wear(item: string): void { root.wear(item) }
        function pal(name: string): void { root.applyPal(name) }
        function undress(): void { root.clearDress() }
        function nextCharacter(): void { root.nextCharacter() }
        function nextSkin(): void { root.nextSkin() }
        function surprise(): void { root.surprise() }
    }
}
