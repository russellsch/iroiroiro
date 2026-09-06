# Install iroiro iro

Version 0.1.1 is an unreleased candidate. Build the current source until a release asset and tag are published.

## Requirements

The installed extension needs VS Code 1.104.0 or later on Windows, macOS, or Linux. It needs no separate runtime, account, or network connection. In Remote SSH, WSL, and Dev Container windows, install it under **Local - Installed**.

## Install a published VSIX

1. Open the [iroiro iro Releases page](https://github.com/russellsch/iroiroiro/releases) and select a version.
2. Download `iroiro-iro-<version>.vsix` and `SHA256SUMS` from **Assets**. The GitHub source archives are for source builds.
3. Verify that the VSIX SHA-256 value equals the value beside its name in `SHA256SUMS`.

Windows PowerShell:

```powershell
Get-FileHash .\iroiro-iro-0.1.1.vsix -Algorithm SHA256
Get-Content .\SHA256SUMS
```

macOS or Linux:

```sh
shasum -a 256 iroiro-iro-0.1.1.vsix # macOS
sha256sum iroiro-iro-0.1.1.vsix     # Linux
cat SHA256SUMS
```

4. In VS Code, run **Extensions: Install from VSIX**, select the file, and reload when asked.
5. In the Extensions view, confirm the installed version.

The command-line alternative is:

```sh
code --install-extension <path-to-vsix>
```

## Verify operation

1. Open a folder or workspace.
2. Run **iroiro iro: Choose Color** and save a color.
3. Reopen the workspace and confirm that the color returns.
4. Run **iroiro iro: Reset Workspace Colors** if this was only a test.

The extension ID is `russellsch.iroiro-iro`. You can check it with `code --list-extensions --show-versions`.

## Build from source

This path needs Git, a supported Node.js LTS release, npm, and network access for the first dependency installation.

```sh
git clone https://github.com/russellsch/iroiroiro.git
cd iroiroiro
npm ci --ignore-scripts
npm run check
npm test
npm run package
```

The package command creates the VSIX and `SHA256SUMS` in `artifacts/`. To build a published release, select its fixed source tag first:

```sh
git fetch --tags
git checkout v<version>
```

Then run the dependency, check, test, and package commands above.

## Offline use and updates

Download and verify both release files before disconnecting. Installation and local color commands then work offline. Remote workspaces still need their normal connection.

The extension has no update checker. Download, verify, and install a newer VSIX over the existing version. Saved colors, preferences, and custom presets remain in VS Code settings. Review the [changelog](../CHANGELOG.md) first.

## Remove

1. Run **iroiro iro: Reset Workspace Colors** in each workspace that you want to clean.
2. Uninstall **iroiro iro** from the Extensions view, or run `code --uninstall-extension russellsch.iroiro-iro`.
3. Reload VS Code.

VS Code does not guarantee cleanup during uninstall. If Reset cannot run, use [Manual color removal](troubleshooting.md#manual-color-removal).
