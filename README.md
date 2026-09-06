# iroiro iro (色々色)

<img src="iroiro-icon-256.png" alt="iroiro iro logo" width="64" height="64">

iroiro iro gives each Visual Studio Code workspace a clear color. It colors selected bars and borders, saves the choice with the workspace, and restores it when you return.

This was built with minimal dependencies to reduce security surface area of my VS Code extensions. It's not really intended for consumption by others, but if it helps you out that's great. 

## Install

Download the VSIX and `SHA256SUMS` from [GitHub Releases](https://github.com/russellsch/iroiroiro/releases), verify the checksum, and run **Extensions: Install from VSIX**. Until then, use the source-build steps in the [installation guide](docs/install.md).

## Quick start

1. Open a folder or workspace.
2. Run **iroiro iro: Choose Color** from the Command Palette.
3. Move through the presets to preview them. Press Enter to save or Escape to cancel.
4. Run **iroiro iro: Choose Colored Parts** to change the affected areas.

Workspace setting changes can appear in Git. **Reset Workspace Colors** restores unchanged owned values, removes the saved color, and disables automatic assignment for that workspace.

## Features

- **240 built-in colors.** Choose familiar names such as Red, Dark red, Light red, Green, and Plum.
- **Custom colors and presets.** Enter a hex code such as `#aaa` or `#336699`. Save a color with a name, then rename, edit, or delete your custom presets.
- **Random colors.** Choose a random preset or a generated color. The extension can prefer colors that differ from other participating workspace windows.
- **Lighten and darken.** Adjust the current color from the Command Palette. Set the adjustment step in Settings.
- **Live preview.** Preview a preset before saving it. Press Escape to cancel the preview.
- **Saved workspace colors.** Reopen a project to restore its color. Enable automatic assignment to give new, uncolored workspaces a preset or generated color. Automatic assignment is off by default.
- **Selected bars and borders.** Use one main color with optional bar shades and readable foreground colors.
- **Undo and Reset.** Undo the last color change or reset the workspace colors. Later changes made by you or another extension remain in place.

All color commands start with **iroiro iro:** in the Command Palette. The optional status bar item shows the saved color and opens the color picker.

## What gets colored

By default, the extension colors the activity bar, status bar, title bar, and the divider when you hover over it. The activity bar uses a lighter shade.

Use **iroiro iro: Choose Colored Parts** to select these parts or add borders around editor groups, panels, sidebars, status bars, title bars, active tabs, and the window. Some title bars and window borders depend on your operating system and VS Code settings. See [display limitations](docs/troubleshooting.md#a-selected-part-does-not-change).

## Local operation

Color selection works offline. The extension has no third-party runtime packages and no update checker. In SSH, WSL, and Dev Container windows, it runs in the local VS Code UI host.

## Guides

- [Installation](docs/install.md)
- [User guide](docs/user-guide.md)
- [Settings](docs/settings.md)
- [Troubleshooting and recovery](docs/troubleshooting.md)
- [Changelog](CHANGELOG.md)

This project uses the MIT License.
