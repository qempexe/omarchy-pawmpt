import QtQuick
import QtQuick.Layouts
import "../js/Skins.js" as Skins
import "../controls"

// The Dress page of the Wardrobe: what it can wear, by place, and for each piece it wears
// its color, its size and how high it sits.
Flickable {
    id: root

    property var ui: null
    readonly property var svc: ui ? ui.service : null

    clip: true
    boundsBehavior: Flickable.StopAtBounds
    contentWidth: width
    contentHeight: col.implicitHeight + ui.px(8)

    ColumnLayout {
        id: col
        width: root.width
        spacing: ui.px(10)

        Repeater {
            model: Skins.slots
            delegate: ColumnLayout {
                id: slot
                required property var modelData
                Layout.fillWidth: true
                spacing: ui.px(6)
                Txt { ui: root.ui; text: slot.modelData.label.toUpperCase(); font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
                Flow {
                    Layout.fillWidth: true
                    spacing: ui.px(6)
                    Repeater {
                        model: Skins.dressItems.filter((d) => d.slot === slot.modelData.key)
                        delegate: Chip {
                            required property var modelData
                            ui: root.ui
                            label: modelData.label
                            dot: true
                            tone: Qt.color(modelData.color)
                            on: !!(root.svc && root.svc.dress.some((d) => d.id === modelData.id))
                            onClicked: root.svc.toggleWear(modelData.id)
                        }
                    }
                }
            }
        }

        Rectangle { Layout.fillWidth: true; visible: !!root.svc && root.svc.dress.length > 0; implicitHeight: 1; color: ui.tint(0.07) }
        Txt {
            ui: root.ui
            visible: !!root.svc && root.svc.dress.length > 0
            text: "WHAT IT WEARS"
            font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45
        }

        Repeater {
            model: root.svc ? root.svc.dress : []
            delegate: ColumnLayout {
                id: worn
                required property var modelData
                readonly property var item: Skins.dressItem(modelData.id)
                Layout.fillWidth: true
                spacing: ui.px(8)

                RowLayout {
                    spacing: ui.px(8)
                    Txt { ui: root.ui; text: worn.item ? worn.item.label : ""; font.weight: Font.DemiBold; font.pixelSize: ui.fs(12) }
                    Btn { ui: root.ui; text: "Take off"; onClicked: root.svc.unwear(worn.modelData.id) }
                }
                Flow {
                    Layout.fillWidth: true
                    spacing: ui.px(8)
                    Repeater {
                        model: Skins.dressSwatches
                        delegate: Rectangle {
                            required property var modelData
                            readonly property bool on: worn.modelData.color === modelData
                            implicitWidth: ui.px(22); implicitHeight: implicitWidth
                            radius: width / 2
                            color: modelData
                            border.width: on ? 2 : 1
                            border.color: on ? ui.accent : ui.tint(0.25)
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: root.svc.tweak(worn.modelData.id, { color: parent.modelData })
                            }
                        }
                    }
                }
                SettingRow {
                    Layout.fillWidth: true
                    ui: root.ui
                    settingKey: "dress-size"
                    label: "Size"
                    hint: "Percent of its usual size."
                    kind: "int"
                    min: 50; max: 160; step: 5
                    defaultValue: 100
                    value: worn.modelData.size
                    onEdited: function(v) { root.svc.tweak(worn.modelData.id, { size: v }) }
                }
                SettingRow {
                    Layout.fillWidth: true
                    ui: root.ui
                    settingKey: "dress-dy"
                    label: "Up and down"
                    kind: "int"
                    min: -40; max: 40; step: 2
                    defaultValue: 0
                    value: worn.modelData.dy
                    onEdited: function(v) { root.svc.tweak(worn.modelData.id, { dy: v }) }
                }
                Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
            }
        }

        Btn {
            ui: root.ui
            visible: !!root.svc && root.svc.dress.length > 0
            text: "Take everything off"
            onClicked: root.svc.clearDress()
        }
    }
}
