import { builtinModules } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { dirname, normalize, resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

const approvedTools = new Set([
    "@eslint/js",
    "@types/node",
    "@types/vscode",
    "@vscode/vsce",
    "eslint",
    "eslint-config-prettier",
    "prettier",
    "typescript",
    "typescript-eslint",
]);
const allowedRuntimeModules = new Set(["vscode", ...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const exactReleaseFiles = [
    "dist/**",
    "README.md",
    "docs/install.md",
    "docs/user-guide.md",
    "docs/settings.md",
    "docs/troubleshooting.md",
    "CHANGELOG.md",
    "LICENSE",
    "iroiro-icon-256.png",
];
const requiredCompilerOptions = {
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    useUnknownInCatchVariables: true,
    noImplicitOverride: true,
    noFallthroughCasesInSwitch: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    forceConsistentCasingInFileNames: true,
    noUncheckedSideEffectImports: true,
    skipLibCheck: false,
    noEmitOnError: true,
    importHelpers: false,
};

async function readJson(path) {
    return JSON.parse(await readFile(path, "utf8"));
}

async function walk(directory) {
    const output = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
            output.push(...(await walk(path)));
        } else if (entry.isFile()) {
            output.push(path);
        }
    }
    return output;
}

function check(condition, message, failures) {
    if (!condition) {
        failures.push(message);
    }
}

function isReleaseVersion(value) {
    if (typeof value !== "string" || value.length > 256) {
        return false;
    }
    const match =
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u.exec(
            value,
        );
    if (match === null || !match.slice(1, 4).every((segment) => Number.isSafeInteger(Number(segment)))) {
        return false;
    }
    return (match[4]?.split(".") ?? []).every(
        (identifier) => !/^\d+$/u.test(identifier) || identifier === "0" || !identifier.startsWith("0"),
    );
}

function importedSpecifiers(path, source, failures) {
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    const specifiers = [];
    const addString = (node, kind) => {
        if (ts.isStringLiteralLike(node)) {
            specifiers.push(node.text);
        } else {
            failures.push(`${path} has a nonliteral ${kind}; dependency policy cannot verify it.`);
        }
    };
    const visit = (node) => {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier !== undefined) {
                addString(node.moduleSpecifier, "module specifier");
            }
        } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
            if (node.moduleReference.expression !== undefined) {
                addString(node.moduleReference.expression, "import-equals specifier");
            }
        } else if (ts.isCallExpression(node)) {
            const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
            const requireCall = ts.isIdentifier(node.expression) && node.expression.text === "require";
            if (dynamicImport || requireCall) {
                const argument = node.arguments[0];
                if (argument === undefined) {
                    failures.push(`${path} has ${dynamicImport ? "import" : "require"} without a module argument.`);
                } else {
                    addString(argument, dynamicImport ? "dynamic import" : "require call");
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return specifiers;
}

function resolveProjectImport(fromPath, specifier, sourceFiles) {
    const base = normalize(resolve(dirname(fromPath), specifier));
    return sourceFiles.find((candidate) => {
        const normalized = normalize(resolve(candidate));
        return (
            normalized === `${base}.ts` ||
            normalized === `${base}.tsx` ||
            normalized === normalize(resolve(base, "index.ts"))
        );
    });
}

function checkSuppressionComments(path, source, qualityGuide, failures) {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, source);
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
        if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) {
            continue;
        }
        const comment = scanner.getTokenText();
        check(
            !/@ts-(?:ignore|nocheck)\b/u.test(comment),
            `${path} contains a prohibited TypeScript directive.`,
            failures,
        );
        const expectedError = comment.match(/@ts-expect-error(?::|\s)(.*)/u);
        if (expectedError !== null) {
            check(
                (expectedError[1]?.trim().length ?? 0) >= 10,
                `${path} has an expected-error directive without a 10-character explanation.`,
                failures,
            );
            check(
                qualityGuide.includes(path),
                `${path} has an expected-error exception missing from docs/code-quality.md.`,
                failures,
            );
        }
        if (/eslint-disable(?!-(?:next-line|line))/u.test(comment)) {
            failures.push(`${path} has a blanket or file-level lint suppression.`);
        }
        const lintSuppression = comment.match(/eslint-disable-(?:next-line|line)\s+([^\s,]+)(?:\s+--\s+(.+))?/u);
        if (lintSuppression !== null) {
            const rule = lintSuppression[1] ?? "";
            const explanation = lintSuppression[2]?.trim() ?? "";
            check(
                /^@?[a-z0-9][a-z0-9@/_-]*$/u.test(rule),
                `${path} has a lint suppression that does not name one exact rule.`,
                failures,
            );
            check(
                explanation.length >= 10,
                `${path} has a lint suppression without an adjacent explanation.`,
                failures,
            );
            check(
                /(?:test|external|\bAPI\b)/u.test(explanation),
                `${path} lint suppression does not identify a supporting test or external API constraint.`,
                failures,
            );
            check(
                qualityGuide.includes(path) && qualityGuide.includes(rule),
                `${path} has a lint exception missing from docs/code-quality.md.`,
                failures,
            );
        }
    }
}

try {
    const failures = [];
    const manifest = await readJson("package.json");
    const directNames = Object.keys(manifest.devDependencies ?? {});
    check(directNames.length === approvedTools.size, "The direct development package count is not nine.", failures);
    for (const name of directNames) {
        check(approvedTools.has(name), `Unapproved direct development package: ${name}.`, failures);
        check(
            /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(manifest.devDependencies[name]),
            `${name} does not use an exact version.`,
            failures,
        );
    }
    for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
        check(
            manifest[field] === undefined || Object.keys(manifest[field]).length === 0,
            `Runtime dependency field ${field} is not absent or empty.`,
            failures,
        );
    }
    check(manifest.extensionDependencies === undefined, "extensionDependencies must be absent.", failures);
    check(manifest.extensionPack === undefined, "extensionPack must be absent.", failures);
    const hasVscodeIgnore = await readFile(".vscodeignore", "utf8").then(
        () => true,
        () => false,
    );
    check(!hasVscodeIgnore, ".vscodeignore conflicts with the explicit manifest release allowlist.", failures);
    check(
        JSON.stringify(manifest.files) === JSON.stringify(exactReleaseFiles),
        "The explicit release file list differs from Contract B.",
        failures,
    );
    check(manifest.name === "iroiro-iro", "The manifest name is not iroiro-iro.", failures);
    check(manifest.icon === "iroiro-icon-256.png", "The manifest must select the packaged PNG icon.", failures);
    const icon = await readFile("iroiro-icon-256.png");
    check(
        icon.length >= 24 &&
            icon.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
            icon.readUInt32BE(16) >= 128 &&
            icon.readUInt32BE(20) >= 128,
        "The extension icon must be a PNG of at least 128 by 128 pixels.",
        failures,
    );
    check(
        isReleaseVersion(manifest.version),
        "The manifest version is not a valid semantic version for VS Code.",
        failures,
    );
    check(manifest.publisher === "russellsch", "The manifest publisher is not russellsch.", failures);
    check(manifest.license === "MIT", "The manifest license is not MIT.", failures);
    check(
        manifest.repository?.url === "https://github.com/russellsch/iroiroiro.git",
        "The repository URL is incorrect.",
        failures,
    );
    check(manifest.engines?.vscode === "^1.104.0", "The minimum VS Code engine is incorrect.", failures);
    check(
        manifest.extensionKind?.length === 1 && manifest.extensionKind[0] === "ui",
        "extensionKind must contain only ui.",
        failures,
    );
    check(
        manifest.capabilities?.untrustedWorkspaces?.supported === true,
        "Restricted Workspaces support is not declared.",
        failures,
    );
    const colorPattern = manifest.contributes?.configuration?.properties?.["iroiroIro.color"]?.pattern;
    const colorExpression = typeof colorPattern === "string" ? new RegExp(colorPattern, "u") : undefined;
    for (const valid of ["", "   ", "abc", " #aBc ", "#aabbcc", " A1b2C3 "]) {
        check(
            colorExpression?.test(valid) === true,
            `The manifest color grammar rejects valid input ${JSON.stringify(valid)}.`,
            failures,
        );
    }
    for (const invalid of ["ab", "abcd", "#abcd", "#aabbccdd", "red", "rgb(1,2,3)"]) {
        check(
            colorExpression?.test(invalid) === false,
            `The manifest color grammar accepts invalid input ${JSON.stringify(invalid)}.`,
            failures,
        );
    }

    const base = await readJson("tsconfig.base.json");
    for (const [option, expected] of Object.entries(requiredCompilerOptions)) {
        check(
            base.compilerOptions?.[option] === expected,
            `Compiler option ${option} does not match Contract Q.`,
            failures,
        );
    }

    const sourceFiles = (await walk("src")).filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));
    const importGraph = new Map();
    for (const path of sourceFiles) {
        const source = await readFile(path, "utf8");
        const projectImports = [];
        for (const specifier of importedSpecifiers(path, source, failures)) {
            if (specifier.startsWith(".")) {
                const resolved = resolveProjectImport(path, specifier, sourceFiles);
                check(resolved !== undefined, `${path} has an unresolved project import ${specifier}.`, failures);
                if (resolved !== undefined) {
                    projectImports.push(resolved);
                }
            } else {
                check(
                    allowedRuntimeModules.has(specifier),
                    `${path} imports unapproved runtime module ${specifier}.`,
                    failures,
                );
            }
        }
        importGraph.set(path, projectImports);
    }
    const pureRoots = sourceFiles.filter((path) => /src\/domain\/(?:color|random)/u.test(path));
    for (const root of pureRoots) {
        const pending = [root];
        const seen = new Set();
        while (pending.length > 0) {
            const current = pending.pop();
            if (current === undefined || seen.has(current)) {
                continue;
            }
            seen.add(current);
            const source = await readFile(current, "utf8");
            for (const specifier of importedSpecifiers(current, source, failures)) {
                check(
                    specifier.startsWith("."),
                    `${root} reaches prohibited pure-module dependency ${specifier}.`,
                    failures,
                );
            }
            for (const dependency of importGraph.get(current) ?? []) {
                check(
                    !/(?:vscode-adapter|controls|preview|peers|storage|writer)/u.test(dependency),
                    `${root} reaches prohibited project module ${dependency}.`,
                    failures,
                );
                pending.push(dependency);
            }
        }
    }

    const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
    const packageEntries = Object.entries(lock.packages ?? {}).filter(([path]) => path !== "");
    check(lock.lockfileVersion === 3, "The lockfile format is not version 3.", failures);
    check(
        lock.version === manifest.version && lock.packages?.[""]?.version === manifest.version,
        "The manifest and root lockfile versions differ.",
        failures,
    );
    check(packageEntries.length > 0, "The lockfile has no dependency entries.", failures);
    for (const [name, version] of Object.entries(manifest.devDependencies ?? {})) {
        check(
            lock.packages?.[""]?.devDependencies?.[name] === version &&
                lock.packages?.[`node_modules/${name}`]?.version === version,
            `${name} differs between the manifest and lockfile.`,
            failures,
        );
    }
    for (const [path, entry] of packageEntries) {
        check(
            typeof entry.version === "string" &&
                /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(entry.version),
            `${path} has a missing or non-exact locked version.`,
            failures,
        );
        check(
            typeof entry.resolved === "string" && entry.resolved.startsWith("https://registry.npmjs.org/"),
            `${path} has a missing or non-registry source.`,
            failures,
        );
        check(
            typeof entry.integrity === "string" && entry.integrity.startsWith("sha512-"),
            `${path} has a missing or non-SHA-512 integrity value.`,
            failures,
        );
        check(entry.hasInstall !== true, `${path} has an install-script marker that needs review.`, failures);
    }

    const authored = [...sourceFiles, ...(await walk("test").catch(() => [])), ...(await walk("scripts"))].filter(
        (path) => /\.(?:ts|tsx|js|mjs|cjs)$/u.test(path),
    );
    const qualityGuide = await readFile("docs/code-quality.md", "utf8").catch(() => "");
    for (const path of authored) {
        checkSuppressionComments(path, await readFile(path, "utf8"), qualityGuide, failures);
    }

    if (failures.length > 0) {
        throw new Error(failures.join("\n"));
    }
    console.log("Manifest, full lock tree, compiler flags, runtime imports, pure imports, and suppressions are valid.");
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
