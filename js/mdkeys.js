.pragma library
.import "markdown.js" as Md
.import "keymap.js" as Keymap

// Markdown editing keys shared by the main editor and the quick-capture box (pure; tests/mdkeys.test.js).
// `ev` = {key, ctrl, shift, alt, text} with Qt key codes; results are edits {start, end, text, selStart, selEnd}.
// `keymap` (in `handle`) is a js/keymap.js resolve()d map, from js/commands.js's remappable `fmt-*` ids.

var KEY = { Return: 0x01000004, Enter: 0x01000005, Tab: 0x01000001, Backtab: 0x01000002 };

// js/commands.js's ids for these shortcuts are "fmt-" + this function's own action name (bold, h0, indent, ...),
// so recovering the action from a matched id is just dropping the prefix - no separate id->name table needed.
var FORMAT_IDS = ["fmt-bold", "fmt-italic", "fmt-strike", "fmt-code", "fmt-link", "fmt-task", "fmt-h0", "fmt-h1", "fmt-h2", "fmt-h3", "fmt-h4", "fmt-h5", "fmt-h6", "fmt-indent", "fmt-outdent"];

// Named formatting command (toolbar buttons, shortcuts, palette) -> edit or null.
function format(name, t, s, e) {
    switch (name) {
    case "bold": return Md.wrapSelection(t, s, e, "**", "**");
    case "italic": return Md.wrapSelection(t, s, e, "*", "*");
    case "strike": return Md.wrapSelection(t, s, e, "~~", "~~");
    case "code": return Md.wrapSelection(t, s, e, "`", "`");
    case "link": return Md.insertLink(t, s, e);
    case "task": return Md.toggleTask(t, s, e);
    case "bullet": return Md.togglePrefix(t, s, e, "- ");
    case "quote": return Md.togglePrefix(t, s, e, "> ");
    case "indent": return Md.indentLines(t, s, e, 1);
    case "outdent": return Md.indentLines(t, s, e, -1);
    }
    if (/^h[0-6]$/.test(name))
        return Md.setHeading(t, s, e, parseInt(name.slice(1), 10));
    return null;
}

function shortcutName(ev, keymap) {
    var combo = Keymap.eventCombo({ key: ev.key, ctrl: ev.ctrl, shift: ev.shift, alt: ev.alt, meta: false });
    var id = combo ? Keymap.idFor(combo, keymap, FORMAT_IDS) : null;
    return id ? id.slice(4) : "";
}

// The edit for a key press, or null when the editor should do its normal thing. `keymap` is only needed for the
// ctrl-shortcut branch below; plain Enter/Tab/auto-pair (not remappable) don't consult it.
function handle(text, s, e, ev, keymap) {
    if (ev.ctrl && !ev.alt)
        return format(shortcutName(ev, keymap), text, s, e);
    if (ev.alt || ev.ctrl)
        return null;
    if (ev.key === KEY.Return || ev.key === KEY.Enter) {
        if (ev.shift || s !== e)
            return null;
        return Md.continueList(text, e);
    }
    if (ev.key === KEY.Tab || ev.key === KEY.Backtab)
        return Md.indentLines(text, s, e, (ev.key === KEY.Backtab || ev.shift) ? -1 : 1);
    if (ev.text && ev.text.length === 1)
        return Md.pairInput(text, s, e, ev.text);
    return null;
}

// Replace [start,end) with text, touching only what actually changed (keeps undo tidy).
// `editor` is a TextArea/TextEdit.
function applyEdit(editor, ed) {
    var t = editor.text;
    var oldSlice = t.slice(ed.start, ed.end);
    var a = 0;
    var maxA = Math.min(oldSlice.length, ed.text.length);
    while (a < maxA && oldSlice.charAt(a) === ed.text.charAt(a))
        a++;
    var b = 0;
    var maxB = Math.min(oldSlice.length - a, ed.text.length - a);
    while (b < maxB && oldSlice.charAt(oldSlice.length - 1 - b) === ed.text.charAt(ed.text.length - 1 - b))
        b++;
    var rs = ed.start + a;
    var re = ed.end - b;
    var ins = ed.text.slice(a, ed.text.length - b);
    if (re > rs)
        editor.remove(rs, re);
    if (ins.length)
        editor.insert(rs, ins);
    if (ed.selStart === ed.selEnd)
        editor.cursorPosition = ed.selStart;
    else
        editor.select(ed.selStart, ed.selEnd);
}
