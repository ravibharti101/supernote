const assert = require("assert");
const raw = require("./load")(__dirname + "/../js/commands.js");
const j = x => (x === undefined || x === null ? x : JSON.parse(JSON.stringify(x)));
const K = new Proxy({}, { get: (_, k) => typeof raw[k] === "function" ? (...a) => j(raw[k](...a)) : j(raw[k]) });
let passed = 0;
function test(name, fn) { try { fn(); passed++; } catch (e) { console.error("FAIL: " + name + "\n  " + e.message.split("\n").join("\n  ")); process.exitCode = 1; } }

test("command ids are unique and every command has a title", () => {
  const ids = K.COMMANDS.map(c => c.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(K.COMMANDS.every(c => c.title && c.group));
});
test("allShortcuts: every id (palette or not) is unique and has a title/group", () => {
  const all = K.allShortcuts();
  const ids = all.map(c => c.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(all.every(c => c.title && c.group && typeof c.keys === "string"));
  assert.ok(all.length > K.COMMANDS.length, "SHORTCUTS_ONLY should add ids beyond the palette commands");
});
test("the quick-capture shortcut is flagged external (compositor-level, not editable here)", () => {
  assert.strictEqual(K.COMMANDS.find(c => c.id === "capture").external, true);
  assert.ok(!K.SHORTCUTS_ONLY.some(c => c.external), "nothing else should need this flag");
});
test("filter: fuzzy on the title, empty query keeps menu order", () => {
  assert.strictEqual(K.filter("").length, K.COMMANDS.length);
  assert.strictEqual(K.filter("daily")[0].id, "daily");
  assert.deepStrictEqual(K.filter("zzzzqq"), []);
});
test("commands needing an open note are hidden without one", () => {
  const without = K.filter("", false).map(c => c.id);
  assert.ok(!without.includes("toggle-view") && without.includes("new-note"));
  assert.ok(K.filter("", true).map(c => c.id).includes("toggle-view"));
});
test("cheat sheet groups every shortcut once, using each entry's own default with no keymap given", () => {
  const groups = K.cheatSheet();
  assert.ok(groups.length >= 4);
  groups.forEach(g => assert.ok(g.items.length > 0 && g.items.every(i => i.keys && i.title)));
  const writing = groups.find(g => g.group === "Writing");
  assert.ok(writing && writing.items.some(i => i.title === "Bold" && i.keys === "Ctrl+B"));
});
test("cheat sheet shows the RESOLVED (remapped) combo when a keymap is given", () => {
  const keymap = {};
  K.allShortcuts().forEach(c => { keymap[c.id] = c.keys; });
  keymap["fmt-bold"] = "Ctrl+Alt+B";
  const writing = K.cheatSheet(keymap).find(g => g.group === "Writing");
  assert.strictEqual(writing.items.find(i => i.title === "Bold").keys, "Ctrl+Alt+B");
});
test("cheat sheet omits an id the keymap has unbound (empty combo)", () => {
  const keymap = {};
  K.allShortcuts().forEach(c => { keymap[c.id] = c.keys; });
  keymap["fmt-bold"] = "";
  const writing = K.cheatSheet(keymap).find(g => g.group === "Writing");
  assert.ok(!writing.items.some(i => i.title === "Bold"));
});
test("cheat sheet always shows the external quick-capture shortcut at its fixed default, keymap or not", () => {
  const keymap = {};
  K.allShortcuts().forEach(c => { keymap[c.id] = ""; }); // even if everything else were unbound
  const notes = K.cheatSheet(keymap).find(g => g.group === "Notes");
  assert.ok(notes.items.some(i => i.title === "Quick capture" && i.keys === "Super+Ctrl+N"));
});
console.log("commands.js: " + passed + " passed" + (process.exitCode ? " (with failures)" : ""));
