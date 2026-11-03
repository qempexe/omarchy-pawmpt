import QtQuick
import "../js/Draw.js" as Draw
import "../js/Glow.js" as Glow

// One pal, drawn at its size: a built-in character on a canvas, or a picture you added,
// with what it wears on a canvas behind it (cape, wings) and one in front (hats, glasses...).
Item {
    id: root

    property string kind: "blob"            // a built-in key, or "custom:<path>"
    property string source: ""              // the picture, for a custom character
    property var skin: ({})                 // body, body2, eye, accent, outline, pattern ... (see Draw.js)
    property var items: []                  // [{ id, color, size, dy }]
    property real lookX: 0
    property real lookY: 0
    property bool busy: false
    property bool animate: true
    property bool blinks: true
    property bool asleep: false
    property bool shadow: false
    property string idle: "breathe"         // breathe, bob, sway, hop, still, wobble, twirl, shiver, float, dance, jumpy, heartbeat, swing, flip, stretch, glitch, tilt, flip, boing, drowsy
    property bool flipped: false
    property bool plain: false              // only the body, no dress canvases (for the picker's small tiles)
    property real lean: 0                   // degrees, from the way it is going

    property real t: 0
    property real blinkAmount: 0
    readonly property bool custom: kind.startsWith("custom:")
    readonly property bool dressMoves: {
        for (let i = 0; i < items.length; i++) if (items[i].id === "sparkles" || items[i].id === "hearts") return true
        return false
    }
    readonly property bool ticking: animate && visible
        && (idle !== "still" || busy || asleep || dressMoves || (!custom && Draw.animated(kind)))

    // idle motion, shared by drawn and picture characters
    readonly property real bobY: asleep ? Math.sin(t * 1.2) * height * 0.015
        : idle === "bob" ? Math.sin(t * 3) * height * 0.04
        : idle === "hop" ? -Math.abs(Math.sin(t * 3.2)) * height * 0.1
        : idle === "float" ? -(1 + Math.sin(t * 1.1)) * height * 0.05
        : idle === "jumpy" ? ((t % 2.4) < 0.5 ? -Math.sin((t % 2.4) / 0.5 * Math.PI) * height * 0.16 : 0)
        : idle === "boing" ? -Math.abs(Math.sin(Math.PI * boingU)) * height * 0.14
        : idle === "flip" ? (flipU < 1 ? -Math.sin(flipU * Math.PI) * height * 0.18 : 0)
        : idle === "drowsy" ? (drowsyU < 0.05 ? -Math.sin(drowsyU / 0.05 * Math.PI) * height * 0.05 : 0) : 0
    readonly property real swayDeg: (asleep ? 0
        : idle === "sway" ? Math.sin(t * 1.8) * 5
        : idle === "float" ? Math.sin(t * 0.9) * 3
        : idle === "dance" ? Math.sin(t * 3.2) * 7
        : idle === "tilt" ? Math.max(-1, Math.min(1, Math.sin(t * 0.7) * 2.5)) * 10
        : idle === "flip" ? (flipU < 1 ? 360 * flipU * flipU * (3 - 2 * flipU) : 0)
        : idle === "drowsy" ? 14 * drowsyU * drowsyU : 0) + lean
    readonly property real boingU: (t % 1.2) / 1.2         // where it is in its bounce, 0 to 1
    readonly property real flipU: (t % 4) / 0.8             // under 1 while it somersaults
    readonly property real drowsyU: (t % 6) / 6             // how far it has nodded off

    // squash, stretch and sideways motion of the other idles
    readonly property real beat: {            // two quick pulses, then a rest
        const ph = (t * 1.1) % 1
        return Math.exp(-Math.pow((ph - 0.1) / 0.05, 2)) + 0.7 * Math.exp(-Math.pow((ph - 0.3) / 0.06, 2))
    }
    readonly property real idleDx: asleep ? 0
        : idle === "shiver" ? Math.sin(t * 60) * width * 0.012
        : idle === "dance" ? Math.sin(t * 3.2) * width * 0.05 : 0
    readonly property real idleSX: asleep ? 1
        : idle === "wobble" ? 1 - Math.sin(t * 5) * 0.06
        : idle === "twirl" ? Math.cos(t * 1.6)
        : idle === "heartbeat" ? 1 + 0.05 * beat
        : idle === "boing" ? 1 + 0.12 * Math.pow(Math.abs(Math.cos(Math.PI * boingU)), 10) - 0.05 * Math.pow(Math.sin(Math.PI * boingU), 2) : 1
    readonly property real idleSY: asleep ? 1
        : idle === "wobble" ? 1 + Math.sin(t * 5) * 0.06
        : idle === "heartbeat" ? 1 + 0.07 * beat
        : idle === "boing" ? 1 - 0.15 * Math.pow(Math.abs(Math.cos(Math.PI * boingU)), 10) + 0.07 * Math.pow(Math.sin(Math.PI * boingU), 2) : 1

    Timer {
        interval: 33
        repeat: true
        running: root.ticking
        onTriggered: { root.t += 0.033; root.repaintAll() }
    }
    Timer {
        interval: 3200
        repeat: true
        running: root.animate && root.blinks && root.visible && !root.asleep
        onTriggered: blinkAnim.restart()
    }
    SequentialAnimation {
        id: blinkAnim
        NumberAnimation { target: root; property: "blinkAmount"; to: 1; duration: 70 }
        NumberAnimation { target: root; property: "blinkAmount"; to: 0; duration: 110 }
    }

    // How far the outline reaches beyond the pal: the body layer is that much larger, so it is never cut off.
    readonly property real pad: Math.ceil((skin.outlineWidth || 0) * Math.min(width, height) * Draw.SCALE / 80 * 1.5) + ((skin.outlineWidth || 0) > 0 ? 3 : 0)
    onPadChanged: body.requestPaint()

    // The glow is a soft blur, so it does not need full resolution. It is painted small (a fraction of the
    // size, which is far cheaper) and shown scaled up. It is painted for the size the pal had at that
    // moment (hW, hH, hK) and stretched to the size it has now, so while the size changes the glow
    // simply grows with it and is painted sharply again once the size has settled. The blur is done in
    // Glow.js (not with the canvas' own shadowBlur, which rounds and leans to one side), and the pal sits
    // exactly in the middle of the glow's canvas, so the glow is the same on the left and on the right.
    // These are read from `skin` itself, never from a binding that depends on it: when the skin changes, the
    // change handlers can run before such a binding has updated, and the glow would be painted from old values
    // (the first change of the glow then showed nothing).
    function glowWanted() { return !custom && ((skin && skin.glow) || 0) > 0 }
    function glowBlurFor(w, h) { return Math.min(48, ((skin && skin.glow) || 0) * Math.min(w, h) * Draw.SCALE / 120) }
    function glowBlurNow() { return glowBlurFor(width, height) }
    function glowPadNow() { const b = glowBlurNow(); return b > 0 ? Math.ceil(b * 1.6) + 3 : 0 }
    readonly property bool glowOn: glowWanted()
    property int haloDelay: 0                 // ms before the first glow is painted (lets a grid of tiles appear first)
    property real hW: 0
    property real hH: 0
    property real hK: 1
    property real hPad: 0                     // at least this much room around the pal, in pixels of the pal
    property bool haloPainted: false
    property bool glowFallback: false         // set when the canvas can not take a finished picture back
    readonly property int hCW: Math.max(1, Math.ceil((hW + 2 * hPad) / hK))     // the glow canvas, in its own pixels
    readonly property int hCH: Math.max(1, Math.ceil((hH + 2 * hPad) / hK))
    readonly property real hTx: (hCW - hW / hK) / 2                              // where the pal's corner is in it
    readonly property real hTy: (hCH - hH / hK) / 2
    readonly property real hs: hW > 0 ? Math.min(width, height) / Math.min(hW, hH) : 1

    function paintHalo() {
        if (!glowWanted() || width <= 0 || height <= 0) { haloPainted = false; return }
        const m = Math.min(width, height), blur = glowBlurNow()
        const pad = glowPadNow()
        // A small canvas is quick (the blur runs in JavaScript), but the blur has to stay at least ~2 canvas pixels
        // wide to stay smooth: so the canvas is at most ~64 pixels across, and not smaller than that allows.
        const kSpeed = Math.ceil((Math.max(width, height) + 2 * pad) / 64)
        const k = Math.max(1, Math.min(kSpeed, Math.floor(blur / 2)))
        hK = k
        hW = width; hH = height; hPad = glowPadNow()
        halo.requestPaint()
    }
    // The change handlers also run while the pal is still being built, before its values are all there (and
    // where the shell's JavaScript is not ready yet): the glow waits for the pal to be complete.
    property bool completed: false
    Component.onCompleted: { completed = true; haloChanged() }
    function scheduleHalo(ms) {
        if (!completed) return
        if (!glowWanted()) { haloTimer.stop(); haloPainted = false; return }
        if (ms <= 0) { haloTimer.stop(); paintHalo() }
        else { haloTimer.interval = ms; haloTimer.restart() }
    }
    // the look changed: paint the glow again at once (or after haloDelay, for the very first one)
    function haloChanged() { scheduleHalo(haloPainted ? 0 : haloDelay) }
    // the size changed: wait until it has settled
    function haloResized() { scheduleHalo(haloPainted ? 140 : haloDelay) }
    Timer { id: haloTimer; repeat: false; onTriggered: root.paintHalo() }
    onWidthChanged: haloResized()
    onHeightChanged: haloResized()

    // The pal itself never waits for the glow: its layers appear together once painted, the glow fades in under it.
    readonly property bool shown: (custom || body.ready) && (plain || (back.ready && front.ready))

    function repaintAll() { if (!plain) back.requestPaint(); body.requestPaint(); if (!plain) front.requestPaint() }
    onBlinkAmountChanged: { body.requestPaint(); if (!plain) front.requestPaint() }
    onLookXChanged: { body.requestPaint(); if (!plain) front.requestPaint() }
    onLookYChanged: { body.requestPaint(); if (!plain) front.requestPaint() }
    onSkinChanged: { repaintAll(); haloChanged() }
    onItemsChanged: repaintAll()
    onKindChanged: { repaintAll(); haloChanged() }
    onBusyChanged: { repaintAll(); haloChanged() }
    onAsleepChanged: repaintAll()

    // the ground shadow stays put while the pal hops
    Rectangle {
        visible: root.shadow
        anchors.horizontalCenter: parent.horizontalCenter
        y: parent.height * 0.9
        width: parent.width * 0.6
        height: parent.height * 0.08
        radius: height / 2
        color: "black"
        opacity: 0.22
    }

    Item {
        anchors.fill: parent
        transform: [
            Translate { x: root.idleDx; y: root.bobY },
            Rotation { origin.x: root.width / 2; origin.y: root.idle === "flip" && !root.asleep ? root.height / 2 : root.height; angle: root.swayDeg },
            Scale { origin.x: root.width / 2; origin.y: root.height; xScale: (root.flipped ? -1 : 1) * root.idleSX; yScale: root.idleSY }
        ]

        Canvas {
            id: back
            anchors.fill: parent
            visible: !root.plain
            renderStrategy: Canvas.Immediate
            property bool ready: false
            opacity: root.shown ? 1 : 0
            onPaint: {
                if (root.plain) return
                const ctx = getContext("2d")
                Draw.dress(ctx, width, height, root.dressOpts(), "back")
                ready = true
            }
            onWidthChanged: requestPaint()
            onHeightChanged: requestPaint()
        }

        // the glow: one small layer, painted when the look changes (not on every frame) and scaled up
        Canvas {
            id: halo
            width: root.hCW
            height: root.hCH
            scale: root.hs * root.hK
            transformOrigin: Item.TopLeft
            // the middle of the canvas is the middle of the pal; the pal's feet stay where they were
            x: root.width / 2 - root.hs * root.hK * root.hCW / 2
            y: root.height * 0.94 - root.hs * (root.hK * root.hTy + root.hH * 0.94)
            visible: !root.custom
            smooth: true
            renderStrategy: Canvas.Immediate
            opacity: root.shown && root.haloPainted && root.glowOn ? 1 : 0
            Behavior on opacity { NumberAnimation { duration: 160 } }
            // is anything painted on the canvas?
            function hasPixels(ctx) {
                const d = ctx.getImageData(0, 0, width, height).data
                for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true
                return false
            }
            onPaint: {
                const ctx = getContext("2d")
                ctx.clearRect(0, 0, width, height)
                if (root.hW <= 0 || !root.glowWanted()) return
                const k = root.hK
                const opts = Object.assign({}, root.skin, { kind: root.kind, t: root.t, busy: root.busy })
                let done = false
                if (!root.glowFallback) {
                    ctx.save()
                    ctx.translate(root.hTx, root.hTy)
                    Draw.haloMask(ctx, root.hW / k, root.hH / k, opts)
                    ctx.restore()
                    // the glow has the color of the details (accent), not of the body it is made from
                    ctx.globalCompositeOperation = "source-in"
                    ctx.fillStyle = opts.accent
                    ctx.fillRect(0, 0, width, height)
                    ctx.globalCompositeOperation = "source-over"
                    const img = ctx.getImageData(0, 0, width, height)
                    if (!Glow.glowInPlace(img.data, width, height, root.glowBlurFor(root.hW, root.hH) / k, root.skin.glow)) return
                    // the Qt versions differ in which way of putting the picture back works: try them in turn
                    ctx.clearRect(0, 0, width, height)
                    ctx.putImageData(img, 0, 0, 0, 0, width, height)
                    done = hasPixels(ctx)
                    if (!done) { ctx.clearRect(0, 0, width, height); ctx.drawImage(img, 0, 0); done = hasPixels(ctx) }
                    if (!done) { ctx.clearRect(0, 0, width, height); ctx.putImageData(img, 0, 0); done = hasPixels(ctx) }
                    if (!done) { root.glowFallback = true; console.log("Pawmpt: the canvas can not take a picture back, the glow uses the canvas' own shadow") }
                }
                if (!done) {    // the canvas' own shadow: less even, but it works everywhere
                    ctx.clearRect(0, 0, width, height)
                    ctx.save()
                    ctx.translate(root.hTx, root.hTy)
                    Draw.haloOnly(ctx, root.hW / k, root.hH / k, Object.assign(opts, { blurCap: 48 / k }))
                    ctx.restore()
                }
                root.haloPainted = true
            }
        }

        Canvas {
            id: body
            x: -root.pad; y: -root.pad
            width: root.width + 2 * root.pad; height: root.height + 2 * root.pad
            visible: !root.custom
            renderStrategy: Canvas.Immediate
            property bool ready: false
            opacity: root.shown ? 1 : 0
            onPaint: {
                const ctx = getContext("2d")
                ctx.clearRect(0, 0, width, height)
                const o = Object.assign({}, root.skin, {
                    kind: root.kind, t: root.t, breathe: root.idle === "breathe" || root.busy,
                    lookX: root.flipped ? -root.lookX : root.lookX, lookY: root.lookY,
                    blink: root.asleep ? 1 : root.blinkAmount, busy: root.busy, noGlow: true
                })
                ctx.save()
                ctx.translate(root.pad, root.pad)
                Draw.draw(ctx, root.width, root.height, o)
                ctx.restore()
                ready = true
            }
            onWidthChanged: requestPaint()
            onHeightChanged: requestPaint()
        }

        AnimatedImage {
            anchors.fill: parent
            visible: root.custom
            source: root.custom ? root.source : ""
            fillMode: Image.PreserveAspectFit
            sourceSize.width: Math.max(16, root.width * 2)
            sourceSize.height: Math.max(16, root.height * 2)
            asynchronous: true
            smooth: true
            playing: root.animate && root.visible && !root.asleep
            scale: root.idle === "breathe" ? 1 + Math.sin(root.t * 2.2) * 0.02 : 1
            transformOrigin: Item.Bottom
        }

        Canvas {
            id: front
            anchors.fill: parent
            visible: !root.plain
            renderStrategy: Canvas.Immediate
            property bool ready: false
            opacity: root.shown ? 1 : 0
            onPaint: {
                if (root.plain) return
                const ctx = getContext("2d")
                Draw.dress(ctx, width, height, root.dressOpts(), "front")
                ready = true
            }
            onWidthChanged: requestPaint()
            onHeightChanged: requestPaint()
        }
    }

    function dressOpts() {
        return {
            kind: kind, custom: custom, items: items, t: t, lookX: flipped ? -lookX : lookX, lookY: lookY,
            blink: asleep ? 1 : blinkAmount, eye: skin.eye, eyeStyle: skin.eyeStyle
        }
    }

    // z z z while it sleeps
    Text {
        visible: root.asleep
        x: root.width * 0.62
        y: root.height * 0.05 - ((root.t * 18) % 18)
        text: "z"
        color: root.skin.accent || "white"
        font.pixelSize: Math.max(9, root.height * 0.18)
        font.bold: true
        opacity: 1 - ((root.t * 18) % 18) / 18
        textFormat: Text.PlainText
    }
}
