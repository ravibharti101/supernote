import QtQuick
import qs.Common
import qs.Widgets
import "../../../js/commands.js" as Commands
import "../../../js/keymap.js" as Keymap

// Remappable keyboard shortcuts: one row per js/commands.js action (js/keymap.js's allShortcuts()), grouped like
// the cheat sheet. Stored as a sparse {id: "combo"} override map under `settingKey`; an id missing from it uses
// js/commands.js's own default. Follows the same load/save contract as the framework's own setting widgets
// (StringSetting.qml etc.: an ancestor exposing saveValue/loadValue) without importing their QmlUtils.js, which
// lives in the DMS shell's own tree and isn't reachable by a relative import from a plugin's directory.
Column {
    id: root

    required property string settingKey
    required property string label
    property string description: ""

    property var overrides: ({})
    property bool isLoading: false
    property string recordingId: ""
    property string errorText: ""

    readonly property var all: Commands.allShortcuts()
    readonly property var resolved: Keymap.resolve(all, overrides)
    readonly property var groups: {
        const byGroup = {};
        const order = [];
        all.forEach(c => {
            if (!byGroup[c.group]) {
                byGroup[c.group] = [];
                order.push(c.group);
            }
            byGroup[c.group].push(c);
        });
        return order.map(name => ({ group: name, items: byGroup[name] }));
    }

    function findSettings(item) {
        let cur = item;
        while (cur) {
            if (cur.saveValue && cur.loadValue)
                return cur;
            cur = cur.parent;
        }
        return null;
    }

    function loadValue() {
        const settings = findSettings(root.parent);
        if (settings) {
            isLoading = true;
            overrides = settings.loadValue(settingKey, {});
            isLoading = false;
        }
    }

    Component.onCompleted: Qt.callLater(loadValue)

    function save() {
        const settings = findSettings(root.parent);
        if (settings)
            settings.saveValue(settingKey, overrides);
    }

    function setCombo(id, combo) {
        const o = Object.assign({}, overrides);
        const def = all.find(c => c.id === id).keys;
        if (combo === def)
            delete o[id];
        else
            o[id] = combo;
        overrides = o;
        save();
    }

    function resetOne(id) {
        const o = Object.assign({}, overrides);
        delete o[id];
        overrides = o;
        save();
    }

    function resetAll() {
        overrides = {};
        save();
    }

    // js/mdkeys.js's handle() reserves Alt for panel/navigation shortcuts one layer up and never routes an
    // Alt-held combo to a formatting action - refuse it here rather than silently save a dead binding.
    function altBlocked(id, combo) {
        return id.indexOf("fmt-") === 0 && combo.indexOf("Alt+") >= 0;
    }

    function tryCombo(id, combo) {
        if (altBlocked(id, combo)) {
            errorText = "Alt shortcuts aren't supported for formatting commands";
            return;
        }
        const clash = Keymap.conflicts(combo, resolved, id);
        if (clash.length) {
            const owner = all.find(c => c.id === clash[0]);
            errorText = "Already used by \"" + (owner ? owner.title : clash[0]) + "\"";
            return;
        }
        errorText = "";
        setCombo(id, combo);
        recordingId = "";
    }

    width: parent.width
    spacing: Theme.spacingM

    StyledText {
        text: root.label
        font.pixelSize: Theme.fontSizeMedium
        font.weight: Font.Medium
        color: Theme.surfaceText
    }

    StyledText {
        text: root.description
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        width: parent.width
        wrapMode: Text.WordWrap
        visible: root.description !== ""
    }

    StyledText {
        text: "Reset all shortcuts to defaults"
        color: Theme.primary
        font.pixelSize: Theme.fontSizeSmall
        MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: root.resetAll()
        }
    }

    StyledText {
        visible: root.errorText !== ""
        text: root.errorText
        color: Theme.error
        font.pixelSize: Theme.fontSizeSmall
    }

    // Captures the next keypress while a row is "recording" - one shared item, not one per row.
    Item {
        id: captureItem
        width: 0
        height: 0
        focus: root.recordingId !== ""
        Keys.onPressed: event => {
            if (root.recordingId === "")
                return;
            if (event.key === Qt.Key_Escape) {
                root.recordingId = "";
                root.errorText = "";
                event.accepted = true;
                return;
            }
            if ([Qt.Key_Control, Qt.Key_Shift, Qt.Key_Alt, Qt.Key_Meta].indexOf(event.key) >= 0) {
                event.accepted = true;
                return; // a bare modifier: keep waiting for the real key
            }
            const ctrl = (event.modifiers & Qt.ControlModifier) !== 0;
            const shift = (event.modifiers & Qt.ShiftModifier) !== 0;
            const alt = (event.modifiers & Qt.AltModifier) !== 0;
            const meta = (event.modifiers & Qt.MetaModifier) !== 0;
            const combo = Keymap.eventCombo({ key: event.key, ctrl, shift, alt, meta });
            event.accepted = true;
            if (combo)
                root.tryCombo(root.recordingId, combo);
        }
    }

    Repeater {
        model: root.groups

        Column {
            id: groupCol
            required property var modelData
            width: root.width
            spacing: Theme.spacingXS

            StyledText {
                text: groupCol.modelData.group
                font.pixelSize: Theme.fontSizeSmall
                font.weight: Font.Medium
                color: Theme.surfaceVariantText
            }

            Repeater {
                model: groupCol.modelData.items

                StyledRect {
                    id: row
                    required property var modelData
                    width: groupCol.width
                    height: 36
                    radius: Theme.cornerRadius
                    color: Theme.withAlpha(Theme.surfaceContainerHigh, Theme.popupTransparency)
                    border.width: 0

                    StyledText {
                        anchors.left: parent.left
                        anchors.leftMargin: Theme.spacingM
                        anchors.right: pill.left
                        anchors.rightMargin: Theme.spacingS
                        anchors.verticalCenter: parent.verticalCenter
                        text: row.modelData.title
                        color: Theme.surfaceText
                        font.pixelSize: Theme.fontSizeSmall
                        elide: Text.ElideRight
                    }

                    StyledText {
                        id: externalKeys
                        anchors.right: parent.right
                        anchors.rightMargin: Theme.spacingM
                        anchors.verticalCenter: parent.verticalCenter
                        visible: !!row.modelData.external
                        text: row.modelData.keys + " (set in your compositor's keybinds)"
                        color: Theme.surfaceVariantText
                        font.pixelSize: Theme.fontSizeSmall
                    }

                    Rectangle {
                        id: pill
                        visible: !row.modelData.external
                        anchors.right: resetIcon.visible ? resetIcon.left : parent.right
                        anchors.rightMargin: Theme.spacingS
                        anchors.verticalCenter: parent.verticalCenter
                        width: row.modelData.external ? 0 : Math.max(90, pillText.implicitWidth + 20)
                        height: 24
                        radius: Theme.cornerRadius
                        color: root.recordingId === row.modelData.id ? Theme.primary : Theme.surfaceContainerHighest

                        StyledText {
                            id: pillText
                            anchors.centerIn: parent
                            text: root.recordingId === row.modelData.id ? "Press a key… (Esc)" : (root.resolved[row.modelData.id] || "—")
                            color: root.recordingId === row.modelData.id ? Theme.primaryText : Theme.surfaceText
                            font.pixelSize: Theme.fontSizeSmall
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                root.errorText = "";
                                root.recordingId = row.modelData.id;
                                captureItem.forceActiveFocus();
                            }
                        }
                    }

                    Rectangle {
                        id: resetIcon
                        visible: !row.modelData.external && root.overrides[row.modelData.id] !== undefined
                        anchors.right: parent.right
                        anchors.rightMargin: Theme.spacingM
                        anchors.verticalCenter: parent.verticalCenter
                        width: 20
                        height: 20
                        radius: 10
                        color: "transparent"

                        DankIcon {
                            anchors.centerIn: parent
                            name: "refresh"
                            size: 14
                            color: Theme.surfaceVariantText
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: root.resetOne(row.modelData.id)
                        }
                    }
                }
            }
        }
    }
}
