.pragma library

// Turns a live keypress into the same "Ctrl+Shift+X" style string js/commands.js already uses for display, and
// resolves a sparse user-override map against a list of {id, keys} defaults (tests/keymap.test.js).
// `ev` = {key, ctrl, shift, alt, meta} with Qt key codes (meta = Super/Windows key).

// Qt key codes actually needed here: letters/digits match ASCII; named/punctuation keys are the well-known
// Qt::Key_* values (same convention as js/mdkeys.js - literal numbers so this loads in plain Node for tests).
var KEY = {
    Tab: 0x01000001, Backtab: 0x01000002, Backspace: 0x01000003, Return: 0x01000004, Enter: 0x01000005,
    Insert: 0x01000006, Delete: 0x01000007, Home: 0x01000010, End: 0x01000011, Left: 0x01000012, Up: 0x01000013,
    Right: 0x01000014, Down: 0x01000015, PageUp: 0x01000016, PageDown: 0x01000017, F1: 0x01000030,
    Space: 0x20, Comma: 0x2C, Minus: 0x2D, Period: 0x2E, Slash: 0x2F, Semicolon: 0x3B, Equal: 0x3D,
    Apostrophe: 0x27, Grave: 0x60, BracketLeft: 0x5B, Backslash: 0x5C, BracketRight: 0x5D, Plus: 0x2B
};

// Qt key code -> the display character/token js/commands.js already writes for it. Letters and digits are
// derived (their codes equal their uppercase ASCII / '0'-'9' values), not listed here.
var NAMED = {};
NAMED[KEY.Tab] = "Tab";
NAMED[KEY.Backspace] = "Backspace";
NAMED[KEY.Insert] = "Insert";
NAMED[KEY.Delete] = "Delete";
NAMED[KEY.Home] = "Home";
NAMED[KEY.End] = "End";
NAMED[KEY.Left] = "Left";
NAMED[KEY.Up] = "Up";
NAMED[KEY.Right] = "Right";
NAMED[KEY.Down] = "Down";
NAMED[KEY.PageUp] = "PageUp";
NAMED[KEY.PageDown] = "PageDown";
NAMED[KEY.Space] = "Space";
NAMED[KEY.Comma] = ",";
NAMED[KEY.Minus] = "-";
NAMED[KEY.Period] = ".";
NAMED[KEY.Slash] = "/";
NAMED[KEY.Semicolon] = ";";
NAMED[KEY.Apostrophe] = "'";
NAMED[KEY.Grave] = "`";
NAMED[KEY.BracketLeft] = "[";
NAMED[KEY.Backslash] = "\\";
NAMED[KEY.BracketRight] = "]";
for (var f = 0; f < 12; f++)
    NAMED[KEY.F1 + f] = "F" + (f + 1);

// The name -> code table the settings UI / tests can go the other way with (parse() below).
var TOKEN = {};
Object.keys(NAMED).forEach(function (code) { TOKEN[NAMED[code]] = parseInt(code, 10); });
for (var c = 65; c <= 90; c++)
    TOKEN[String.fromCharCode(c)] = c;
for (var d = 48; d <= 57; d++)
    TOKEN[String.fromCharCode(d)] = d;

// The canonical string for one keypress. Ctrl/Shift/Alt/Super order matches every existing js/commands.js entry.
// Return and Enter (two physical keys, one meaning) both become "Enter"; Backtab (what Qt sends for Shift+Tab in
// some contexts regardless of the modifier bit) becomes "Shift+Tab". The +/- key is the one place a shifted and
// an unshifted press are already treated as the same shortcut ("Alt++" also fires on plain "Alt+="): Key_Equal and
// Key_Plus (whichever the platform reports) both become the character actually produced, and - like every other
// character token here - that character is never combined with a separate "Shift+" prefix.
function eventCombo(ev) {
    var key = ev.key;
    var shift = !!ev.shift;
    var token;
    if (key === KEY.Return || key === KEY.Enter) {
        token = "Enter";
    } else if (key === KEY.Backtab) {
        token = "Tab";
        shift = true;
    } else if (key === KEY.Equal || key === KEY.Plus) {
        token = shift || key === KEY.Plus ? "+" : "=";
        shift = false;
    } else if (NAMED[key] !== undefined) {
        token = NAMED[key];
    } else if ((key >= 65 && key <= 90) || (key >= 48 && key <= 57)) {
        token = String.fromCharCode(key);
    } else {
        return "";
    }
    var mods = "";
    if (ev.ctrl) mods += "Ctrl+";
    if (shift) mods += "Shift+";
    if (ev.alt) mods += "Alt+";
    if (ev.meta) mods += "Super+";
    return mods + token;
}

// "Ctrl+Shift+X" -> {ctrl, shift, alt, meta, token}, stripping recognized modifier prefixes off the front in any
// order and treating whatever is left (even if it looks like another prefix, e.g. a lone "Shift") as the token.
function parse(combo) {
    var s = String(combo || "");
    var mods = { ctrl: false, shift: false, alt: false, meta: false };
    var names = { "Ctrl+": "ctrl", "Shift+": "shift", "Alt+": "alt", "Super+": "meta" };
    var again = true;
    while (again) {
        again = false;
        for (var prefix in names) {
            if (s.length > prefix.length && s.indexOf(prefix) === 0) {
                mods[names[prefix]] = true;
                s = s.slice(prefix.length);
                again = true;
                break;
            }
        }
    }
    mods.token = s;
    return mods;
}

// `defaults` = [{id, keys}, ...] (js/commands.js's allShortcuts()); `overrides` = the sparse {id: "combo"} object
// from the user's saved settings (empty/undefined combo = default; "" as an override means explicitly unbound).
function resolve(defaults, overrides) {
    var out = {};
    var ov = overrides || {};
    (defaults || []).forEach(function (d) {
        out[d.id] = ov[d.id] !== undefined ? ov[d.id] : (d.keys || "");
    });
    return out;
}

// Which of `candidateIds` (if given; every id in the map otherwise) currently owns this exact combo.
function idFor(combo, resolvedMap, candidateIds) {
    if (!combo)
        return null;
    var ids = candidateIds || Object.keys(resolvedMap || {});
    for (var i = 0; i < ids.length; i++) {
        if ((resolvedMap || {})[ids[i]] === combo)
            return ids[i];
    }
    return null;
}

// Every id (other than excludeId) already bound to this combo - for the settings UI's "already used by..." check.
function conflicts(combo, resolvedMap, excludeId) {
    if (!combo)
        return [];
    var out = [];
    for (var id in resolvedMap || {}) {
        if (id !== excludeId && resolvedMap[id] === combo)
            out.push(id);
    }
    return out;
}
