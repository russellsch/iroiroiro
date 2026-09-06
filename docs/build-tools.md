# Build tools

Use Node.js 24 LTS and npm 11. Exact tool versions are in `package.json`. The full dependency tree and integrity data are in `package-lock.json`.

## Approved tools

- `typescript`, `@types/vscode`, and `@types/node` for compilation and host types.
- `@vscode/vsce` for packaging.
- `eslint`, `@eslint/js`, and `typescript-eslint` for static checks.
- `prettier` and `eslint-config-prettier` for formatting.

These are development dependencies. The installed extension has no third-party runtime packages. A new direct package requires owner approval.

## Dependency changes

1. Update the proposed manifest and lockfile without executing package code.
2. Review the full lockfile diff, sources, integrity values, installation scripts, deprecations, and advisories.
3. Record the reason for the change and resolve any concerns before installation.
4. Install with `npm ci --ignore-scripts`, then run `npm run package`.

Use these commands to prepare and inspect the proposed tree:

```sh
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
npm audit --package-lock-only --ignore-scripts --json
```
