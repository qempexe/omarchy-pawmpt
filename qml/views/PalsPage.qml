import QtQuick
import QtQuick.Layouts
import "../controls"

// The Pals page of the Wardrobe: a whole pal saved as one (the character, its skin and colors and
// what it wears), and the pals you saved. The Skins page keeps saving only the skin.
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

        Txt { ui: root.ui; text: "SAVE THE PAL YOU HAVE NOW"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Txt {
            ui: root.ui
            Layout.fillWidth: true
            wrapMode: Text.Wrap
            opacity: 0.6
            font.pixelSize: ui.fs(10)
            text: "Saves the character, its skin and colors, and what it wears, together as one. Saving under a name you used before replaces that one."
        }
        RowLayout {
            Layout.fillWidth: true
            spacing: ui.px(6)
            Field { id: palName; ui: root.ui; key: "pals:name"; Layout.fillWidth: true; Layout.maximumWidth: ui.px(320); placeholder: "A name"; maxLength: 24 }
            Btn {
                ui: root.ui
                kind: "primary"
                text: "Save"
                onClicked: { if (root.svc.savePal(palName.value)) palName.set("") }
            }
        }

        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
        Txt { ui: root.ui; text: "YOUR PALS"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Txt {
            ui: root.ui
            visible: !root.svc || root.svc.pals.length === 0
            opacity: 0.6
            font.pixelSize: ui.fs(10)
            text: "None saved yet."
        }

        Repeater {
            model: root.svc ? root.svc.pals : []
            delegate: Rectangle {
                id: row
                required property var modelData
                Layout.fillWidth: true
                implicitHeight: ui.px(64)
                radius: ui.r(1.4)
                color: ui.tint(rowArea.containsMouse ? 0.08 : 0.04)
                border.width: 1
                border.color: ui.tint(0.08)

                MouseArea {
                    id: rowArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.svc.applyPal(row.modelData.name)
                }
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: ui.px(8)
                    spacing: ui.px(10)
                    Critter {
                        Layout.preferredWidth: ui.px(48)
                        Layout.preferredHeight: ui.px(48)
                        kind: row.modelData.character
                        source: root.svc ? root.svc.characterSource(kind) : ""
                        skin: root.svc ? root.svc.optsOf(row.modelData) : ({})
                        items: row.modelData.dress
                        idle: "still"; blinks: false; animate: false; plain: true
                    }
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 2
                        Txt { ui: root.ui; Layout.fillWidth: true; elide: Text.ElideRight; text: row.modelData.name; font.weight: Font.DemiBold; font.pixelSize: ui.fs(12) }
                        Txt {
                            ui: root.ui
                            Layout.fillWidth: true
                            elide: Text.ElideRight
                            opacity: 0.6
                            font.pixelSize: ui.fs(10)
                            text: (root.svc ? root.svc.characterLabel(row.modelData.character) : "") + "  ·  " + row.modelData.skin
                                + (row.modelData.dress.length > 0 ? "  ·  " + row.modelData.dress.length + (row.modelData.dress.length === 1 ? " item" : " items") : "")
                        }
                    }
                    Btn { ui: root.ui; text: "Use"; onClicked: root.svc.applyPal(row.modelData.name) }
                    Btn { ui: root.ui; text: "×"; implicitWidth: ui.px(24); onClicked: root.svc.deletePal(row.modelData.name) }
                }
            }
        }
    }
}
