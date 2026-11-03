import QtQuick

// A text box: a rounded field around a PasteInput, with a hint while it is empty, an
// optional search icon and an optional clear button. Typing, Backspace and the arrow keys
// are PasteInput's; Ctrl+V asks the service for a capped read of the clipboard.
Rectangle {
    id: box

    property var ui: null
    property string key: ""             // names this field for the capped paste, so keep it unique
    property string placeholder: ""
    property int maxLength: 120
    property bool clearable: false
    property bool icon: false
    property alias text: input.text
    readonly property string value: input.text
    function set(t) { input.text = t }

    signal edited(string typed)         // on every key
    signal accepted(string entered)     // Return, or the field lost focus

    implicitHeight: ui.px(28)
    radius: ui.r(1.5)
    color: ui.tint(0.05)
    border.width: 1
    border.color: input.activeFocus ? ui.tint(0.28) : ui.tint(0.08)
    clip: true

    Txt {
        ui: box.ui
        visible: box.icon
        anchors.left: parent.left
        anchors.leftMargin: ui.px(10)
        anchors.verticalCenter: parent.verticalCenter
        text: "⌕"
        opacity: 0.5
        font.pixelSize: ui.fs(14)
    }
    PasteInput {
        id: input
        key: box.key
        service: box.ui ? box.ui.service : null
        anchors.fill: parent
        anchors.leftMargin: box.icon ? ui.px(30) : ui.px(10)
        anchors.rightMargin: box.clearable ? ui.px(30) : ui.px(10)
        color: ui.fg
        font.family: ui.fontName
        font.pixelSize: ui.fs(12)
        maximumLength: box.maxLength
        onTextEdited: box.edited(text)
        onEditingFinished: box.accepted(text)
        Keys.onEscapePressed: function(e) {
            if (text !== "") { text = ""; box.edited(""); box.accepted(""); e.accepted = true }
            else e.accepted = false
        }
        Txt {
            ui: box.ui
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width
            elide: Text.ElideRight
            visible: input.text === "" && !input.activeFocus
            text: box.placeholder
            opacity: 0.4
        }
    }
    Txt {
        ui: box.ui
        visible: box.clearable && input.text !== ""
        anchors.right: parent.right
        anchors.rightMargin: ui.px(10)
        anchors.verticalCenter: parent.verticalCenter
        text: "✕"
        opacity: 0.6
        MouseArea {
            anchors.fill: parent
            anchors.margins: -6
            cursorShape: Qt.PointingHandCursor
            onClicked: { input.text = ""; box.edited(""); box.accepted("") }
        }
    }
}
