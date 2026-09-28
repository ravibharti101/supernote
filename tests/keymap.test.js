const assert = require("assert");
const raw = require("./load")(__dirname + "/../js/keymap.js");
const j = x => (x === undefined || x === null ? x : JSON.parse(JSON.stringify(x)));
const K = new Proxy({}, { get: (_, k) => (...a) => j(raw[k](...a)) });
let passed = 0;
function test(name, fn) { try { fn(); passed++; } catch (e) { console.error("FAIL: " + name + "\n  " + e.message.split("\n").join("\n  ")); process.exitCode = 1; } }

// Qt key codes (same literal-numeric convention as tests/mdkeys.test.js)
const Key = {
  Tab: 0x01000001, Backtab: 0x01000002, Return: 0x01000004, Enter: 0x01000005, Delete: 0x01000007,
  Left: 0x01000012, F2: 0x01000031, Backslash: 0x5C, BracketRight: 0x5D, Equal: 0x3D, Plus: 0x2B, Minus: 0x2D,
  B: 0x42, X: 0x58, N: 0x4E
};
const ev = o => Object.assign({ key: 0, ctrl: false, shift: false, alt: false, meta: false }, o);

test("a plain letter with Ctrl", () => assert.strictEqual(K.eventCombo(ev({ key: Key.B, ctrl: true })), "Ctrl+B"));
test("modifier order is always Ctrl, Shift, Alt, Super", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.X, ctrl: true, shift: true, alt: true, meta: true })), "Ctrl+Shift+Alt+Super+X");
});
test("Return and Enter both become \"Enter\"", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.Return, ctrl: true })), "Ctrl+Enter");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Enter, ctrl: true })), "Ctrl+Enter");
});
test("Backtab is Shift+Tab even without the shift bit set", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.Backtab, ctrl: true })), "Ctrl+Shift+Tab");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Backtab, ctrl: true, shift: true })), "Ctrl+Shift+Tab");
});
test("the +/- key: shifted and unshifted both fold to a bare character, never \"Shift+\"", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.Equal, alt: true })), "Alt+=");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Equal, alt: true, shift: true })), "Alt++");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Plus, alt: true })), "Alt++");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Minus, alt: true })), "Alt+-");
});
test("named/punctuation keys", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.Backslash, ctrl: true })), "Ctrl+\\");
  assert.strictEqual(K.eventCombo(ev({ key: Key.BracketRight, ctrl: true })), "Ctrl+]");
  assert.strictEqual(K.eventCombo(ev({ key: Key.F2 })), "F2");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Delete })), "Delete");
  assert.strictEqual(K.eventCombo(ev({ key: Key.Left, alt: true })), "Alt+Left");
});
test("a digit", () => assert.strictEqual(K.eventCombo(ev({ key: 0x31, ctrl: true })), "Ctrl+1"));
test("Super alone with Ctrl (display only - not actually reachable from a live event today)", () => {
  assert.strictEqual(K.eventCombo(ev({ key: Key.N, ctrl: true, meta: true })), "Ctrl+Super+N");
});
test("an unrecognized key produces no combo", () => assert.strictEqual(K.eventCombo(ev({ key: 0x01ffffff })), ""));

test("parse strips modifiers in any order, leftover is the token", () => {
  assert.deepStrictEqual(K.parse("Ctrl+Shift+X"), { ctrl: true, shift: true, alt: false, meta: false, token: "X" });
  assert.deepStrictEqual(K.parse("Alt++"), { ctrl: false, shift: false, alt: true, meta: false, token: "+" });
  assert.deepStrictEqual(K.parse("Ctrl+\\"), { ctrl: true, shift: false, alt: false, meta: false, token: "\\" });
  assert.deepStrictEqual(K.parse(""), { ctrl: false, shift: false, alt: false, meta: false, token: "" });
});

const defaults = [{ id: "new-note", keys: "Ctrl+N" }, { id: "fmt-bold", keys: "Ctrl+B" }, { id: "unbound", keys: "" }];

test("resolve: no overrides falls back to defaults", () => {
  assert.deepStrictEqual(K.resolve(defaults, {}), { "new-note": "Ctrl+N", "fmt-bold": "Ctrl+B", unbound: "" });
});
test("resolve: an override wins over the default", () => {
  assert.strictEqual(K.resolve(defaults, { "new-note": "Ctrl+Alt+N" })["new-note"], "Ctrl+Alt+N");
});
test("resolve: an explicit empty-string override means unbound", () => {
  assert.strictEqual(K.resolve(defaults, { "fmt-bold": "" })["fmt-bold"], "");
});
test("resolve: overrides for unknown ids are ignored", () => {
  assert.deepStrictEqual(Object.keys(K.resolve(defaults, { ghost: "Ctrl+G" })).sort(), ["fmt-bold", "new-note", "unbound"]);
});

test("idFor finds the id owning a combo, scoped to the given candidates", () => {
  const map = K.resolve(defaults, {});
  assert.strictEqual(K.idFor("Ctrl+N", map, ["new-note", "fmt-bold"]), "new-note");
  assert.strictEqual(K.idFor("Ctrl+B", map, ["new-note"]), null);
  assert.strictEqual(K.idFor("Ctrl+Z", map), null);
  assert.strictEqual(K.idFor("", map), null);
});
test("idFor with no candidate list searches every id", () => {
  const map = K.resolve(defaults, {});
  assert.strictEqual(K.idFor("Ctrl+B", map), "fmt-bold");
});

test("conflicts lists every other id sharing a combo, excluding the one being edited", () => {
  const map = K.resolve(defaults, { "fmt-bold": "Ctrl+N" });
  assert.deepStrictEqual(K.conflicts("Ctrl+N", map, "fmt-bold"), ["new-note"]);
  assert.deepStrictEqual(K.conflicts("Ctrl+N", map, "new-note"), ["fmt-bold"]);
  assert.deepStrictEqual(K.conflicts("Ctrl+N", map), ["new-note", "fmt-bold"]);
});
test("conflicts is empty for an unbound combo", () => assert.deepStrictEqual(K.conflicts("", K.resolve(defaults, {})), []));

console.log("keymap.js: " + passed + " passed" + (process.exitCode ? " (with failures)" : ""));
