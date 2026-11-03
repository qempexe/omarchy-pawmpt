import QtQuick
import Quickshell
import qs.Commons
import qs.Ui
import "controls"
import "js/Draw.js" as Draw

// The bar button: a tiny copy of your pal (or an icon). What the three mouse buttons do is
// set in Settings › Bar. Open Pawmpt opens (and closes) the panel, which hangs off the bar
// (Panel.qml) or, when it cannot, opens as a window of its own.
BarWidget {
    id: root

    moduleName: "io.github.qempexe.pawmpt"

    property var svc: null
    function lookup() {
        if (svc) return
        try {
            if (bar && bar.shell) {
                if (typeof bar.shell.serviceFor === "function") svc = bar.shell.serviceFor(moduleName)
                else if (bar.shell.services && bar.shell.services[moduleName]) svc = bar.shell.services[moduleName]
            }
        } catch (e) { svc = null }
    }
    Timer { interval: 250; repeat: true; running: root.svc === null; onTriggered: root.lookup() }

    readonly property var cfg: svc ? svc.settings : ({})

    // Every bar has this button, and the panel opens only on the one on the focused screen.
    readonly property string screenName: {
        try { return String(root.QsWindow.window.screen.name) } catch (e) { return "" }
    }
    function register() { if (svc && screenName !== "") svc.registerBar(screenName) }
    onScreenNameChanged: register()
    readonly property bool isHost: !svc || svc.panelScreen === "" || screenName === "" || svc.panelScreen === screenName

    // The bar's own colours and font, handed to the service for the panel. They fall back to the
    // shell palette if the bar does not expose them.
    readonly property color barFg: (root.bar && root.bar.barForeground !== undefined)
        ? root.bar.barForeground : (Color.foreground !== undefined ? Color.foreground : "white")
    readonly property color barBg: (root.bar && root.bar.barBackground !== undefined)
        ? root.bar.barBackground : (Color.background !== undefined ? Color.background : "#121217")
    Binding { target: root.svc; property: "barFg"; value: root.barFg; when: root.svc !== null }
    Binding { target: root.svc; property: "barBg"; value: root.barBg; when: root.svc !== null }
    Binding { target: root.svc; property: "barFont"; value: root.bar && root.bar.fontFamily ? root.bar.fontFamily : ""; when: root.svc !== null }

    // ---- the panel by the bar (Panel.qml), with a way out when it does not show ----------------
    // If Panel.qml fails to load, or does not open within about half a second, the panel opens as a
    // window of its own instead of silently doing nothing.
    function injectPanel() {
        const p = panelLoader.item
        if (!p) return
        p.bar = root.bar
        p.anchorItem = button
        p.hostWidget = root
        p.ui = Qt.binding(function() { return root.svc ? root.svc.ux : null })
    }
    onBarChanged: { lookup(); injectPanel() }
    Loader {
        id: panelLoader
        source: "Panel.qml"
        onStatusChanged: {
            if (status === Loader.Ready) root.injectPanel()
            else if (status === Loader.Error) console.warn("Pawmpt: Panel.qml failed to load, the panel opens as a window")
            root.syncReady()
        }
    }
    function syncReady() { if (svc) svc.barPanelReady = panelLoader.status === Loader.Ready }
    onSvcChanged: { syncReady(); register() }

    readonly property bool wantPanel: !!svc && svc.settingsOpen && svc.surface === "panel" && isHost
    onWantPanelChanged: {
        const p = panelLoader.item
        if (wantPanel) {
            if (!p) { if (svc) svc.popOut(); return }
            p.open()
            openCheck.restart()
        } else if (p && p.opened) p.close()
    }
    Timer {
        id: openCheck
        interval: 600
        onTriggered: {
            const p = panelLoader.item
            if (root.wantPanel && p && !p.opened) {
                console.warn("Pawmpt: the panel did not open, opening it as a window")
                root.svc.popOut()
            }
        }
    }
    // closed from the panel itself (Esc, a click outside, the next bar panel): keep the service in step
    Connections {
        target: panelLoader.item
        ignoreUnknownSignals: true
        function onOpenedChanged() {
            if (root.isHost && panelLoader.item && !panelLoader.item.opened && root.svc && root.svc.settingsOpen && root.svc.surface === "panel") {
                console.warn("Pawmpt: the panel closed by itself, so the settings are marked closed")
                root.svc.closeSettings()
            }
        }
    }

    // The shell's panel contract: whether the panel is open, and ways to open and close it.
    readonly property bool opened: !!svc && svc.settingsOpen && svc.surface === "panel" && isHost && !!panelLoader.item && panelLoader.item.opened === true
    readonly property bool popoutSwitchClosing: false
    function closeForPopoutSwitch() { if (svc && svc.surface === "panel") svc.closeSettings() }
    function open() { if (svc) svc.openSettings(svc.panelTab) }
    function close() { if (svc) svc.closeSettings() }
    function toggle() { if (svc) svc.toggleSettings(svc.panelTab) }

    function act(name) {
        if (!svc) return
        // a click outside the panel just closed it, and that same click may be on this button
        if ((name === "panel" || name === "wardrobe") && panelLoader.item && panelLoader.item.justClosedByGrab === true) return
        if (name === "toggle") svc.toggleShown()
        else if (name === "panel") svc.toggleSettings("settings")
        else if (name === "wardrobe") svc.toggleSettings("wardrobe")
        else if (name === "ask") svc.ask()
        else if (name === "voice") svc.voice("toggle")
    }

    implicitWidth: button.implicitWidth
    implicitHeight: button.implicitHeight

    WidgetButton {
        id: button
        anchors.fill: parent
        bar: root.bar
        labelVisible: false
        hasVisualContent: true
        tooltipText: root.svc && !root.svc.shown ? "Show your pal" : "Pawmpt"
        fixedWidth: root.vertical ? -1 : Math.round(iconBox.width + scaledHorizontalMargin * 2)
        fixedHeight: root.vertical ? Math.round(iconBox.height + scaledVerticalPadding * 2) : -1

        onPressed: function(buttonCode) {
            if (buttonCode === Qt.LeftButton) root.act(root.cfg.barLeft || "toggle")
            else if (buttonCode === Qt.MiddleButton) root.act(root.cfg.barMiddle || "ask")
        }

        // The drawing leaves room for hats and stands on its canvas's bottom edge, so the pal is
        // sized and placed by what it really draws (Draw.bounds): its body fills the icon's
        // square and sits in the middle of the button, like the bar's other icons.
        Item {
            id: iconBox
            anchors.centerIn: parent
            width: Math.round(Style.bar.iconCanvas * 1.35)
            height: width
            visible: root.cfg.barShows !== "icon"

            readonly property var box: mini.custom ? ({ x0: 0, y0: 0, x1: 1, y1: 1 }) : Draw.bounds(mini.kind)
            readonly property real span: Math.max(0.2, box.x1 - box.x0, box.y1 - box.y0)
            readonly property real side: Math.min(width * 2.5, width / span)

            Critter {
                id: mini
                width: iconBox.side
                height: width
                x: Math.round(iconBox.width / 2 - (iconBox.box.x0 + iconBox.box.x1) / 2 * width)
                y: Math.round(iconBox.height / 2 - (iconBox.box.y0 + iconBox.box.y1) / 2 * height)
                kind: root.cfg.character || "blob"
                source: root.svc ? root.svc.characterSource(kind) : ""
                skin: root.svc ? root.svc.skinOpts : ({})
                items: root.svc ? root.svc.dress : []
                idle: "still"
                blinks: true
                busy: root.svc ? root.svc.busy : false
                opacity: root.svc && !root.svc.shown ? 0.5 : 1
            }
        }
        Text {
            anchors.centerIn: parent
            visible: root.cfg.barShows === "icon"
            text: "☺"
            color: Color.foreground
            font.pixelSize: Math.round(Style.bar.iconCanvas * 1.1)
            opacity: root.svc && !root.svc.shown ? 0.5 : 1
            textFormat: Text.PlainText
        }
    }

    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.RightButton
        onClicked: root.act(root.cfg.barRight || "panel")
    }
}
