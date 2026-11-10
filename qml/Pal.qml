import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import qs.Commons as Commons
import "controls"

// The pal on your desktop. It can stay put, stroll, roam the screen, bounce off the edges like
// the DVD logo, go up and down, or follow the mouse. Drag it, click it (what the buttons do is a
// setting), and it falls asleep when you leave it alone. It lives on one screen at a time; drop it
// at a screen's side edge to move it on.
Scope {
    id: root

    property var service: null
    readonly property var svc: service
    readonly property var cfg: svc ? svc.settings : ({})
    readonly property real size: Math.max(32, Math.min(260, cfg.size || 88))
    readonly property string mode: cfg.moveMode || "still"
    readonly property real speed: Math.max(10, cfg.moveSpeed || 60)
    readonly property bool tracksCursor: mode === "follow" || mode === "flee" || mode === "orbitmouse"

    property int screenIndex: 0
    property real posX: -1                   // the pal's feet, in its screen
    property real posY: -1
    property bool promptOpen: false
    property bool menuOpen: false
    property bool bubbleOpen: false
    property bool dragging: false
    property bool hovering: false
    property bool asleep: false
    property double lastActive: Date.now()
    property real lookX: 0
    property real lookY: 0
    property real cursorX: -1
    property real cursorY: -1
    property bool facingLeft: false
    property real hop: 0                     // a little jump, when it reaches a corner

    readonly property bool shown: svc ? svc.shown : true
    readonly property bool busy: svc ? svc.busy : false
    readonly property color ink: svc ? svc.uiFg : Commons.Color.popups.text
    readonly property color paper: svc ? svc.uiBg : Commons.Color.popups.background
    readonly property color edge: svc ? svc.bodyColor : Commons.Color.accent
    readonly property color accent: svc ? svc.uiAccent : Commons.Color.accent
    readonly property real fs: svc ? svc.uiScale : 1
    readonly property real radius: svc ? svc.uiRadius : 8

    function wake() { lastActive = Date.now(); asleep = false }

    Connections {
        target: root.svc
        enabled: root.svc !== null
        function onAskRequested() { root.wake(); root.menuOpen = false; root.promptOpen = true }
        function onMenuRequested() { root.wake(); root.promptOpen = false; root.menuOpen = true }
        function onReplySerialChanged() { root.wake(); root.bubbleOpen = true; if (root.cfg.bubbleSeconds > 0) bubbleTimer.restart() }
        function onBusyChanged() { if (root.svc.busy) { root.wake(); root.bubbleOpen = true; root.promptOpen = false } }
        function onVoiceStateChanged() { if (root.svc.voiceState !== "idle") { root.wake(); root.bubbleOpen = true } }
        // a request for permission is always shown: the agent waits for Allow or Deny
        function onApprovalChanged() { if (root.svc.approval) { root.wake(); root.svc.shown = true; root.menuOpen = false; root.bubbleOpen = true } }
    }
    Timer { id: bubbleTimer; interval: Math.max(1, root.cfg.bubbleSeconds || 0) * 1000; onTriggered: if (!root.svc.busy) root.bubbleOpen = false }

    // ---- sleeping ----------------------------------------------------------------------------
    Timer {
        interval: 2000
        repeat: true
        running: root.shown
        onTriggered: {
            const mins = root.cfg.sleepAfter || 0
            if (mins <= 0 || root.busy || root.promptOpen || root.menuOpen || root.dragging || root.hovering) { root.lastActive = Date.now(); root.asleep = false; return }
            root.asleep = Date.now() - root.lastActive > mins * 60000
        }
    }

    // ---- where the pointer is: for the eyes, for following, for waking up ------------------------
    Process {
        id: cursor
        command: ["hyprctl", "cursorpos", "-j"]
        stdout: StdioCollector {
            onStreamFinished: {
                let p = null
                try { p = JSON.parse(text) } catch (e) { return }
                const scr = Quickshell.screens[root.screenIndex]
                if (!scr || !p) return
                root.cursorX = p.x - scr.x
                root.cursorY = p.y - scr.y
                const cx = root.posX, cy = root.posY - root.size * 0.55
                const near = Math.hypot(root.cursorX - cx, root.cursorY - cy) < root.size * 1.4
                if (near && root.asleep) root.wake()
                if (near) root.lastActive = Date.now()
                if (root.cfg.eyesFollow === true && !root.asleep) {
                    root.lookX = Math.max(-1, Math.min(1, (root.cursorX - cx) / 300))
                    root.lookY = Math.max(-1, Math.min(1, (root.cursorY - cy) / 300))
                } else { root.lookX = 0; root.lookY = 0 }
            }
        }
    }
    Timer {
        interval: root.tracksCursor ? 60 : 120
        repeat: true
        running: root.shown && !root.dragging
            && (root.cfg.eyesFollow === true || root.tracksCursor || (root.cfg.sleepAfter || 0) > 0)
        onTriggered: if (!cursor.running) cursor.running = true
        onRunningChanged: if (!running) { root.lookX = 0; root.lookY = 0 }
    }

    // ---- moving ---------------------------------------------------------------------------------
    property real vx: 0
    property real vy: 0
    property real tx: -1
    property real ty: -1
    property double restUntil: 0
    property real orbitCx: 0                 // circles: the middle, the radius and where on the circle it is
    property real orbitCy: 0
    property real orbitR: 100
    property real orbitA: 0
    property real waveY: 0                   // rides a wave: the line it rides along, and how far along the curve
    property real wavePh: 0
    property int patrolI: 0                  // patrols: the corner it walks to
    property real spiralPh: 0                // spirals: where on its breathing radius it is
    property real eightCx: 0                 // figure eight: the crossing, the size, how far along the eight
    property real eightCy: 0
    property real eightA: 100
    property real eightU: 0
    property real leapT: -1                  // leaps: how far through the jump (-1 while it is not jumping)
    property real leapDur: 1
    property real leapSx: 0
    property real leapSy: 0
    property real leapTx: 0
    property real leapTy: 0
    property int crossDir: 0                 // heading for the side of the screen to go on to the next monitor: -1, 0 or 1
    property double lastTick: 0
    property real lean: 0

    readonly property bool paused: dragging || menuOpen || asleep
        || (promptOpen && cfg.pauseAsking !== false)
        || (busy && cfg.pauseAsking !== false)
        || (hovering && cfg.pauseHover !== false)

    function bounds() {
        const scr = Quickshell.screens[Math.min(screenIndex, Math.max(0, Quickshell.screens.length - 1))]
        const w = scr ? scr.width : 1920, h = scr ? scr.height : 1080
        // a margin bigger than the room there is would push the pal off the screen
        const m = Math.max(0, Math.min(cfg.areaMargin || 0, (Math.min(w, h) - size) / 2))
        return { w: w, h: h, x0: size / 2 + m, x1: Math.max(size / 2 + m, w - size / 2 - m),
                 y0: size + m, y1: Math.max(size + m, h - m) }
    }
    // ---- going on to the next monitor (Settings > Pal > Moves > Screens) ---------------------------
    readonly property bool canCross: cfg.moveAcross === true && Quickshell.screens.length > 1
    // the monitors from left to right: the screen that lies next to this one, on a side, or -1
    function neighbor(dir) {
        const list = Quickshell.screens
        const order = []
        for (let i = 0; i < list.length; i++) order.push(i)
        order.sort((a, b) => ((list[a].x || 0) - (list[b].x || 0)) || ((list[a].y || 0) - (list[b].y || 0)))
        const k = order.indexOf(Math.min(screenIndex, list.length - 1)) + dir
        return k >= 0 && k < order.length ? order[k] : -1
    }
    // steps onto the neighbouring monitor at the same height, at the edge it comes in by. Returns false when there is none.
    function tryCross(dir) {
        if (!canCross) return false
        const j = neighbor(dir)
        if (j < 0) return false
        const old = bounds()
        const fy = old.y1 > old.y0 ? (posY - old.y0) / (old.y1 - old.y0) : 1
        screenIndex = j
        const nb = bounds()
        posX = dir > 0 ? nb.x0 : nb.x1
        posY = nb.y0 + Math.max(0, Math.min(1, fy)) * (nb.y1 - nb.y0)
        tx = -1; crossDir = 0
        rememberPos()
        return true
    }

    function sign() { return Math.random() < 0.5 ? -1 : 1 }
    function startMotion() {
        tx = -1; ty = -1; vx = 0; vy = 0; lean = 0; restUntil = 0; crossDir = 0; leapT = -1
        if (!hopAnim.running) hop = 0
        const sp = speed
        if (mode === "bounce") {
            const a = (cfg.bounceAngle === "random" ? 15 + Math.random() * 60 : 45) * Math.PI / 180
            vx = Math.cos(a) * sp * sign()
            vy = Math.sin(a) * sp * sign()
        } else if (mode === "horizontal") vx = sp * sign()
        else if (mode === "vertical") vy = sp * sign()
        else if (mode === "circle" || mode === "spiral") {
            spiralPh = Math.PI / 2
            const b = bounds()
            const R = Math.max(10, Math.min(300, 0.35 * Math.min(b.x1 - b.x0, b.y1 - b.y0)))
            const px = posX < 0 ? (b.x0 + b.x1) / 2 : posX, py = posY < 0 ? (b.y0 + b.y1) / 2 : posY
            orbitR = R
            // the circle goes through where it is now, and its middle lies towards the middle of the screen
            let ux = (b.x0 + b.x1) / 2 - px, uy = (b.y0 + b.y1) / 2 - py
            const ul = Math.hypot(ux, uy)
            if (ul < 1) { ux = 0; uy = -1 } else { ux /= ul; uy /= ul }
            orbitCx = px + ux * R
            orbitCy = py + uy * R
            orbitA = Math.atan2(py - orbitCy, px - orbitCx)
        } else if (mode === "figure8") {
            const b = bounds()
            eightCx = posX < 0 ? (b.x0 + b.x1) / 2 : posX      // it starts at the crossing, where it is
            eightCy = posY < 0 ? (b.y0 + b.y1) / 2 : posY
            eightA = Math.max(40, Math.min(280, 0.25 * (b.x1 - b.x0)))
            eightU = 0
        } else if (mode === "wave") {
            const b = bounds()
            vx = sp * sign()
            waveY = posY < 0 ? b.y1 : posY
            // start on the curve exactly where it is, even when the curve has to be kept inside the screen
            const amp = Math.max(0, Math.min(size * 0.9, (b.y1 - b.y0) / 3))
            const by = Math.max(b.y0 + amp, Math.min(b.y1 - amp, waveY))
            wavePh = amp > 0 ? Math.asin(Math.max(-1, Math.min(1, (waveY - by) / amp))) : 0
        } else if (mode === "patrol") {
            const b = bounds()
            const cs = [[b.x0, b.y1], [b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1]]
            let best = 0, bd = 1e12
            for (let i = 0; i < 4; i++) {
                const d = Math.hypot(cs[i][0] - posX, cs[i][1] - posY)
                if (d < bd) { bd = d; best = i }
            }
            patrolI = best
        }
    }
    onModeChanged: startMotion()
    // a new speed keeps the way it is going (dragging the slider must not spin it around)
    onSpeedChanged: {
        const m = Math.hypot(vx, vy)
        if (m > 0) { vx = vx / m * speed; vy = vy / m * speed }
        else startMotion()
    }
    // a screen unplugged: go to one that is left
    readonly property int screenCount: Quickshell.screens.length
    onScreenCountChanged: {
        if (screenCount > 0 && screenIndex >= screenCount) { screenIndex = screenCount - 1; posX = -1; tx = -1 }
    }
    function clampToScreen() {
        const b = bounds()
        posX = Math.max(b.x0, Math.min(b.x1, posX))
        posY = Math.max(b.y0, Math.min(b.y1, posY))
    }
    // remember where it is, on the screen it is on now
    function rememberPos() {
        const scr = Quickshell.screens[Math.min(screenIndex, Math.max(0, Quickshell.screens.length - 1))]
        if (!svc || !scr || scr.width <= 0 || scr.height <= 0) return
        clampToScreen()
        svc.savePos(scr.name, posX / scr.width, posY / scr.height)
    }
    // at start: the screen it was on last, and where
    function restoreScreen() {
        const p = svc ? svc.palPos : null
        if (cfg.rememberPosition === false || !p || !p.screen) return
        for (let i = 0; i < Quickshell.screens.length; i++) {
            if (Quickshell.screens[i].name === p.screen) {
                const scr = Quickshell.screens[i]
                screenIndex = i
                posX = -1
                place(scr.width, scr.height)
                return
            }
        }
    }
    Connections {
        target: root.svc
        enabled: root.svc !== null
        function onLoadedChanged() { root.restoreScreen(); root.startMotion() }
    }

    SequentialAnimation {
        id: hopAnim
        NumberAnimation { target: root; property: "hop"; to: 1; duration: 140; easing.type: Easing.OutQuad }
        NumberAnimation { target: root; property: "hop"; to: 0; duration: 220; easing.type: Easing.InQuad }
    }
    function edgeHit(corner) {
        if (cfg.bounceChange === "skin" && svc) svc.nextSkin()
        else if (cfg.bounceChange === "character" && svc) svc.nextCharacter()
        if (corner) hopAnim.restart()
        if (svc) svc.bounced(corner)
    }

    Timer {
        interval: 16
        repeat: true
        running: root.shown && root.mode !== "still"
        onTriggered: {
            const now = Date.now()
            const dt = root.lastTick > 0 ? Math.min(0.1, (now - root.lastTick) / 1000) : 0.016
            root.lastTick = now
            if (root.paused) { root.lean = 0; return }
            const b = root.bounds()
            const m = root.mode
            let nx = root.posX, ny = root.posY, dx = 0, dy = 0

            if (m === "bounce" || m === "horizontal" || m === "vertical") {
                if (root.vx === 0 && root.vy === 0) root.startMotion()
                nx += root.vx * dt; ny += root.vy * dt
                let hx = false, hy = false
                const roomX = b.x1 - b.x0 > 1, roomY = b.y1 - b.y0 > 1
                if (nx < b.x0) { if (root.tryCross(-1)) return; nx = b.x0; root.vx = Math.abs(root.vx); hx = true }
                else if (nx > b.x1) { if (root.tryCross(1)) return; nx = b.x1; root.vx = -Math.abs(root.vx); hx = true }
                if (ny < b.y0) { ny = b.y0; root.vy = Math.abs(root.vy); hy = true }
                else if (ny > b.y1) { ny = b.y1; root.vy = -Math.abs(root.vy); hy = true }
                dx = root.vx; dy = root.vy
                root.posX = nx; root.posY = ny
                if (!roomX) hx = false
                if (!roomY) hy = false
                if (hx || hy) root.edgeHit(hx && hy)
            } else if (m === "circle") {
                const stepA = root.speed / Math.max(10, root.orbitR) * dt
                root.orbitA += stepA
                nx = root.orbitCx + Math.cos(root.orbitA) * root.orbitR
                ny = root.orbitCy + Math.sin(root.orbitA) * root.orbitR
                dx = (nx - root.posX) / dt; dy = (ny - root.posY) / dt
                root.posX = nx; root.posY = ny
            } else if (m === "spiral") {
                root.spiralPh += dt * 0.45
                const r = Math.max(20, root.orbitR * (0.55 + 0.45 * Math.sin(root.spiralPh)))
                root.orbitA += root.speed / r * dt
                nx = root.orbitCx + Math.cos(root.orbitA) * r
                ny = root.orbitCy + Math.sin(root.orbitA) * r
                dx = (nx - root.posX) / dt; dy = (ny - root.posY) / dt
                root.posX = nx; root.posY = ny
            } else if (m === "figure8") {
                root.eightU += root.speed / Math.max(30, root.eightA * 1.3) * dt
                nx = root.eightCx + Math.sin(root.eightU) * root.eightA
                ny = root.eightCy + Math.sin(root.eightU * 2) * root.eightA * 0.4
                dx = (nx - root.posX) / dt; dy = (ny - root.posY) / dt
                root.posX = nx; root.posY = ny
            } else if (m === "orbitmouse") {
                if (root.cursorX < 0) return
                const keep = Math.max(40, root.cfg.followDistance || 120)
                const rx = nx - root.cursorX, ry = ny - root.cursorY, d = Math.hypot(rx, ry)
                let a = d > 1 ? Math.atan2(ry, rx) : 0
                const onRing = Math.abs(d - keep) < 14
                if (onRing) a += root.speed / keep * dt
                const ex = root.cursorX + Math.cos(a) * keep - nx, ey = root.cursorY + Math.sin(a) * keep - ny, dd = Math.hypot(ex, ey)
                if (dd > 0.5) {
                    const step = Math.min(dd, root.speed * (onRing ? 1.2 : 1.8) * dt)
                    dx = ex / dd * root.speed; dy = ey / dd * root.speed
                    root.posX = nx + ex / dd * step; root.posY = ny + ey / dd * step
                }
            } else if (m === "leap") {
                if (root.leapT < 0) {
                    if (now < root.restUntil) { root.lean = 0; return }
                    const dist = Math.max(100, Math.min(500, root.size * 4)) * (0.5 + Math.random() * 0.5)
                    const a = Math.random() * Math.PI * 2
                    root.leapSx = nx; root.leapSy = ny
                    root.leapTx = Math.max(b.x0, Math.min(b.x1, nx + Math.cos(a) * dist))
                    root.leapTy = Math.max(b.y0, Math.min(b.y1, ny + Math.sin(a) * dist * 0.6))
                    const d0 = Math.hypot(root.leapTx - nx, root.leapTy - ny)
                    if (d0 < 20) return                       // too short a hop: pick again
                    root.leapDur = Math.max(0.35, d0 / (root.speed * 1.5))
                    root.leapT = 0
                }
                root.leapT += dt / root.leapDur
                const u = Math.min(1, root.leapT)
                const lx = root.leapSx + (root.leapTx - root.leapSx) * u, ly = root.leapSy + (root.leapTy - root.leapSy) * u
                dx = (lx - nx) / dt; dy = (ly - ny) / dt
                root.posX = lx; root.posY = ly
                const span = Math.hypot(root.leapTx - root.leapSx, root.leapTy - root.leapSy)
                root.hop = Math.sin(Math.PI * u) * Math.min(span * 0.5, root.size * 1.1) / (root.size * 0.35)
                if (u >= 1) {
                    root.leapT = -1; root.hop = 0
                    if (root.cfg.moveRest !== false) root.restUntil = now + (0.5 + Math.random()) * (root.cfg.restSeconds || 4) * 300
                }
            } else if (m === "wave") {
                if (root.vx === 0) root.startMotion()
                const amp = Math.max(0, Math.min(root.size * 0.9, (b.y1 - b.y0) / 3))
                nx += root.vx * dt
                if (nx < b.x0) { if (root.tryCross(-1)) return; nx = b.x0; root.vx = Math.abs(root.vx) }
                else if (nx > b.x1) { if (root.tryCross(1)) return; nx = b.x1; root.vx = -Math.abs(root.vx) }
                root.wavePh += dt * root.speed / 45
                ny = Math.max(b.y0 + amp, Math.min(b.y1 - amp, root.waveY)) + Math.sin(root.wavePh) * amp
                dx = root.vx
                root.posX = nx; root.posY = ny
            } else if (m === "patrol") {
                const c = [[b.x0, b.y1], [b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1]][root.patrolI % 4]
                const ex = c[0] - nx, ey = c[1] - ny, d = Math.hypot(ex, ey)
                if (d <= 2) root.patrolI = (root.patrolI + 1) % 4
                else {
                    const step = Math.min(d, root.speed * dt)
                    dx = ex / d * root.speed; dy = ey / d * root.speed
                    root.posX = nx + ex / d * step; root.posY = ny + ey / d * step
                }
            } else if (m === "flee") {
                if (root.cursorX < 0) return
                const ex = nx - root.cursorX, ey = ny - root.cursorY, d = Math.hypot(ex, ey)
                const keep = root.cfg.followDistance || 120
                if (d < keep) {
                    const ux = d > 1 ? ex / d : root.sign(), uy = d > 1 ? ey / d : 0
                    const step = root.speed * 1.6 * dt
                    const tryDir = (ax, ay) => {
                        const qx = Math.max(b.x0, Math.min(b.x1, nx + ax * step)), qy = Math.max(b.y0, Math.min(b.y1, ny + ay * step))
                        return [qx, qy, Math.hypot(qx - nx, qy - ny)]
                    }
                    let best = tryDir(ux, uy)
                    // against an edge: slide along it instead of standing still
                    if (best[2] < step * 0.4) {
                        const a = tryDir(-uy, ux), c2 = tryDir(uy, -ux)
                        best = a[2] >= c2[2] ? a : c2
                    }
                    dx = (best[0] - nx) / dt; dy = (best[1] - ny) / dt
                    root.posX = best[0]; root.posY = best[1]
                }
            } else if (m === "stroll" || m === "random" || m === "dart") {
                if (now < root.restUntil) { root.lean = 0; return }
                if (root.tx < 0 || (Math.abs(root.tx - nx) <= 2 && (m === "stroll" || Math.abs(root.ty - ny) <= 2))) {
                    const arrived = root.tx >= 0
                    if (arrived && root.crossDir !== 0) {            // it reached the side it was heading for
                        const dir = root.crossDir
                        root.crossDir = 0
                        if (root.tryCross(dir)) return
                    }
                    root.tx = b.x0 + Math.random() * Math.max(1, b.x1 - b.x0)
                    root.ty = m !== "stroll" ? b.y0 + Math.random() * Math.max(1, b.y1 - b.y0) : ny
                    if (root.canCross && Math.random() < 0.3) {       // now and then: off to the next monitor
                        const sides = []
                        if (root.neighbor(-1) >= 0) sides.push(-1)
                        if (root.neighbor(1) >= 0) sides.push(1)
                        if (sides.length > 0) {
                            root.crossDir = sides[Math.floor(Math.random() * sides.length)]
                            root.tx = root.crossDir > 0 ? b.x1 : b.x0
                        }
                    }
                    if (m === "dart" && !arrived) hopAnim.restart()
                    if (m === "dart" && arrived) hopAnim.restart()
                    if (arrived && root.cfg.moveRest !== false) {
                        root.restUntil = now + (0.5 + Math.random()) * (root.cfg.restSeconds || 4) * 1000
                        return
                    }
                }
                const ex = root.tx - nx, ey = root.ty - ny, d = Math.hypot(ex, ey)
                const sp = m === "dart" ? root.speed * 3.5 : root.speed
                const step = Math.min(d, sp * dt)
                if (d > 0.5) { dx = ex / d * sp; dy = ey / d * sp; root.posX = nx + ex / d * step; root.posY = ny + ey / d * step }
            } else if (m === "follow") {
                if (root.cursorX < 0) return
                const ex = root.cursorX - nx, ey = root.cursorY - ny, d = Math.hypot(ex, ey)
                const keep = root.cfg.followDistance || 120
                if (d > keep + 4) {
                    const step = Math.min(d - keep, root.speed * dt)
                    dx = ex / d * root.speed; dy = ey / d * root.speed
                    root.posX = nx + ex / d * step; root.posY = ny + ey / d * step
                }
            }
            if (dx !== 0) root.facingLeft = dx < 0
            root.lean = root.cfg.lean === true ? Math.max(-1, Math.min(1, dx / root.speed)) * 8 : 0
            root.posX = Math.max(b.x0, Math.min(b.x1, root.posX))
            root.posY = Math.max(b.y0, Math.min(b.y1, root.posY))
        }
    }

    function place(w, h) {
        if (posX < 0) {
            const p = svc ? svc.palPos : null
            const scr = Quickshell.screens[screenIndex]
            if (cfg.rememberPosition !== false && p && p.fx !== undefined && scr && p.screen === scr.name) {
                posX = p.fx * w; posY = p.fy * h
            } else { posX = w - 140; posY = h - 24 }
        }
        const b = bounds()
        posX = Math.max(b.x0, Math.min(b.x1, posX))
        posY = Math.max(b.y0, Math.min(b.y1, posY))
    }

    function clickAction(name) {
        wake()
        if (!svc) return
        // While a request is running, the default Ask click shows or hides its live status bubble.
        // It must not open the prompt, since send() rejects a second request while busy.
        if (name === "ask" && busy) {
            menuOpen = false
            promptOpen = false
            bubbleOpen = !bubbleOpen
            return
        }
        if (name === "ask") { menuOpen = false; promptOpen = !promptOpen; if (!promptOpen) bubbleOpen = false }
        else if (name === "menu") { promptOpen = false; menuOpen = !menuOpen }
        else { menuOpen = false; svc.perform(name) }
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: win
            required property var modelData
            readonly property int myIndex: {
                const list = Quickshell.screens
                for (let i = 0; i < list.length; i++) if (list[i] === modelData || (list[i] && modelData && list[i].name === modelData.name)) return i
                return 0
            }
            readonly property bool here: myIndex === Math.min(root.screenIndex, Math.max(0, Quickshell.screens.length - 1))

            screen: modelData
            visible: root.shown && here && (!root.svc || root.svc.loaded)
            anchors { top: true; bottom: true; left: true; right: true }
            color: "transparent"
            exclusionMode: ExclusionMode.Ignore
            WlrLayershell.layer: WlrLayer.Overlay
            WlrLayershell.namespace: "pawmpt"
            WlrLayershell.keyboardFocus: root.promptOpen ? WlrKeyboardFocus.OnDemand : WlrKeyboardFocus.None

            onWidthChanged: if (here && width > 0) root.place(width, height)
            onHeightChanged: if (here && height > 0) root.place(width, height)
            onVisibleChanged: if (visible && width > 0) root.place(width, height)
            Component.onCompleted: {
                const w = width > 0 ? width : (modelData ? modelData.width : 1920)
                const h = height > 0 ? height : (modelData ? modelData.height : 1080)
                if (here) root.place(w, h)
            }

            Region { id: smallMask; Region { item: palHit } Region { item: bubbleHit } Region { item: promptHit } Region { item: menuHit } }
            Region { id: fullMask; x: 0; y: 0; width: win.width; height: win.height }
            mask: (root.dragging || root.promptOpen || root.menuOpen) ? fullMask : smallMask

            // a click anywhere else closes the prompt and the menu
            MouseArea {
                anchors.fill: parent
                z: -1
                enabled: root.promptOpen || root.menuOpen
                onPressed: { root.promptOpen = false; root.menuOpen = false }
            }

            // ---- the pal ---------------------------------------------------------------
            Item {
                id: palHit
                width: root.size
                height: root.size
                x: root.posX - width / 2
                y: root.posY - height - root.hop * root.size * 0.35
                opacity: Math.max(0.2, (root.cfg.opacity || 100) / 100)

                Critter {
                    anchors.fill: parent
                    kind: root.cfg.character || "blob"
                    source: root.svc ? root.svc.characterSource(kind) : ""
                    skin: root.svc ? root.svc.skinOpts : ({})
                    items: root.svc ? root.svc.dress : []
                    lookX: root.lookX
                    lookY: root.lookY
                    busy: root.busy
                    asleep: root.asleep
                    shadow: root.cfg.shadow === true
                    idle: root.dragging ? "bob" : (root.cfg.idle || "breathe")
                    blinks: root.cfg.blink !== false
                    flipped: root.cfg.faceMovement !== false && root.mode !== "still" && root.mode !== "vertical" && root.facingLeft
                    lean: root.lean
                    animate: win.visible
                }

                MouseArea {
                    anchors.fill: parent
                    acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
                    hoverEnabled: true
                    cursorShape: root.dragging ? Qt.ClosedHandCursor : Qt.PointingHandCursor
                    property real sx: 0
                    property real sy: 0
                    property bool moved: false
                    onContainsMouseChanged: { root.hovering = containsMouse; if (containsMouse) root.wake() }
                    onPressed: (m) => { sx = m.x; sy = m.y; moved = false; root.wake() }
                    onPositionChanged: (m) => {
                        if (!(m.buttons & Qt.LeftButton) || root.cfg.draggable === false) return
                        if (!moved && Math.hypot(m.x - sx, m.y - sy) < 5) return
                        moved = true
                        root.dragging = true
                        root.tx = -1
                        const p = mapToItem(null, m.x, m.y)
                        root.posX = p.x - sx + root.size / 2
                        root.posY = p.y - sy + root.size
                    }
                    onReleased: (m) => {
                        if (root.dragging) {
                            root.dragging = false
                            const n = Quickshell.screens.length
                            // at a screen's side edge: move on to the next screen
                            if (root.cfg.edgeToNextScreen !== false && n > 1 && root.posX >= win.width - root.size * 0.3) { root.screenIndex = (root.screenIndex + 1) % n; root.posX = root.size; root.tx = -1 }
                            else if (root.cfg.edgeToNextScreen !== false && n > 1 && root.posX <= root.size * 0.3) { root.screenIndex = (root.screenIndex + n - 1) % n; root.posX = 1e6; root.tx = -1 }
                            else root.place(win.width, win.height)
                            root.clampToScreen()
                            root.rememberPos()
                            root.startMotion()      // whatever it does, it does from exactly here
                            return
                        }
                        if (moved) return
                        if (m.button === Qt.RightButton) root.clickAction(root.cfg.rightClick)
                        else if (m.button === Qt.MiddleButton) root.clickAction(root.cfg.middleClick)
                        else root.clickAction(root.cfg.leftClick)
                    }
                }
            }

            // what goes beside the pal: the prompt, then the bubble, stacked away from it
            readonly property real boxW: Math.min(win.width - 20, Math.max(200, root.cfg.bubbleWidth || 340))
            readonly property real boxX: Math.max(10, Math.min(win.width - boxW - 10, root.posX - boxW / 2))
            readonly property bool roomAbove: root.cfg.bubblePlace === "above" ? true
                : root.cfg.bubblePlace === "below" ? false : palHit.y > 160

            // ---- the prompt -------------------------------------------------------------------
            Rectangle {
                id: promptHit
                visible: root.promptOpen
                width: visible ? win.boxW : 0
                height: visible ? 40 * root.fs : 0
                x: win.boxX
                y: win.roomAbove ? palHit.y - height - 8 : palHit.y + palHit.height + 8
                radius: root.radius + 4
                color: root.paper
                border.color: root.edge
                border.width: 2

                TextInput {
                    id: input
                    anchors.fill: parent
                    anchors.leftMargin: 14
                    anchors.rightMargin: micBtn.visible ? micBtn.width + 16 : 14
                    verticalAlignment: TextInput.AlignVCenter
                    color: root.ink
                    font.pixelSize: 14 * root.fs
                    clip: true
                    selectByMouse: true
                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        visible: !input.text
                        text: root.busy ? "still working on the last one…" : (root.svc && root.svc.conversationKept ? "Reply, Enter to send (same conversation)" : "Ask me something, Enter to send")
                        color: root.ink
                        opacity: 0.5
                        font.pixelSize: 14 * root.fs
                        textFormat: Text.PlainText
                    }
                    property int histIdx: -1       // the up arrow goes back through what you asked before
                    function recall(step) {
                        const h = root.svc ? root.svc.asked : []
                        if (h.length === 0) return
                        histIdx = Math.max(-1, Math.min(h.length - 1, histIdx + step))
                        text = histIdx < 0 ? "" : h[h.length - 1 - histIdx]
                        cursorPosition = text.length
                    }
                    Keys.onUpPressed: recall(1)
                    Keys.onDownPressed: recall(-1)
                    Keys.onReturnPressed: { if (root.svc) root.svc.send(text); text = ""; histIdx = -1; root.promptOpen = false }
                    Keys.onEnterPressed: { if (root.svc) root.svc.send(text); text = ""; histIdx = -1; root.promptOpen = false }
                    Keys.onEscapePressed: { text = ""; histIdx = -1; root.promptOpen = false }
                }
                onVisibleChanged: if (visible) { input.histIdx = -1; focusTimer.restart() }
                Timer { id: focusTimer; interval: 60; onTriggered: input.forceActiveFocus() }

                // what was said by voice, when it goes in the box to be read first (Settings > Agent > Voice)
                Connections {
                    target: root.svc
                    enabled: root.svc !== null
                    function onDraftSerialChanged() {
                        if (!root.svc.draft) return
                        input.text = root.svc.draft
                        input.cursorPosition = input.text.length
                    }
                }

                // the microphone: starts listening, then finishes the dictation when clicked again
                Rectangle {
                    id: micBtn
                    readonly property bool live: !!root.svc && root.svc.voiceState === "listening"
                    visible: !!root.svc && root.svc.voiceOn
                    width: 28 * root.fs
                    height: width
                    radius: width / 2
                    anchors.right: parent.right
                    anchors.rightMargin: 8
                    anchors.verticalCenter: parent.verticalCenter
                    color: live ? Commons.Color.urgent : "transparent"
                    border.color: live ? Commons.Color.urgent : root.edge
                    border.width: 2
                    opacity: !!root.svc && (root.svc.voiceState === "starting" || root.svc.voiceState === "transcribing") ? 0.5 : 1
                    Rectangle {      // the capsule
                        width: parent.width * 0.24; height: parent.height * 0.38; radius: width / 2
                        x: (parent.width - width) / 2; y: parent.height * 0.18
                        color: micBtn.live ? "white" : root.ink
                    }
                    Rectangle {      // the stand
                        width: parent.width * 0.06; height: parent.height * 0.14
                        x: (parent.width - width) / 2; y: parent.height * 0.58
                        color: micBtn.live ? "white" : root.ink
                    }
                    Rectangle {      // the foot
                        width: parent.width * 0.3; height: parent.height * 0.06; radius: height / 2
                        x: (parent.width - width) / 2; y: parent.height * 0.72
                        color: micBtn.live ? "white" : root.ink
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: if (root.svc) root.svc.voice("toggle")
                    }
                }
            }

            // ---- quick actions, under (or over) the question box -------------------------------------
            Flow {
                id: quickHit
                visible: root.promptOpen && !!root.svc && root.cfg.showQuick !== false && !root.busy && !bubbleHit.on
                width: visible ? win.boxW : 0
                x: win.boxX
                y: win.roomAbove ? promptHit.y - height - 6 : promptHit.y + promptHit.height + 6
                spacing: 6
                Repeater {
                    model: root.svc ? root.svc.quickActions : []
                    delegate: Rectangle {
                        required property var modelData
                        width: ql.implicitWidth + 18
                        height: 24 * root.fs
                        radius: Math.min(root.radius, 10)
                        color: qm.containsMouse ? Qt.rgba(root.accent.r, root.accent.g, root.accent.b, 0.25) : root.paper
                        border.color: root.edge
                        border.width: 1
                        Text { id: ql; anchors.centerIn: parent; text: parent.modelData.label; color: root.ink; font.pixelSize: 11 * root.fs; textFormat: Text.PlainText }
                        MouseArea {
                            id: qm
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { root.svc.quick(parent.modelData.key); root.promptOpen = false }
                        }
                    }
                }
            }

            // ---- the speech bubble ----------------------------------------------------------
            Rectangle {
                id: bubbleHit
                readonly property bool on: root.bubbleOpen && !!root.svc && (root.busy || root.svc.reply !== "" || root.svc.voiceState !== "idle")
                readonly property real wantH: bubbleCol.implicitHeight + 24
                visible: on
                width: on ? win.boxW : 0
                height: on ? Math.min(win.height * 0.6, wantH) : 0
                x: win.boxX
                y: win.roomAbove
                    ? (promptHit.visible ? promptHit.y : palHit.y) - height - 8
                    : (promptHit.visible ? promptHit.y + promptHit.height : palHit.y + palHit.height) + 8
                radius: root.radius + 6
                color: root.paper
                border.color: root.svc && !root.svc.replyOk ? Commons.Color.urgent : root.edge
                border.width: 2

                // keep the newest text in view while it streams in
                Flickable {
                    id: bubbleFlick
                    anchors.fill: parent
                    anchors.margins: 12
                    anchors.bottomMargin: actionsRow.height + 24
                    contentHeight: bubbleCol.implicitHeight - (actionsRow.height + 12)
                    clip: true
                    boundsBehavior: Flickable.StopAtBounds
                    onContentHeightChanged: if (root.busy) contentY = Math.max(0, contentHeight - height)
                    Column {
                        id: bubbleCol
                        width: bubbleFlick.width
                        spacing: 6
                        Text {
                            width: bubbleCol.width
                            visible: !!root.svc && root.svc.voiceState !== "idle"
                            text: root.svc ? root.svc.voiceNote : ""
                            textFormat: Text.PlainText
                            wrapMode: Text.Wrap
                            color: root.ink
                            font.pixelSize: (root.cfg.bubbleFont || 13) * root.fs
                        }
                        Repeater {
                            model: root.svc && root.cfg.showActivity !== false ? root.svc.activity : []
                            delegate: Text {
                                required property var modelData
                                width: bubbleCol.width
                                text: modelData
                                textFormat: Text.PlainText
                                elide: Text.ElideRight
                                color: root.ink
                                opacity: 0.55
                                font.pixelSize: 11 * root.fs
                                font.family: "monospace"
                            }
                        }
                        Text {
                            width: bubbleCol.width
                            visible: root.busy && !!root.svc && root.svc.reply === ""
                            text: "thinking" + ".".repeat(1 + Math.floor(dots.n % 3))
                            textFormat: Text.PlainText
                            color: root.ink
                            opacity: 0.7
                            font.pixelSize: (root.cfg.bubbleFont || 13) * root.fs
                            Timer { id: dots; property int n: 0; interval: 400; repeat: true; running: parent.visible; onTriggered: n++ }
                        }
                        TextEdit {
                            id: replyText
                            width: bubbleCol.width
                            visible: text !== ""
                            text: root.svc ? root.svc.reply : ""
                            textFormat: TextEdit.PlainText
                            wrapMode: TextEdit.Wrap
                            readOnly: true
                            selectByMouse: true
                            color: root.ink
                            selectionColor: root.edge
                            font.pixelSize: (root.cfg.bubbleFont || 13) * root.fs
                        }
                        Rectangle {
                            width: bubbleCol.width
                            visible: !!root.svc && !!root.svc.approval
                            radius: 8 * root.fs
                            color: Qt.rgba(root.accent.r, root.accent.g, root.accent.b, 0.1)
                            border.color: root.accent
                            height: visible ? approvalCol.implicitHeight + 16 * root.fs : 0
                            Column {
                                id: approvalCol
                                anchors.fill: parent
                                anchors.margins: 8 * root.fs
                                spacing: 4 * root.fs
                                Text { width: parent.width; text: root.svc && root.svc.approval ? root.svc.approval.title : ""; color: root.ink; font.bold: true; wrapMode: Text.Wrap; textFormat: Text.PlainText }
                                Text { width: parent.width; text: root.svc && root.svc.approval ? root.svc.approval.detail : ""; color: root.ink; wrapMode: Text.Wrap; textFormat: Text.PlainText; font.family: "monospace"; font.pixelSize: 11 * root.fs }
                            }
                        }
                        Text {
                            width: bubbleCol.width
                            visible: text !== "" && !root.busy && root.cfg.showUsage !== false
                            text: root.svc ? [root.svc.usage, root.svc.sessionId ? "in " + root.svc.workDir.replace(/^\/home\/[^\/]+/, "~") : ""].filter((x) => x).join(" · ") : ""
                            color: root.ink
                            opacity: 0.45
                            font.pixelSize: 10 * root.fs
                            textFormat: Text.PlainText
                            elide: Text.ElideRight
                        }
                        Item { width: 1; height: actionsRow.height + 12 }
                    }
                }

                // the buttons along the bottom
                Flow {
                    id: actionsRow
                    anchors.left: parent.left
                    anchors.bottom: parent.bottom
                    anchors.margins: 10
                    width: parent.width - 20 - 30        // keeps clear of the × at the right
                    spacing: 6
                    Repeater {
                        model: {
                            const s = root.svc
                            if (!s) return []
                            const out = []
                            if (s.busy) {
                                if (s.approval) {
                                    out.push({ label: "Allow once", act: () => s.answerApproval(true) })
                                    if (s.approval.allowAll === true)
                                        out.push({ label: "Allow all this run", act: () => s.answerApproval(true, true) })
                                    out.push({ label: "Deny", act: () => s.answerApproval(false) })
                                }
                                out.push({ label: "Stop", act: () => s.stop() })
                            }
                            else {
                                out.push({ label: "Reply", act: () => { root.promptOpen = true } })
                                if (s.reply) out.push({ label: "Copy", act: () => s.copyText(s.reply) })
                                const code = s.lastCode()
                                if (code) out.push({ label: "Copy code", act: () => s.copyText(code) })
                                if (s.lastQuestion) out.push({ label: "Retry", act: () => s.retry() })
                                // carry on the chat in one click (only when the conversation is remembered)
                                if (s.reply && s.replyOk && root.cfg.showFollowUps !== false && s.conversationKept)
                                    for (let i = 0; i < s.followUps.length; i++) {
                                        const f = s.followUps[i]
                                        out.push({ label: f.label, act: () => s.send(f.prompt) })
                                    }
                                if (s.sessionId || s.history.length > 0) out.push({ label: "New chat", act: () => { s.newChat(); root.bubbleOpen = false } })
                                if (s.sessionId && s.settings.agent === "opencode") out.push({ label: "Open in opencode", act: () => s.openInTerminal() })
                            }
                            return out
                        }
                        delegate: Rectangle {
                            required property var modelData
                            width: bl.implicitWidth + 16
                            height: 24 * root.fs
                            radius: Math.min(root.radius, 8)
                            color: bm.containsMouse ? Qt.rgba(root.accent.r, root.accent.g, root.accent.b, 0.2) : "transparent"
                            border.color: Qt.rgba(root.ink.r, root.ink.g, root.ink.b, 0.2)
                            Text { id: bl; anchors.centerIn: parent; text: parent.modelData.label; color: root.ink; font.pixelSize: 11 * root.fs; textFormat: Text.PlainText }
                            MouseArea { id: bm; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: parent.modelData.act() }
                        }
                    }
                }
                Text {
                    anchors.right: parent.right
                    anchors.bottom: parent.bottom
                    anchors.margins: 12
                    text: "×"
                    color: root.ink
                    font.pixelSize: 16
                    MouseArea { anchors.fill: parent; anchors.margins: -6; cursorShape: Qt.PointingHandCursor; onClicked: root.bubbleOpen = false }
                }
            }

            // ---- the menu -----------------------------------------------------------------------
            Rectangle {
                id: menuHit
                visible: root.menuOpen
                width: visible ? 160 * root.fs : 0
                height: visible ? menuCol.implicitHeight + 12 : 0
                x: root.posX + root.size / 2 + 160 * root.fs + 8 < win.width ? palHit.x + palHit.width + 8 : palHit.x - width - 8
                y: Math.max(8, Math.min(win.height - height - 8, palHit.y + palHit.height - height))
                radius: root.radius + 2
                color: root.paper
                border.color: root.svc ? root.svc.uiLine : Commons.Color.popups.border
                border.width: 1

                Column {
                    id: menuCol
                    anchors.fill: parent
                    anchors.margins: 6
                    Repeater {
                        model: [
                            { label: "Ask", act: () => { root.menuOpen = false; root.promptOpen = true } },
                            { label: "New chat", act: () => { root.menuOpen = false; if (root.svc) root.svc.newChat() } },
                            { label: "Next character", act: () => root.svc && root.svc.nextCharacter() },
                            { label: "Next skin", act: () => root.svc && root.svc.nextSkin() },
                            { label: "Surprise me", act: () => { root.menuOpen = false; if (root.svc) root.svc.surprise() } },
                            { label: "Wardrobe", act: () => { root.menuOpen = false; if (root.svc) root.svc.openSettings("wardrobe") } },
                            { label: "Settings", act: () => { root.menuOpen = false; if (root.svc) root.svc.openSettings("settings") } },
                            { label: "Hide", act: () => { root.menuOpen = false; if (root.svc) root.svc.shown = false } }
                        ]
                        delegate: Rectangle {
                            required property var modelData
                            width: menuCol.width
                            height: 30 * root.fs
                            radius: Math.min(root.radius, 8)
                            color: hov.containsMouse ? Qt.rgba(root.accent.r, root.accent.g, root.accent.b, 0.18) : "transparent"
                            Text {
                                anchors.verticalCenter: parent.verticalCenter
                                x: 10
                                text: parent.modelData.label
                                color: root.ink
                                font.pixelSize: 13 * root.fs
                                textFormat: Text.PlainText
                            }
                            MouseArea { id: hov; anchors.fill: parent; hoverEnabled: true; onClicked: parent.modelData.act() }
                        }
                    }
                }
            }
        }
    }

    // ---- settings and wardrobe ---------------------------------------------------------------
    // The panel by the bar is Panel.qml, hosted by the bar button. This is the panel as a window of
    // its own: Settings > Window > Open as, Pop out, or when there is no bar button to hang from.
    LazyLoader {
        active: root.svc ? root.svc.settingsOpen && root.svc.surface === "window" : false
        PopoutWindow { svc: root.svc }
    }
}
