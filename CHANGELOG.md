# Changelog

## [0.1.1] - 2026-09-05

Status: Local candidate for VSIX installation.

### Changed

- Increased the package version so VS Code can install it as an update to 0.1.0.
- Kept the current features, installed Details page, and changelog. The blank-page issue reported in an existing VS Code profile remains unresolved.

## [0.1.0] - 2026-09-05

Status: Unreleased candidate. No `v0.1.0` tag or GitHub Release asset is published yet.

### Added

- Persistent workspace colors from 240 built-in presets, custom presets, solid hex input, and random choices.
- Live previews, selected bars and borders, readable foregrounds, shade controls, Undo, Reset, and recovery.
- Optional automatic assignment and best-effort distinct colors across local windows.
- Desktop and local UI support for Remote SSH, WSL, and Dev Containers.
- GitHub Actions builds and attaches the VSIX and checksum when a release is published.
- Extension icon and installed Details page with features, quick-start steps, and guides.

### Color controls

- Enter three-digit or six-digit hex colors, with or without `#`.
- Save, rename, edit, and delete named custom presets.
- Choose a random preset or generated color, then lighten or darken it from the Command Palette.
- Select the bars and borders to color. Set separate shade adjustments for the activity, title, and status bars.
- Preview colors before saving. Cancel a preview, undo the last change, or reset workspace colors.

### Compatibility and limitations

- Requires VS Code 1.104.0 or later and uses extension ID `russellsch.iroiro-iro`.
- Browser clients, empty windows, VS Code forks, Live Share, and independent per-part primary colors are outside release 1.
- Native title bars and window borders depend on host settings. See [troubleshooting](docs/troubleshooting.md#a-selected-part-does-not-change).
- Experimental Modern UI can ignore affected color tokens.
- Uninstall does not guarantee settings cleanup. Run Reset first or use [manual removal](docs/troubleshooting.md#manual-color-removal).
- Remaining platform release checks are recorded in the release evidence.
