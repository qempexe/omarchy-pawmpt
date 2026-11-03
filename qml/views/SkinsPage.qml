import QtQuick
import QtQuick.Layouts
import "../js/Skins.js" as Skins
import "../controls"

// The Skins page of the Wardrobe: the ready made skins, the ones you saved, saving the one
// you have now, and Surprise me.
Flickable {
    id: root

    property var ui: null
    readonly property var svc: ui ? ui.service : null
    readonly property var cfg: svc ? svc.settings : ({})

    clip: true
    boundsBehavior: Flickable.StopAtBounds
    contentWidth: width
    contentHeight: col.implicitHeight + ui.px(8)

    ColumnLayout {
        id: col
        width: root.width
        spacing: ui.px(10)

        Txt { ui: root.ui; text: "READY MADE"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Flow {
            Layout.fillWidth: true
            spacing: ui.px(6)
            Repeater {
                model: Skins.presets
                delegate: Chip {
                    required property var modelData
                    ui: root.ui
                    label: modelData.name
                    dot: true
                    tone: Qt.color(modelData.palTheme ? root.ui.accent : modelData.palBody)
                    on: root.cfg.skin === modelData.name
                    onClicked: root.svc.applySkin(modelData.name)
                }
            }
        }

        Txt { ui: root.ui; text: "YOURS"; visible: !!root.svc && root.svc.skins.length > 0; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Flow {
            Layout.fillWidth: true
            spacing: ui.px(6)
            Repeater {
                model: root.svc ? root.svc.skins : []
                delegate: Row {
                    required property var modelData
                    spacing: 2
                    Chip {
                        ui: root.ui
                        label: modelData.name
                        dot: true
                        tone: Qt.color(modelData.palTheme ? root.ui.accent : modelData.palBody)
                        on: root.cfg.skin === modelData.name
                        onClicked: root.svc.applySkin(modelData.name)
                    }
                    Btn { ui: root.ui; text: "×"; implicitWidth: ui.px(24); onClicked: root.svc.deleteSkin(modelData.name) }
                }
            }
        }

        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
        Txt { ui: root.ui; text: "SAVE THIS ONE"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Txt {
            ui: root.ui
            Layout.fillWidth: true
            wrapMode: Text.Wrap
            opacity: 0.6
            font.pixelSize: ui.fs(10)
            text: "Saves the colors, fill, pattern, outline, glow, eyes and mouth you have now."
        }
        Field { id: skinName; ui: root.ui; key: "skins:name"; Layout.fillWidth: true; Layout.maximumWidth: ui.px(420); placeholder: "A name"; maxLength: 24 }
        RowLayout {
            spacing: ui.px(6)
            Chip {
                id: withDress
                property bool yes: true
                ui: root.ui
                label: yes ? "With what it wears ✓" : "Without what it wears"
                on: yes
                onClicked: yes = !yes
            }
            Btn {
                ui: root.ui
                kind: "primary"
                text: "Save"
                onClicked: { if (root.svc.saveSkin(skinName.value, withDress.yes)) skinName.set("") }
            }
        }

        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
        Btn { ui: root.ui; text: "Surprise me"; onClicked: root.svc.surprise() }
    }
}
