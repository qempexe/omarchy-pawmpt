import QtQuick
import QtQuick.Layouts
import "../js/Schema.js" as Schema
import "../controls"

// The body of a tab of the panel: the Settings tab or the Wardrobe tab (PalView.qml has the
// title, the search box and Reset all). It is:
//   * one underlined tab per page: the groups of Schema.js (and About) on Settings; Characters,
//     Skins, Dress and Customize on Wardrobe;
//   * that page: its settings (tiles, segmented bars, sliders, switches), one of the wardrobe
//     pages, or on Settings while searching every setting that matches, wardrobe ones included.
// Every change is applied instantly and saved by the service.
Item {
    id: root

    property var ui: null
    readonly property var svc: ui ? ui.service : null
    property string tab: "settings"                 // settings | wardrobe
    property int group: 0                           // the page, by position
    readonly property string filter: ui ? ui.settingsFilter : ""

    readonly property bool searching: tab === "settings" && filter.trim() !== ""
    readonly property var pages: tab === "wardrobe" ? ["Characters", "Skins", "Dress", "Pals", "Customize"]
                                                    : Schema.groupTitles("settings").concat(["About"])
    readonly property string page: pages[Math.max(0, Math.min(group, pages.length - 1))]
    readonly property bool onAbout: page === "About" && !searching
    readonly property bool inChars: tab === "wardrobe" && page === "Characters"
    readonly property bool inSkins: tab === "wardrobe" && page === "Skins"
    readonly property bool inDress: tab === "wardrobe" && page === "Dress"
    readonly property bool inPals: tab === "wardrobe" && page === "Pals"
    readonly property bool inRows: searching || !(page === "About" || inChars || inSkins || inDress || inPals)
    readonly property string schemaGroup: Schema.groupOfPage(page)

    onPageChanged: if (page === "Agent" && svc && svc.models.length === 0 && !svc.modelsBusy) svc.loadModels()

    function rad(k) { return ui.r(k) }

    function val(key) {
        return ui.cfgSafe[key] !== undefined ? ui.cfgSafe[key] : Schema.defaults[key]
    }

    // A row's value: one setting, or for a palette row its colors as { key: value }.
    function rowValue(item) {
        if (item.kind !== "palette") return val(item.key)
        const o = {}
        for (let i = 0; i < item.targets.length; i++) o[item.targets[i].key] = val(item.targets[i].key)
        return o
    }

    function edit(item, v) {
        if (!ui.store) return
        if (item.kind !== "palette") { ui.store.set(item.key, v); return }
        if (v && v.reset) {
            const back = {}
            for (let i = 0; i < item.targets.length; i++) back[item.targets[i].key] = item.fallback[item.targets[i].key]
            ui.store.setMany(back)
        } else if (v && v.key) {
            ui.store.set(v.key, v.value)
        }
    }

    // The window's size is set by the window manager while Pawmpt is popped out,
    // so these two settings have no effect there. Shown, but locked.
    function offHere(item) {
        return ui.popped === true && (item.key === "windowWidth" || item.key === "windowHeight")
    }

    // a row with a `when` is dimmed unless the setting it depends on has one of the listed values
    function dimmed(item) {
        if (!item.when) return false
        for (let i = 0; i < item.when.length; i++) {
            const c = item.when[i]
            if (c.is.map(String).indexOf(String(val(c.key))) < 0) return true
        }
        return false
    }

    // the rows to show: the chosen page, or every match while searching.
    // `head` is the heading over a row: the page while searching (when it changes), otherwise
    // the row's section when it starts a new one.
    readonly property var rows: {
        const out = []
        if (searching) {
            const hits = Schema.search(filter, ["settings", "wardrobe"])
            let last = ""
            for (let i = 0; i < hits.length; i++) {
                out.push({ item: hits[i].item, head: hits[i].group !== last ? Schema.pageName(hits[i].group) : "" })
                last = hits[i].group
            }
            return out
        }
        if (!inRows) return out
        const secs = Schema.sections(schemaGroup)
        for (let s = 0; s < secs.length; s++)
            for (let i = 0; i < secs[s].items.length; i++)
                out.push({ item: secs[s].items[i], head: i === 0 ? secs[s].title : "" })
        return out
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: ui.px(12)

        // ---- tabs -------------------------------------------------------------------
        Item {
            Layout.fillWidth: true
            implicitHeight: ui.px(32)

            Rectangle {
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                height: 1
                color: ui.tint(0.10)
            }

            // When the window is narrow or the text large, the tabs keep their natural
            // width and the row scrolls sideways instead of drawing them over each other.
            Flickable {
                id: tabsFlick
                anchors.fill: parent
                contentWidth: Math.max(width, tabsRow.implicitWidth)
                contentHeight: height
                flickableDirection: Flickable.HorizontalFlick
                boundsBehavior: Flickable.StopAtBounds
                clip: true

                // scroll the open tab into view
                function reveal(item) {
                    if (!item || contentWidth <= width) return
                    const pad = ui.px(24)
                    if (item.x - pad < contentX) contentX = Math.max(0, item.x - pad)
                    else if (item.x + item.width + pad > contentX + width)
                        contentX = Math.min(contentWidth - width, item.x + item.width + pad - width)
                }

            RowLayout {
                id: tabsRow
                // the widest tab title, in the open tab's (bold) weight, plus some air
                TextMetrics {
                    id: widest
                    font.family: ui.fontName
                    font.pixelSize: ui.fs(12)
                    font.weight: Font.DemiBold
                    text: root.pages.reduce((a, b) => (b.length > a.length ? b : a), "")
                }
                readonly property real tabW: Math.ceil(widest.width) + ui.px(24)
                width: tabsFlick.contentWidth
                height: tabsFlick.height
                spacing: 0

                Repeater {
                    model: root.pages
                    delegate: Item {
                        required property var modelData
                        required property int index
                        readonly property bool on: index === root.group && !root.searching
                        Layout.fillWidth: true
                        // every tab as wide as the widest one
                        Layout.preferredWidth: tabsRow.tabW
                        Layout.minimumWidth: tabsRow.tabW
                        Layout.fillHeight: true
                        onOnChanged: if (on) Qt.callLater(tabsFlick.reveal, this)
                        onXChanged: if (on) Qt.callLater(tabsFlick.reveal, this)

                        Txt {
                            ui: root.ui
                            anchors.centerIn: parent
                            anchors.verticalCenterOffset: -1
                            text: parent.modelData
                            opacity: root.searching ? 0.3 : (parent.on ? 1.0 : (tabArea.containsMouse ? 0.8 : 0.5))
                            font.pixelSize: ui.fs(12)
                            font.weight: parent.on ? Font.DemiBold : Font.Normal
                        }
                        Rectangle {
                            visible: parent.on
                            anchors.left: parent.left
                            anchors.right: parent.right
                            anchors.bottom: parent.bottom
                            height: 2
                            radius: 1
                            color: ui.accent
                        }
                        MouseArea {
                            id: tabArea
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { root.group = parent.index; ui.settingsFilter = ""; ui.searchCleared() }
                        }
                    }
                }
            }
            }
        }

        // ---- the page -------------------------------------------------------------------
        // the last tab of Settings: About
        AboutPage {
            ui: root.ui
            visible: root.onAbout
            Layout.fillWidth: true
            Layout.fillHeight: true
        }

        // the wardrobe pages. They exist only while they are on show: the character picker
        // draws a pal for every tile in view.
        Item {
            visible: root.tab === "wardrobe" && (root.inChars || root.inSkins || root.inDress || root.inPals)
            Layout.fillWidth: true
            Layout.fillHeight: true

            Loader {
                anchors.fill: parent
                active: root.inChars && root.visible
                sourceComponent: Component { CharactersPage { ui: root.ui } }
            }
            Loader {
                anchors.fill: parent
                active: root.inSkins && root.visible
                sourceComponent: Component { SkinsPage { ui: root.ui } }
            }
            Loader {
                anchors.fill: parent
                active: root.inDress && root.visible
                sourceComponent: Component { DressPage { ui: root.ui } }
            }
            Loader {
                anchors.fill: parent
                active: root.inPals && root.visible
                sourceComponent: Component { PalsPage { ui: root.ui } }
            }
        }

        // ---- the settings of the active page ------------------------------------------------
        Flickable {
            id: flick
            visible: root.inRows
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentWidth: width
            contentHeight: card.implicitHeight + ui.px(4)
            clip: true
            boundsBehavior: Flickable.StopAtBounds
            onContentHeightChanged: if (contentY > contentHeight - height) contentY = Math.max(0, contentHeight - height)

            Item {
                id: card
                width: flick.width
                implicitHeight: rowsCol.implicitHeight + ui.px(12)

                ColumnLayout {
                    id: rowsCol
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.leftMargin: ui.px(16)
                    anchors.rightMargin: ui.px(16)
                    anchors.topMargin: ui.px(6)
                    spacing: 0

                    Txt {
                        ui: root.ui
                        visible: root.rows.length === 0
                        Layout.topMargin: ui.px(14)
                        Layout.bottomMargin: ui.px(14)
                        text: "No setting matches that."
                        opacity: 0.5
                    }

                    Repeater {
                        model: root.rows
                        delegate: ColumnLayout {
                            required property var modelData
                            required property int index
                            Layout.fillWidth: true
                            spacing: 0

                            Rectangle {
                                visible: index > 0
                                Layout.fillWidth: true
                                implicitHeight: 1
                                color: ui.tint(0.07)
                            }
                            Txt {
                                ui: root.ui
                                visible: modelData.head !== ""
                                Layout.topMargin: ui.px(12)
                                text: modelData.head.toUpperCase()
                                font.pixelSize: ui.fs(9)
                                font.letterSpacing: 1
                                font.weight: Font.DemiBold
                                opacity: 0.45
                            }
                            SettingRow {
                                Layout.fillWidth: true
                                Layout.topMargin: ui.px(14)
                                Layout.bottomMargin: ui.px(14)
                                ui: root.ui
                                settingKey: modelData.item.key
                                label: modelData.item.label
                                hint: root.offHere(modelData.item)
                                    ? "Not used in a pop-out window: your window manager sizes it. Dock it to use this."
                                    : (modelData.item.hint || "")
                                kind: modelData.item.kind
                                control: modelData.item.control || ""
                                options: modelData.item.options || []
                                labels: modelData.item.labels || ({})
                                presets: modelData.item.presets || []
                                maxLength: modelData.item.maxLength !== undefined ? modelData.item.maxLength : 2048
                                min: modelData.item.min !== undefined ? modelData.item.min : 0
                                max: modelData.item.max !== undefined ? modelData.item.max : 100
                                step: modelData.item.step !== undefined ? modelData.item.step : 1
                                divisor: modelData.item.divisor !== undefined ? modelData.item.divisor : 1
                                decimals: modelData.item.decimals !== undefined ? modelData.item.decimals : 0
                                defaultValue: modelData.item.fallback
                                dimmed: root.dimmed(modelData.item)
                                locked: root.offHere(modelData.item)
                                value: root.rowValue(modelData.item)
                                targets: modelData.item.targets || []
                                onEdited: function(v) {
                                    if (root.offHere(modelData.item)) return
                                    root.edit(modelData.item, v)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
