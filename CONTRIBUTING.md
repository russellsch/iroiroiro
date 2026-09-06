# Contributing

## Setup

Use Git, Node.js 24 LTS, and npm 11. The manifest and lockfile select the project tools.

```sh
git clone https://github.com/russellsch/iroiroiro.git
cd iroiroiro
npm ci --ignore-scripts
```

For a release, check out its `v<version>` tag before setup. Lifecycle scripts stay disabled, and the installed extension has no third-party runtime packages. Read the [build-tool review](docs/build-tools.md) before you run a changed dependency tree.

## Source structure

Runtime code is in `src`, tests are in `test`, commands are in `scripts`, and documents are in `docs`. The settings writer owns workspace writes.

## Commands

Run commands from the repository root.

| Command                                   | Result                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `npm ci --ignore-scripts`                 | Install the locked tree without lifecycle scripts.                        |
| `npm run check`                           | Check types, lint, format, metadata, imports, dependencies, and catalogs. |
| `npm run lint` / `npm run lint:fix`       | Report lint errors or apply available corrections.                        |
| `npm run format:check` / `npm run format` | Check or apply the project format.                                        |
| `npm test`                                | Compile and run unit and tooling tests.                                   |
| `npm run docs:check`                      | Check links, examples, commands, settings, and presets.                   |
| `npm run build`                           | Remove stale output and compile runtime modules.                          |
| `npm run package`                         | Run the gates, create the VSIX, and inspect its contents.                 |

Commands after setup do not download packages. Verification commands do not modify authored files.

## Tests

Unit tests use Node.js modules. Add a regression test for a reproducible defect, especially in ownership, recovery, or concurrency.

Integration tests use an installed VS Code desktop and disposable profiles, extension directories, and workspaces. The runner does not download VS Code or write to the normal user profile.

Linux:

```sh
npm run test:integration -- --vscode-path /usr/bin/code
```

macOS:

```sh
npm run test:integration -- --vscode-path "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
```

Windows PowerShell:

```powershell
npm run test:integration -- --vscode-path "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe"
```

Use `Code.exe` because the runner does not execute shell wrappers. Add `--vsix-path artifacts/iroiro-iro-0.1.1.vsix` to test the installed artifact and record its checksum.

Record the operating system and VS Code version. One local result does not complete the environment matrix. Follow the [verification procedure](docs/verification.md) for remote, visual, and release checks.

## Dependencies

Follow the [approved-tool and dependency review policy](docs/build-tools.md) before installing a changed tree.

## Documents and release preparation

Update affected guides and keep requirement IDs stable. Record actual results in the version record. Unavailable checks remain Open.

`npm run package` creates the VSIX and checksum without publishing. It includes runtime files and user documents and excludes development content.

A release uses matching manifest, tag, asset, changelog, and record versions. Verify the downloaded GitHub asset and checksum after publication.

To publish a release:

1. Update the version in `package.json` and `package-lock.json`, the changelog, and the release record. Commit and push the changes, including `.github/workflows/release.yml`.
2. On GitHub, create and publish a release with tag `v<version>` at that commit. A published pre-release also starts the workflow. Saving a draft does not start it.
3. Wait for **Release VSIX** in Actions to pass. The workflow checks the tag, runs `npm run package`, attaches the VSIX and `SHA256SUMS`, and checks the downloaded assets.

The workflow uses GitHub's automatic token; no release secret is required. For a temporary failure, rerun the job. An upload retry replaces only the two generated assets. The workflow requires mutable releases because [immutable releases lock assets at publication](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
