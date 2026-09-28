import QtQuick
import qs.Common
import qs.Widgets
import "../../../js/tabs.js" as Tabs
import "../widgets"

// Tab strip with back / forward and the new-tab button. Inputs: ui (ui.core.tabState).
Rectangle {
    id: tabBar
    required property var ui

    anchors.top: parent.top
    anchors.left: parent.left
    anchors.right: parent.right
    height: 36
    color: Theme.surface

    Row {
        id: navBtns
        anchors.left: parent.left
        anchors.leftMargin: 6
        anchors.verticalCenter: parent.verticalCenter
        spacing: 0
        IconBtn {
            width: 28
            height: 28
            icon: "arrow_back"
            opacity: Tabs.canBack(ui.core.tabState) ? 1 : 0.35
            onClicked: ui.core.goBack()
        }
        IconBtn {
            width: 28
            height: 28
            icon: "arrow_forward"
            opacity: Tabs.canForward(ui.core.tabState) ? 1 : 0.35
            onClicked: ui.core.goForward()
        }
    }

    Row {
        anchors.left: navBtns.right
        anchors.leftMargin: 6
        anchors.right: newTabBtn.left
        anchors.verticalCenter: parent.verticalCenter
        height: parent.height
        spacing: 2
        Repeater {
            model: ui.core.tabState.tabs
            Rectangle {
                id: tabItem
                required property var modelData
                required property int index
                readonly property bool active: index === ui.core.tabState.active
                width: Math.max(80, Math.min(190, (tabBar.width - 120) / Math.max(1, ui.core.tabState.tabs.length)))
                height: parent.height
                color: "transparent"

                Rectangle {
                    // active-tab indicator, same accent used elsewhere for "this is the active/selected thing".
                    // z above the tab bar's own bottom separator line, which sits at this same edge.
                    z: 1
                    visible: tabItem.active
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.bottom: parent.bottom
                    height: 2
                    color: Theme.primary
                }

                StyledText {
                    anchors.left: parent.left
                    anchors.leftMargin: 10
                    anchors.right: closeBtn.left
                    anchors.verticalCenter: parent.verticalCenter
                    text: modelData.rel ? ui.core.noteTitleOf(modelData.rel) : "New tab"
                    // StyledText defaults to WordWrap + ElideRight together, which only elides once something
                    // bounds its height (there isn't one here) - without NoWrap a long title wraps to several
                    // lines and spills out of the tab instead of eliding to one line with "...".
                    wrapMode: Text.NoWrap
                    elide: Text.ElideRight
                    color: tabItem.active ? Theme.surfaceText : Theme.surfaceVariantText
                    font.pixelSize: Theme.fontSizeMedium
                    font.italic: modelData.rel === ""
                }
                MouseArea {
                    id: tabMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    acceptedButtons: Qt.LeftButton | Qt.MiddleButton
                    onClicked: mouse => {
                        if (mouse.button === Qt.MiddleButton)
                            ui.core.closeTab(tabItem.index);
                        else
                            ui.core.activateTab(tabItem.index);
                    }
                }
                IconBtn {
                    id: closeBtn
                    width: 22
                    height: 22
                    anchors.right: parent.right
                    anchors.rightMargin: 4
                    anchors.verticalCenter: parent.verticalCenter
                    icon: "close"
                    opacity: tabItem.active || tabMouse.containsMouse ? 1 : 0
                    onClicked: ui.core.closeTab(tabItem.index)
                }
            }
        }
    }

    IconBtn {
        id: newTabBtn
        width: 28
        height: 28
        anchors.right: parent.right
        anchors.rightMargin: 6
        anchors.verticalCenter: parent.verticalCenter
        icon: "add"
        onClicked: ui.core.newTab()
    }

    Rectangle {
        // separates the tab row from the note content below it (same thin-divider look as headerLine/sidebarLine)
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: 1
        color: Theme.outline
        opacity: 0.4
    }
}
