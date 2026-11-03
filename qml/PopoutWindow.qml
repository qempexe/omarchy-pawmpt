import QtQuick
import Quickshell
import "views"

// The same Pawmpt panel, as a normal window you can move, resize and tile.
// Pal.qml creates it when the panel opens as "Own window" or on "Pop out", and destroys it on
// "Dock" or when it is closed.
//
// To make Hyprland float and center it (it tiles by default), add window rules that match
// the title "Pawmpt"; see the README.
FloatingWindow {
    id: win

    property var svc: null
    readonly property var ui: svc ? svc.ux : null

    title: "Pawmpt"
    visible: true
    color: "transparent"
    implicitWidth: ui ? ui.cfgSafe.windowWidth : 560
    implicitHeight: ui ? ui.cfgSafe.windowHeight : 680

    // closing the window closes the panel, but not when it is only moving back to the bar
    onVisibleChanged: if (!visible && svc && svc.surface === "window") {
        console.warn("Pawmpt: the window was closed")
        svc.closeSettings()
    }

    Loader {
        anchors.fill: parent
        active: win.ui !== null
        sourceComponent: Component { PalView { ui: win.ui; focus: true } }
    }
}
