.pragma library
.import "fuzzy.js" as Fuzzy

// Command palette entries + the shortcut cheat sheet (pure data; tests/commands.test.js).
// `needsNote`: only offered while a note is open. `keys`: the DEFAULT shortcut (js/keymap.js resolves the
// user's overrides against this). `external`: a compositor-level keybind SuperNote never sees as a QML key event
// (shown for reference in the shortcuts settings, not editable there).
var COMMANDS = [
    { id: "new-note", group: "Notes", title: "New note", keys: "Ctrl+N" },
    { id: "new-from-template", group: "Notes", title: "New note from template…", keys: "" },
    { id: "insert-template", group: "Notes", title: "Insert template…", keys: "", needsNote: true },
    { id: "daily", group: "Notes", title: "Open today's daily note", keys: "" },
    { id: "capture", group: "Notes", title: "Quick capture", keys: "Super+Ctrl+N", external: true },
    { id: "switcher", group: "Notes", title: "Open note…", keys: "Ctrl+O" },
    { id: "rename", group: "Notes", title: "Rename this note", keys: "F2", needsNote: true },
    { id: "pin", group: "Notes", title: "Pin / unpin this note", keys: "", needsNote: true },
    { id: "delete", group: "Notes", title: "Delete this note", keys: "Delete", needsNote: true },
    { id: "toggle-view", group: "View", title: "Cycle Edit / Split / Preview", keys: "Ctrl+E", needsNote: true },
    { id: "right-panel", group: "View", title: "Toggle right panel", keys: "Ctrl+Shift+B" },
    { id: "toggle-sidebar", group: "View", title: "Toggle left panel (files / search / tags)", keys: "Ctrl+\\" },
    { id: "expand-window", group: "View", title: "Expand to window / dock to the right", keys: "" },
    { id: "widen-panel", group: "View", title: "Widen the docked panel", keys: "Alt++" },
    { id: "narrow-panel", group: "View", title: "Narrow the docked panel", keys: "Alt+-" },
    { id: "reset-panel-width", group: "View", title: "Reset the docked panel's width", keys: "" },
    { id: "retry-renders", group: "View", title: "Retry failed math / diagram renders", keys: "" },
    { id: "toolbar", group: "View", title: "Toggle formatting toolbar", keys: "" },
    { id: "properties", group: "View", title: "Toggle properties", keys: "", needsNote: true },
    { id: "search", group: "Navigate", title: "Search all notes", keys: "Ctrl+Shift+F" },
    { id: "tags", group: "Navigate", title: "Show tags", keys: "" },
    { id: "files", group: "Navigate", title: "Show / hide files panel", keys: "Ctrl+Shift+E" },
    { id: "back", group: "Navigate", title: "Go back", keys: "Alt+Left" },
    { id: "forward", group: "Navigate", title: "Go forward", keys: "Alt+Right" },
    { id: "new-tab", group: "Navigate", title: "New tab", keys: "Ctrl+T" },
    { id: "close-tab", group: "Navigate", title: "Close tab", keys: "Ctrl+W" },
    { id: "next-tab", group: "Navigate", title: "Next tab", keys: "Ctrl+Tab" },
    { id: "prev-tab", group: "Navigate", title: "Previous tab", keys: "Ctrl+Shift+Tab" },
    { id: "find", group: "Edit", title: "Find in note", keys: "Ctrl+F", needsNote: true },
    { id: "replace", group: "Edit", title: "Find and replace", keys: "Ctrl+H", needsNote: true },
    { id: "undo-rename", group: "Vault", title: "Undo last rename / move", keys: "" },
    { id: "add-vault", group: "Vault", title: "Open another vault…", keys: "" },
    { id: "palette", group: "Help", title: "Command palette", keys: "Ctrl+P" },
    { id: "cheatsheet", group: "Help", title: "Keyboard shortcuts", keys: "Ctrl+/" }
];

function filter(query, hasNote) {
    var list = COMMANDS.filter(function (c) { return hasNote !== false || !c.needsNote; });
    if (!query)
        return list;
    return Fuzzy.rank(list.map(function (c) { return { name: c.title, path: c.group, item: c }; }), query, 30).map(function (r) { return r.item.item; });
}

// Formatting/editing/modal shortcuts: not palette commands (no reason to fuzzy-search "bold"), but real,
// individually remappable actions - same shape as COMMANDS so js/keymap.js treats every id uniformly.
var SHORTCUTS_ONLY = [
    { id: "save", group: "Writing", title: "Save now", keys: "Ctrl+S" },
    { id: "fmt-bold", group: "Writing", title: "Bold", keys: "Ctrl+B" },
    { id: "fmt-italic", group: "Writing", title: "Italic", keys: "Ctrl+I" },
    { id: "fmt-strike", group: "Writing", title: "Strikethrough", keys: "Ctrl+Shift+X" },
    { id: "fmt-code", group: "Writing", title: "Inline code", keys: "Ctrl+Shift+C" },
    { id: "fmt-link", group: "Writing", title: "Insert link", keys: "Ctrl+K" },
    { id: "fmt-task", group: "Writing", title: "Toggle task", keys: "Ctrl+L" },
    { id: "fmt-h0", group: "Writing", title: "Clear heading", keys: "Ctrl+0" },
    { id: "fmt-h1", group: "Writing", title: "Heading 1", keys: "Ctrl+1" },
    { id: "fmt-h2", group: "Writing", title: "Heading 2", keys: "Ctrl+2" },
    { id: "fmt-h3", group: "Writing", title: "Heading 3", keys: "Ctrl+3" },
    { id: "fmt-h4", group: "Writing", title: "Heading 4", keys: "Ctrl+4" },
    { id: "fmt-h5", group: "Writing", title: "Heading 5", keys: "Ctrl+5" },
    { id: "fmt-h6", group: "Writing", title: "Heading 6", keys: "Ctrl+6" },
    { id: "fmt-indent", group: "Writing", title: "Indent", keys: "Ctrl+]" },
    { id: "fmt-outdent", group: "Writing", title: "Outdent", keys: "Ctrl+[" },
    { id: "paste-image", group: "Writing", title: "Paste image from clipboard", keys: "Ctrl+V" },
    { id: "follow-link", group: "Writing", title: "Follow the link under the caret", keys: "Ctrl+Enter" },
    { id: "capture-daily", group: "Notes", title: "Quick capture: add to today's daily note", keys: "Ctrl+Enter" },
    { id: "capture-note", group: "Notes", title: "Quick capture: save as its own note", keys: "Ctrl+Shift+Enter" },
    { id: "switcher-new-tab", group: "Notes", title: "Quick switcher: open in a new tab", keys: "Ctrl+Enter" }
];

// Every remappable action - the list js/keymap.js resolves defaults from, and the settings UI lists.
function allShortcuts() {
    return COMMANDS.concat(SHORTCUTS_ONLY);
}

// `keymap` (optional): a js/keymap.js resolve()d {id: "combo"} map. Falls back to each entry's own default `keys`
// when omitted, so this stays usable without importing js/keymap.js.
function cheatSheet(keymap) {
    var groups = {};
    var order = [];
    allShortcuts().forEach(function (c) {
        // external (compositor-level) commands aren't in a resolved keymap at all - always show their fixed default
        var keys = c.external ? c.keys : (keymap ? keymap[c.id] : c.keys);
        if (!keys)
            return;
        if (!groups[c.group]) {
            groups[c.group] = [];
            order.push(c.group);
        }
        groups[c.group].push({ title: c.title, keys: keys });
    });
    return order.map(function (g) { return { group: g, items: groups[g] }; });
}
