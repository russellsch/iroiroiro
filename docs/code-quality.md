# Code quality

## Compiler

`tsconfig.base.json` is the authoritative compiler policy. `tsconfig.check.json` checks all authored TypeScript without emission. Build and test configurations emit runtime and test files separately.

Strict checks cover data access, caught values, control flow, unused declarations, casing, imports, and declarations. Type-only dependencies use `import type`. Emitted modules are CommonJS.

## Lint

`eslint.config.mjs` is the authoritative rule list. ESLint checks runtime code, tests, scripts, and JavaScript configuration with zero warnings. TypeScript rules use project type information. Only dependencies, generated output, archives, and caches are excluded.

Checks reject unsafe types, assertions, incomplete state switches, invalid promise handling, loose equality, missing braces, debugger statements, and runtime `console` use. Unused suppressions fail.

## Formatting

`.prettierrc.json` is the authoritative format. Prettier covers authored TypeScript, JavaScript, JSON, Markdown, and YAML. The npm lockfile, dependencies, generated files, output, archives, and caches are excluded. No editor extension is required.

## Coding practices

Treat user settings, parsed JSON, extension storage, peer records, and untyped callbacks as `unknown`. Validate shapes, own properties, allowed fields, ranges, and catalog membership before assigning domain types. Type assertions do not validate data.

Use unions for finite states and handle each member. Keep shared catalogs and snapshots readonly. Copy values that can change later.

Await promises, return them to an accountable caller, or attach a terminal rejection handler that reports failure. A `void` expression alone does not handle rejection.

Register cleanup for managed resources. Release them after success, failure, cancellation, or deactivation. Cleanup must be safe to repeat. Interrupted operations use the recovery journal.

Pure color modules import only project types, immutable data, and other pure modules. Their import graph excludes VS Code, Node.js, settings, coordination, and UI components. Tests supply random values and clocks.

Comments explain non-obvious behavior. Tests cover behavior and failure boundaries instead of repeating implementation expressions.

## Verification and correction

| Command                                   | Effect                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run check`                           | Verify types, lint, format, imports, dependencies, and catalogs without edits. |
| `npm run lint` / `npm run lint:fix`       | Report findings or apply available lint corrections.                           |
| `npm run format:check` / `npm run format` | Check or apply the configured format.                                          |
| `npm test`                                | Run behavior, regression, and negative tooling checks.                         |
| `npm run docs:check`                      | Verify documented interfaces, examples, and links.                             |
| `npm run package`                         | Run the gates and reject unexpected archive content or broken packaged links.  |

Add a regression check for each reproducible defect. Visual corrections can use repeatable host procedures.

## Exceptions

`@ts-ignore` and `@ts-nocheck` are prohibited. An intentional negative type test can use `@ts-expect-error` with a useful explanation and a check for the expected diagnostic.

A lint suppression names one rule, applies to one necessary statement, and explains the supporting test or external API constraint. Record its file, rule, reason, and evidence here. Blanket disables are prohibited, and repository checks validate each record.

There are no recorded source diagnostic exceptions.

A project-wide rule change updates the design and effective configuration. An exception never replaces runtime validation or authorizes a new dependency.
