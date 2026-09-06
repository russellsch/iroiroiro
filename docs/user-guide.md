# User guide

iroiro iro saves one primary color for a folder or workspace. Open its commands from the Command Palette. A preview changes workspace settings temporarily. Press Enter to save or Escape to restore the prior appearance.

## Commands

| Command                     | Result                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| **Choose Color**            | Search all 240 built-in presets and custom presets by name or hex value, preview one, and save it.  |
| **Enter Hex Color**         | Enter three or six hex digits, with an optional `#`.                                                |
| **Random Color**            | Choose from 64 generated colors.                                                                    |
| **Random Preset**           | Choose from the distinct preset values.                                                             |
| **Lighten**                 | Increase HSL lightness by the configured step.                                                      |
| **Darken**                  | Decrease HSL lightness by the configured step.                                                      |
| **Save Current Color**      | Save the current value as a named user preset.                                                      |
| **Rename Preset**           | Rename a custom preset.                                                                             |
| **Edit Preset Color**       | Change a custom preset value.                                                                       |
| **Delete Preset**           | Remove a custom preset.                                                                             |
| **Choose Colored Parts**    | Select any of the 11 supported part groups.                                                         |
| **Undo Color Change**       | Restore the previous completed appearance in this window session.                                   |
| **Reset Workspace Colors**  | Restore unchanged owned values, remove the saved color, and disable workspace automatic assignment. |
| **Enable Automatic Color**  | Enable assignment for this workspace or the user default.                                           |
| **Disable Automatic Color** | Disable assignment for this workspace or the user default.                                          |
| **Open Settings**           | Open this extension's settings.                                                                     |
| **Retry Recovery**          | Retry restoration after you correct a settings or access problem.                                   |

## Colors, previews, and presets

Hex input removes surrounding spaces, expands short form, and saves lowercase six-digit form. For example, `#aBc` becomes `#aabbcc`. Alpha values, names, and CSS functions are invalid.

With previews enabled, picker movement applies a color after 100 ms. Dismissal, focus loss, Escape, or workspace closure cancels it. VS Code can leave an empty settings object or file after restoration.

Custom names contain 1 through 64 Unicode code points after trimming spaces, contain no control characters, and cannot match another preset after normalized case comparison. You can keep up to 1,000 valid custom presets. Editing a preset does not change workspaces that already use its value.

## Random and automatic colors

Random colors use bounded hue, saturation, and lightness values. When **Prefer Distinct Colors** is enabled, random selection favors colors that differ from other local windows. Distinct colors are not guaranteed.

Automatic assignment is off by default. When enabled, it colors an open workspace only if that workspace has no saved color. Choose preset or generated colors with `iroiroIro.autoColor.source`.

## Parts and shades

The activity bar, status bar, title bar, and sash hover border are selected by default. Other border groups are optional. The activity bar is one Lighten step above the primary color by default. Title and status bars use the primary color. Each bar can use `none`, `lighten`, or `darken`.

The extension calculates a readable black or white foreground. It leaves debugger, error, warning, remote, and high-contrast indicator colors unchanged.

Native title bars keep operating-system colors. Window borders depend on platform title-bar settings. A hidden part remains hidden, and Experimental Modern UI can ignore some tokens.

## Persistence, conflicts, Undo, and Reset

The extension writes `iroiroIro.color` and `workbench.colorCustomizations` at workspace scope. These changes can appear in `.vscode/settings.json`, a `.code-workspace` file, and Git.

An observed external color edit cancels preview and clears Undo history. The extension stops automatic updates for the affected part. Choose a color manually to control that part again.

Undo keeps up to 20 completed changes for the current window session. Reset restores only values that still match extension writes, removes the saved color, and writes workspace `iroiroIro.autoColor.enabled: false`. It keeps custom presets.

See [Settings](settings.md) for examples and [Troubleshooting](troubleshooting.md) for recovery and manual removal.
