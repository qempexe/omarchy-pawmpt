import QtQuick
import QtQuick.Layouts
import "../controls"

// The Characters page of the Wardrobe: the pal as it looks now, the categories, a search, a
// grid of every character, and what you can do with the pictures you added yourself.
Flickable {
    id: root

    property var ui: null
    readonly property var svc: ui ? ui.service : null
    readonly property var cfg: svc ? svc.settings : ({})

    property string cat: "All"
    property string query: ""
    property string addNote: ""
    property bool confirmDelete: false

    readonly property var categories: svc ? ["All"].concat(svc.categoryList()) : ["All"]
    readonly property string activeCat: categories.indexOf(cat) >= 0 ? cat : "All"
    readonly property var shownChars: {
        const all = svc ? svc.allCharacters() : []
        const q = query.trim().toLowerCase()
        return all.filter((c) => (activeCat === "All" || c.category === activeCat)
            && (q === "" || c.label.toLowerCase().indexOf(q) >= 0 || c.category.toLowerCase().indexOf(q) >= 0 || c.key.toLowerCase().indexOf(q) >= 0))
    }
    readonly property var yourCategories: svc ? svc.customCategories() : []
    readonly property bool hasCustom: svc ? svc.customCharacters.length > 0 : false
    readonly property bool customOn: String(cfg.character || "").startsWith("custom:")
    readonly property string customPath: customOn ? String(cfg.character).slice(7) : ""
    onCustomPathChanged: confirmDelete = false

    clip: true
    boundsBehavior: Flickable.StopAtBounds
    contentWidth: width
    contentHeight: col.implicitHeight + ui.px(8)

    ColumnLayout {
        id: col
        width: root.width
        spacing: ui.px(10)

        // the pal, as it looks now
        RowLayout {
            Layout.fillWidth: true
            spacing: ui.px(14)
            Critter {
                Layout.preferredWidth: ui.px(80)
                Layout.preferredHeight: ui.px(80)
                kind: root.cfg.character || "blob"
                source: root.svc ? root.svc.characterSource(kind) : ""
                skin: root.svc ? root.svc.skinOpts : ({})
                items: root.svc ? root.svc.dress : []
                idle: "breathe"
                animate: root.visible
            }
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 2
                Txt {
                    ui: root.ui
                    Layout.fillWidth: true
                    elide: Text.ElideRight
                    text: root.svc ? root.svc.characterLabel(root.cfg.character) : ""
                    font.pixelSize: ui.fs(13)
                    font.weight: Font.DemiBold
                }
                Txt { ui: root.ui; text: "Skin: " + (root.cfg.skin || ""); opacity: 0.6; font.pixelSize: ui.fs(11) }
            }
        }

        // the categories
        Flow {
            Layout.fillWidth: true
            spacing: ui.px(6)
            Repeater {
                model: root.categories
                delegate: Chip {
                    required property var modelData
                    ui: root.ui
                    label: modelData
                    on: root.activeCat === modelData
                    onClicked: root.cat = modelData
                }
            }
        }

        Field {
            id: charSearch
            ui: root.ui
            key: "characters:search"
            Layout.fillWidth: true
            Layout.maximumWidth: ui.px(420)
            clearable: true
            icon: true
            maxLength: 40
            placeholder: "Search characters…"
            onEdited: function(t) { root.query = t }
        }
        Txt {
            ui: root.ui
            text: root.shownChars.length + (root.shownChars.length === 1 ? " character" : " characters")
                + (root.activeCat !== "All" ? " in " + root.activeCat : "")
            opacity: 0.6
            font.pixelSize: ui.fs(10)
        }

        // the characters: a grid that draws only the tiles in view
        GridView {
            id: grid
            Layout.fillWidth: true
            Layout.preferredHeight: Math.min(Math.max(1, Math.ceil(count / columns)) * cellHeight, Math.max(ui.px(200), root.height * 0.62))
            readonly property int columns: Math.max(1, Math.floor(width / ui.px(82)))
            cellWidth: width / columns
            cellHeight: ui.px(92)
            clip: true
            reuseItems: true
            cacheBuffer: 0
            boundsBehavior: Flickable.StopAtBounds
            model: root.shownChars
            delegate: Item {
                id: cell
                required property var modelData
                required property int index
                width: grid.cellWidth
                height: grid.cellHeight
                Rectangle {
                    id: tile
                    anchors.centerIn: parent
                    width: ui.px(74); height: ui.px(86)
                    radius: ui.r(1.4)
                    readonly property bool on: root.cfg.character === cell.modelData.key
                    color: on ? ui.accentTint(0.16) : ui.tint(tArea.containsMouse ? 0.09 : 0.04)
                    border.width: on ? 1.5 : 1
                    border.color: on ? ui.accent : ui.tint(0.08)
                    Behavior on color { enabled: ui.animations; ColorAnimation { duration: 100 } }
                    Critter {
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: ui.px(4); width: ui.px(56); height: ui.px(56)
                        kind: cell.modelData.key
                        source: root.svc ? root.svc.characterSource(kind) : ""
                        skin: root.svc ? root.svc.skinOpts : ({})
                        idle: "still"; blinks: false; animate: false; plain: true
                        haloDelay: (cell.index % 24) * 7
                    }
                    Txt {
                        ui: root.ui
                        anchors.horizontalCenter: parent.horizontalCenter
                        y: ui.px(64)
                        width: parent.width - ui.px(6)
                        horizontalAlignment: Text.AlignHCenter
                        elide: Text.ElideRight
                        text: cell.modelData.label
                        font.pixelSize: ui.fs(10)
                        font.weight: tile.on ? Font.DemiBold : Font.Normal
                        opacity: tile.on ? 1.0 : 0.8
                    }
                    MouseArea {
                        id: tArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: root.svc.set("character", cell.modelData.key)
                    }
                }
            }
        }
        Txt {
            ui: root.ui
            Layout.fillWidth: true
            visible: root.shownChars.length === 0
            wrapMode: Text.Wrap
            opacity: 0.6
            text: root.activeCat !== "All" && root.yourCategories.indexOf(root.activeCat) < 0 && root.query === ""
                ? "Nothing here yet." : "No character matches. Try another word or category."
        }

        // the folder of a category you made
        Flow {
            Layout.fillWidth: true
            spacing: ui.px(6)
            visible: root.yourCategories.indexOf(root.activeCat) >= 0 || root.activeCat === "Yours"
            Btn { ui: root.ui; text: "Open the " + root.activeCat + " folder"; onClicked: root.svc.openCategoryFolder(root.activeCat) }
        }

        // the one you picked, if it is your own: rename, move, delete
        ColumnLayout {
            Layout.fillWidth: true
            visible: root.customOn
            spacing: ui.px(8)

            Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
            Txt { ui: root.ui; text: "YOUR PICTURE"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
            Txt { ui: root.ui; Layout.fillWidth: true; text: root.customPath; elide: Text.ElideMiddle; font.weight: Font.DemiBold }
            RowLayout {
                spacing: ui.px(6)
                Field { id: renName; ui: root.ui; key: "characters:rename"; Layout.preferredWidth: ui.px(200); placeholder: "New name"; maxLength: 40 }
                Btn { ui: root.ui; text: "Rename"; onClicked: { if (root.svc.moveCharacter(root.customPath, renName.value, undefined)) renName.set("") } }
            }
            Txt { ui: root.ui; text: "Move it to a category"; opacity: 0.6; font.pixelSize: ui.fs(10) }
            Flow {
                Layout.fillWidth: true
                spacing: ui.px(6)
                Repeater {
                    model: ["Yours"].concat(root.yourCategories)
                    delegate: Chip { required property var modelData; ui: root.ui; label: modelData; onClicked: root.svc.moveCharacter(root.customPath, "", modelData) }
                }
            }
            RowLayout {
                spacing: ui.px(6)
                Field { id: moveCat; ui: root.ui; key: "characters:move"; Layout.preferredWidth: ui.px(200); placeholder: "A new category"; maxLength: 24 }
                Btn { ui: root.ui; text: "Move"; onClicked: { if (moveCat.value !== "" && root.svc.moveCharacter(root.customPath, "", moveCat.value)) moveCat.set("") } }
            }
            Btn {
                ui: root.ui
                kind: root.confirmDelete ? "danger" : "normal"
                text: root.confirmDelete ? "Click again to delete it" : "Delete"
                onClicked: { if (root.confirmDelete) { root.svc.deleteCharacter(root.customPath); root.confirmDelete = false } else root.confirmDelete = true }
            }
        }

        // adding your own
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: ui.tint(0.07) }
        Txt { ui: root.ui; text: "ADD YOUR OWN"; font.pixelSize: ui.fs(9); font.letterSpacing: 1; font.weight: Font.DemiBold; opacity: 0.45 }
        Txt {
            ui: root.ui
            Layout.fillWidth: true
            visible: !root.hasCustom
            wrapMode: Text.Wrap
            opacity: 0.6
            font.pixelSize: ui.fs(10)
            text: "Nothing of yours yet. Type the path of a picture, pick or type a category, and press Add. A category is a folder in ~/.config/pawmpt/characters, so you can also drop pictures there yourself."
        }
        Txt {
            ui: root.ui
            Layout.fillWidth: true
            wrapMode: Text.Wrap
            opacity: 0.6
            font.pixelSize: ui.fs(10)
            text: "A PNG, JPG, WebP, SVG or animated GIF. Leave the category empty to put it under Yours."
        }
        Field { id: addPath; ui: root.ui; key: "characters:path"; Layout.fillWidth: true; placeholder: "~/Pictures/neko.png"; maxLength: 300 }
        Flow {
            Layout.fillWidth: true
            spacing: ui.px(6)
            visible: root.yourCategories.length > 0
            Repeater {
                model: root.yourCategories
                delegate: Chip { required property var modelData; ui: root.ui; label: modelData; on: addCat.value === modelData; onClicked: addCat.set(modelData) }
            }
        }
        RowLayout {
            spacing: ui.px(6)
            Field { id: addCat; ui: root.ui; key: "characters:category"; Layout.preferredWidth: ui.px(170); placeholder: "Category (optional)"; maxLength: 24 }
            Btn {
                ui: root.ui
                kind: "primary"
                text: "Add"
                onClicked: {
                    if (root.svc.addCharacter(addPath.value, addCat.value)) { addPath.set(""); root.addNote = "Added." }
                    else root.addNote = "That is not a picture path, or the category name has odd characters."
                }
            }
            Btn { ui: root.ui; text: "Open the folder"; onClicked: root.svc.openCharactersFolder() }
        }
        Txt { ui: root.ui; Layout.fillWidth: true; visible: root.addNote !== ""; text: root.addNote; wrapMode: Text.Wrap; opacity: 0.7; font.pixelSize: ui.fs(10) }
    }
}
