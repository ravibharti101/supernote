# SuperNote

An Obsidian-style markdown notes vault for [DankMaterialShell](https://github.com/AvengeMedia/DankMaterialShell)
(DMS, Quickshell). It is a DMS plugin: a side panel that opens on a key press, edits plain `.md` files in a folder
you choose, and stays out of the way when closed. Your notes remain ordinary markdown files, so Obsidian, git, or any
editor can open the same folder.

<p align="center">
  <img src="docs/img/docked-editor.png" alt="SuperNote docked on the right, editing" width="330">
  <img src="docs/img/docked-preview.png" alt="Preview with math and a Mermaid diagram" width="330">
</p>

## Features

- **Vault** of plain markdown files (default `~/Documents/notes`, several vaults supported), file tree, autosave with
  conflict detection when a note changes on disk, `.obsidian` daily-note / template / attachment settings honoured
  (read-only).
- **Docked panel** on the right of the screen (sidebar hidden by default) that can be **expanded into a real window**.
- **Markdown editor**: syntax-colored, formatting toolbar and shortcuts, list/task/quote continuation, auto-pairing,
  find / replace, slash menu (`/`), Edit / Split / Preview.
- **Preview**: GitHub-flavoured markdown, callouts, tables, footnotes, note embeds, images, `==highlights==`, LaTeX
  math and Mermaid diagrams (rendered without a browser).
- **Navigation**: tabs with history, quick switcher (`Ctrl+O`), wikilinks with `[[` completion, backlinks, outline,
  command palette (`Ctrl+P`), keyboard cheat sheet (`Ctrl+/`).
- **Organization**: full-text search, nested tags, pinned and recent notes, link-safe rename / move with undo.
- **Capture**: a quick-capture box (`Super+Ctrl+N`) that appends to today's daily note or creates an Inbox note, daily
  notes, templates with variables, paste images from the clipboard, frontmatter properties editor.
- **Scriptable** through `dms ipc call supernote ...` ([docs/IPC.md](docs/IPC.md)).

## Install

### 1. Install the required tools

DMS/Quickshell itself has its own [install guide](https://github.com/AvengeMedia/DankMaterialShell) - do that first.
Math and Mermaid are optional: without their tools the source just stays visible as text / a code block instead of
a picture. Everything else below is required for basic vault operations (file listing, search, trash).

| Tool | Needed for | Debian / Ubuntu | Arch | Fedora |
|---|---|---|---|---|
| `rg`, `jq`, `gio` (glib) | vault operations, search, trash | `sudo apt install ripgrep jq libglib2.0-bin` | `sudo pacman -S ripgrep jq glib2` | `sudo dnf install ripgrep jq glib2` |
| `wl-clipboard` (`wl-paste`) | paste images, `supernote clip` | `sudo apt install wl-clipboard` | `sudo pacman -S wl-clipboard` | `sudo dnf install wl-clipboard` |
| ImageMagick (`magick`) | measuring rendered pictures, pasting non-PNG images | `sudo apt install imagemagick` | `sudo pacman -S imagemagick` | `sudo dnf install ImageMagick` |

- **`typst`** (LaTeX math): `sudo snap install typst`, or `cargo install typst-cli`, or your distro's package if it
  has one. The first time you actually render a formula, `scripts/supernote-render.sh` fetches the `mitex` package
  over the network once (then it's cached and works offline).
- **`mmdr`** (Mermaid diagrams): nothing to do - the first time you render a diagram,
  `scripts/supernote-render.sh` downloads a pinned, SHA-256-verified release into
  `~/.cache/supernote/render/bin/` automatically (network needed once, then offline). If you'd rather manage it
  yourself (or have no network access from this machine at all), put it on `PATH` instead:
  `cargo install mermaid-rs-renderer`.
- **Node 18+** (only to run `make test`, not needed to use the plugin): your distro's package, or
  [nodejs.org](https://nodejs.org), or `nvm install 22`.

Check what's actually on `PATH` at any point with:

```sh
command -v rg jq gio wl-paste magick typst mmdr node
```

### 2. Install the plugin (manual)

SuperNote isn't published to the [official DMS plugin registry](https://github.com/AvengeMedia/dms-plugin-registry),
so cloning it and symlinking it into DMS's plugin folder yourself is the only way to install it right now:

```sh
git clone <this repository> ~/Projects/DMS/plugins/supernote
ln -s ~/Projects/DMS/plugins/supernote ~/.config/DankMaterialShell/plugins/supernote   # or: make link
dms restart
```

Enable **SuperNote** in DMS Settings → Plugins, then bind keys (niri shown; the mango equivalents are in
[docs/CONFIGURATION.md](docs/CONFIGURATION.md#key-bindings)):

```kdl
Mod+Shift+N { spawn "dms" "ipc" "call" "supernote" "toggle"; }
Mod+Ctrl+N  { spawn "dms" "ipc" "call" "supernote" "quick"; }
```

Updating later is a `git pull` in the cloned checkout plus `dms restart` - the symlink means DMS always sees the
current checkout, there's nothing to re-copy.

## Quick start

| Key | Action |
|---|---|
| `Super+Shift+N` | open / close the panel |
| `Super+Ctrl+N` | quick capture (`Ctrl+Enter` add to daily note, `Ctrl+Shift+Enter` new Inbox note) |
| `Ctrl+O` / `Ctrl+P` | open a note / command palette |
| `Ctrl+N` / `F2` | new note / rename (edit the title) |
| `Ctrl+E` | cycle Edit → Split → Preview |
| `Ctrl+\` | show / hide the left panel (files, search, tags) |
| `Ctrl+Shift+F` | search all notes |
| `Ctrl+/` | every shortcut |

The full guide is in [docs/USAGE.md](docs/USAGE.md).

## Documentation

- [Usage](docs/USAGE.md) – everything the panel can do
- [IPC](docs/IPC.md) – `dms ipc call supernote ...`
- [Configuration](docs/CONFIGURATION.md) – settings, `.obsidian` compatibility, key bindings, files and paths
- [Architecture](docs/ARCHITECTURE.md) – how the code is organised
- [Development](docs/DEVELOPMENT.md) – dev loop, tests, conventions
- [Rendering](docs/RENDERING.md) – math and Mermaid pipeline
- [Design decisions](docs/DESIGN.md) – why it works the way it does
- [Changelog](CHANGELOG.md)

## License

MIT, see [LICENSE](LICENSE). `js/mdit.js` bundles [markdown-it](https://github.com/markdown-it/markdown-it) (MIT,
`vendor/markdown-it.LICENSE`).
