# Troubleshooting

## A command asks you to open a workspace

Open a folder or a workspace with at least one folder. Empty windows, browser clients, and VS Code forks are outside the supported scope.

## A selected part does not change

Confirm that the part is visible. The sash border appears only during hover. Native title bars keep operating-system colors. Window borders need `window.border: default` on supported Windows hosts and a custom title bar on macOS or Linux. Experimental Modern UI can ignore some color tokens.

## A theme-specific color stays visible

Check the top level and `[Theme Name]` entries in `workbench.colorCustomizations`. An outside edit wins and suspends the affected part. Choose a color manually to control that part again.

## Settings are read-only, unavailable, or invalid

Make `.vscode/settings.json` or the `.code-workspace` file writable, or reconnect the remote workspace. Correct invalid JSON through **Open Workspace Settings**, then run **iroiro iro: Retry Recovery**.

An invalid nonempty `iroiroIro.color` blocks automatic assignment. Enter a valid three-digit or six-digit hex color, or run **Reset Workspace Colors**. Invalid preferences use their defaults. Invalid presets are excluded.

## Recovery remains blocked

Restore settings access and valid JSON, then run **Retry Recovery**. The extension preserves later outside edits. If retry still fails, collect the log codes and use manual removal when you need to clear visible colors.

## Installation or remote commands fail

Confirm that VS Code is 1.104.0 or later, that the download is the VSIX rather than a source archive, and that its checksum matches `SHA256SUMS`. See the [installation guide](install.md).

For Remote SSH, WSL, or Dev Containers, install iroiro iro under **Local - Installed**. The remote connection must already work.

## Offline behavior

An installed VSIX and normal color, preset, and recovery commands work offline. Remote workspaces still need their normal connection. A local coordination failure can reduce distinct-color information but does not stop random selection.

## View the log

1. Run **View: Output**.
2. Select **iroiro iro**.
3. Reproduce the problem once.
4. Copy the event codes and VS Code version. Omit private paths, file contents, and preset names.

## Manual color removal

Run **Reset Workspace Colors** before uninstalling when possible. If it cannot run:

1. Remove workspace `iroiroIro.color`.
2. Set workspace `iroiroIro.autoColor.enabled` to `false` if user-level automatic coloring must stay disabled.
3. In `workbench.colorCustomizations`, remove only values that you know iroiro iro wrote, including matching values inside `[Theme Name]` objects.
4. Keep every unrelated setting and selector entry.

Owned groups use activity bar and badge keys, `activityBarTop.*`, title bar and Command Center keys, status bar keys, `sash.hoverBorder`, and the selected editor-group, panel, side-bar, status-bar, title-bar, active-tab, and window border keys. Do not remove debugger, error, warning, remote, syntax, editor-background, prominent-item, or high-contrast indicator values.

Manual removal cannot reconstruct an unknown older value after recovery data is lost.

## Issue report template

Open an issue at [github.com/russellsch/iroiroiro/issues](https://github.com/russellsch/iroiroiro/issues) with:

```text
iroiro iro and VS Code versions:
Operating system:
Workspace type: folder / workspace / SSH / WSL / container
Theme and title bar style:
Command or startup action:
Expected and actual result:
Reproduction steps:
iroiro iro log codes:
Does Retry Recovery succeed?:
```

Remove private paths, source text, settings secrets, and preset names.
