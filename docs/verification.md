# Verification procedure

## Record each run

Use disposable workspaces and an isolated VS Code profile. Record the operating system, architecture, VS Code and extension versions, source commit, date, requirement IDs, result, evidence, and candidate checksum. Keep unavailable environments Open.

## Automated checks

```sh
npm run check
npm test
npm run docs:check
npm run build
npm run test:integration -- --vscode-path /usr/bin/code
npm run package
```

Use the selected VS Code executable. The [contributor guide](../CONTRIBUTING.md#tests) gives macOS and Windows examples. Repeat integration on the minimum and current stable VS Code versions.

## Environment matrix

Repeat the applicable requirements [Matrix E](requirements.md#45-matrix-e-environment-verification) checks:

- Test single-folder and multiple-folder workspaces on Windows, macOS, and Linux.
- Test Linux workspaces through Remote SSH, WSL 2, and Dev Containers from the applicable clients.
- Save and reopen a two-folder untitled workspace.
- Test light, dark, and both high-contrast theme kinds.
- Test supported activity-bar positions and platform border modes.
- Test native title bars, hidden parts, and Restricted Mode.

Record the actual host. One environment result does not apply to another.

## Keyboard and visual checks

1. Open a disposable workspace that has unrelated color overrides.
2. Complete all commands with the keyboard and check accessible control names.
3. Preview colors, press Escape, and compare settings with the original values.
4. Accept a color, reopen the workspace, and check the saved color and status text.
5. Enable each optional part separately and compare it with the surface specification.
6. Change themes, layouts, and window focus, then check the saved primary color.

Check badges, the Command Center, and divider hover. State indicators must retain theme values. Color commands must not alter layout.

## Failure and concurrency checks

Make settings read-only and request a color. Restore access, run **Retry Recovery**, and compare the appearance with the initial state. Repeat with invalid JSON and a disconnected remote.

Terminate an isolated extension host after a preview write. Reopen the same profile and check restoration before automatic assignment.

Externally change an owned preview token. Preview must cancel and preserve it. Use multiple windows to check propagation and random-color reservations.

## Timing and idle checks

Use requirements [Profile T](requirements.md#44-profile-t-timing-measurements). Follow its samples, boundaries, and limits. Keep unavailable measurements Open.

After `npm test`, this optional command measures the pure random-selection boundary:

```sh
node scripts/measure-color-selection.mjs
```

This calculation does not replace host timing. During a ten-minute idle check, peer heartbeats can update extension storage, but workspace configuration writes must remain zero.

## Package and delivery

Test the packaged extension itself:

```sh
npm run test:integration -- --vscode-path /usr/bin/code --vsix-path artifacts/iroiro-iro-0.1.0.vsix
```

The runner installs the VSIX into isolated profiles for single-folder and multiple-folder scenarios. Confirm that its recorded checksum matches `artifacts/SHA256SUMS`.

Install the same candidate in a clean profile on each required host. Check local installation and commands without network access. Test an update fixture for saved workspace colors, user presets, part choices, and automatic settings.

Publish only after the applicable gates pass and publication is authorized. After publication, download the GitHub asset, verify `SHA256SUMS`, and record the tag, source commit, links, and results.
