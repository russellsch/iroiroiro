import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdtemp, mkdir, open, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import test from "node:test";

import { normalizeStagedMarkdownLinks, validatePackagedMarkdownLinks } from "../scripts/package-docs.mjs";

const projectRoot = process.cwd();

function registerTest(name, body) {
    test(name, body).catch((error) => {
        process.stderr.write(`${error instanceof Error ? error.message : "Test registration failed"}\n`);
        process.exitCode = 1;
    });
}

async function run(command, args, cwd = projectRoot) {
    const outputDirectory = await mkdtemp(join(tmpdir(), "iroiro-iro-command-"));
    const outputPath = join(outputDirectory, "output.log");
    const outputHandle = await open(outputPath, "w");
    try {
        const status = await new Promise((resolvePromise, reject) => {
            const child = spawn(command, args, {
                cwd,
                shell: false,
                stdio: ["ignore", outputHandle.fd, outputHandle.fd],
            });
            child.once("error", reject);
            child.once("close", (code, signal) => resolvePromise({ code, signal }));
        });
        await outputHandle.close();
        return { ...status, output: await readFile(outputPath, "utf8") };
    } finally {
        await outputHandle.close().catch(() => undefined);
        await rm(outputDirectory, { recursive: true, force: true });
    }
}

async function toolFixture() {
    const fixture = await mkdtemp(join(tmpdir(), "iroiro-iro-negative-"));
    await mkdir(join(fixture, "test"));
    await symlink(resolve("node_modules"), join(fixture, "node_modules"), "dir");
    for (const path of [
        "tsconfig.base.json",
        "tsconfig.json",
        "tsconfig.check.json",
        "eslint.config.mjs",
        ".prettierrc.json",
    ]) {
        await cp(resolve(path), join(fixture, path));
    }
    return fixture;
}

registerTest("compiler rejects an invalid domain assignment", async () => {
    const fixture = await toolFixture();
    try {
        await writeFile(join(fixture, "test/negative.ts"), "export const invalid: string = 1;\n", "utf8");
        const result = await run(
            process.execPath,
            [resolve("node_modules/typescript/bin/tsc"), "-p", "tsconfig.check.json", "--noEmit"],
            fixture,
        );
        assert.notEqual(result.code, 0, result.output);
        assert.match(result.output, /TS2322/u);
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

registerTest("lint rejects explicit any", async () => {
    const fixture = await toolFixture();
    try {
        await writeFile(
            join(fixture, "test/negative.ts"),
            "export function unsafe(value: any): any { return value; }\n",
            "utf8",
        );
        const result = await run(
            process.execPath,
            [resolve("node_modules/eslint/bin/eslint.js"), "test/negative.ts", "--max-warnings", "0"],
            fixture,
        );
        assert.notEqual(result.code, 0, result.output);
        assert.match(result.output, /@typescript-eslint\/no-explicit-any/u);
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

registerTest("format check rejects an unformatted authored file", async () => {
    const fixture = await toolFixture();
    try {
        await writeFile(join(fixture, "test/negative.json"), '{"value":true}\n', "utf8");
        const result = await run(
            process.execPath,
            [resolve("node_modules/prettier/bin/prettier.cjs"), "--check", "test/negative.json"],
            fixture,
        );
        assert.notEqual(result.code, 0, result.output);
        assert.match(result.output, /test\/negative\.json/u);
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});

registerTest("package staging preserves offline links through VSCE aliases", () => {
    const staged = normalizeStagedMarkdownLinks(
        "[Changes](../CHANGELOG.md#release-010) and [website](https://example.com).",
        "docs/install.md",
    );
    assert.equal(staged, "[Changes](../changelog.md#release-010) and [website](https://example.com).");
    const payloads = new Map([
        ["extension/docs/install.md", Buffer.from(staged)],
        ["extension/changelog.md", Buffer.from("# Release 0.1.0\n")],
    ]);
    assert.doesNotThrow(() => validatePackagedMarkdownLinks(payloads));
    payloads.set("extension/docs/install.md", Buffer.from("[Missing](../CHANGELOG.md)"));
    assert.throws(() => validatePackagedMarkdownLinks(payloads), /broken packaged link/u);
});

registerTest("document and release-file checks reject catalog and package drift", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "iroiro-iro-tooling-"));
    try {
        for (const directory of ["docs", "src", "test", "scripts"]) {
            await cp(resolve(directory), join(fixture, directory), { recursive: true });
        }
        for (const path of [
            "package.json",
            "package-lock.json",
            "tsconfig.base.json",
            "README.md",
            "CONTRIBUTING.md",
            "CHANGELOG.md",
            "LICENSE",
            "iroiro-icon-256.png",
        ]) {
            await cp(resolve(path), join(fixture, path));
        }

        const docsScript = resolve("scripts/docs-check.mjs");
        const projectScript = resolve("scripts/verify-project.mjs");
        const baselineDocs = await run(process.execPath, [docsScript], fixture);
        assert.equal(baselineDocs.code, 0, baselineDocs.output);
        const baselineProject = await run(process.execPath, [projectScript], fixture);
        assert.equal(baselineProject.code, 0, baselineProject.output);

        const lockPath = join(fixture, "package-lock.json");
        const lockSource = await readFile(lockPath, "utf8");
        const manifestPath = join(fixture, "package.json");
        const manifestSource = await readFile(manifestPath, "utf8");
        const futureManifest = JSON.parse(manifestSource);
        const futureLock = JSON.parse(lockSource);
        futureManifest.version = "12.34.56-beta.1+build.7";
        futureLock.version = futureManifest.version;
        futureLock.packages[""].version = futureManifest.version;
        await writeFile(manifestPath, `${JSON.stringify(futureManifest, null, 4)}\n`, "utf8");
        await writeFile(lockPath, `${JSON.stringify(futureLock, null, 4)}\n`, "utf8");
        const futureVersion = await run(process.execPath, [projectScript], fixture);
        assert.equal(futureVersion.code, 0, futureVersion.output);

        futureLock.packages[""].version = "12.34.55";
        await writeFile(lockPath, `${JSON.stringify(futureLock, null, 4)}\n`, "utf8");
        const mismatchedVersion = await run(process.execPath, [projectScript], fixture);
        assert.notEqual(mismatchedVersion.code, 0, mismatchedVersion.output);
        assert.match(mismatchedVersion.output, /manifest and root lockfile versions differ/iu);

        futureManifest.version = "12.034.56";
        futureLock.version = futureManifest.version;
        futureLock.packages[""].version = futureManifest.version;
        await writeFile(manifestPath, `${JSON.stringify(futureManifest, null, 4)}\n`, "utf8");
        await writeFile(lockPath, `${JSON.stringify(futureLock, null, 4)}\n`, "utf8");
        const invalidVersion = await run(process.execPath, [projectScript], fixture);
        assert.notEqual(invalidVersion.code, 0, invalidVersion.output);
        assert.match(invalidVersion.output, /not a valid semantic version for VS Code/iu);

        await writeFile(manifestPath, manifestSource, "utf8");
        await writeFile(lockPath, lockSource, "utf8");
        const lock = JSON.parse(lockSource);
        delete lock.packages["node_modules/typescript"].integrity;
        await writeFile(lockPath, `${JSON.stringify(lock, null, 4)}\n`, "utf8");
        const badIntegrity = await run(process.execPath, [projectScript], fixture);
        assert.notEqual(badIntegrity.code, 0, badIntegrity.output);
        assert.match(badIntegrity.output, /missing or non-SHA-512 integrity/u);
        await writeFile(lockPath, lockSource, "utf8");

        const versionFixture = JSON.parse(lockSource);
        const transitivePath = Object.keys(versionFixture.packages).find(
            (path) => path !== "" && !Object.hasOwn(versionFixture.packages[""].devDependencies, path.slice(13)),
        );
        assert.ok(transitivePath !== undefined);
        delete versionFixture.packages[transitivePath].version;
        await writeFile(lockPath, `${JSON.stringify(versionFixture, null, 4)}\n`, "utf8");
        const missingVersion = await run(process.execPath, [projectScript], fixture);
        assert.notEqual(missingVersion.code, 0, missingVersion.output);
        assert.match(missingVersion.output, /missing or non-exact locked version/u);
        await writeFile(lockPath, lockSource, "utf8");

        const presetsPath = join(fixture, "src/domain/presets.ts");
        const presets = await readFile(presetsPath, "utf8");
        const values = [...presets.matchAll(/value: "(#[0-9a-f]{6})"/gu)].map((match) => match[1]);
        assert.ok(values[0] !== undefined && values[1] !== undefined);
        await writeFile(presetsPath, presets.replace(values[1], values[0]), "utf8");
        const duplicatePreset = await run(process.execPath, [docsScript], fixture);
        assert.notEqual(duplicatePreset.code, 0, duplicatePreset.output);
        assert.match(duplicatePreset.output, /distinct names and values/u);
        await writeFile(presetsPath, presets, "utf8");

        const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
        manifest.contributes.commands[0].command = "iroiroIro.wrongCommand";
        await writeFile(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`, "utf8");
        const badDocs = await run(process.execPath, [docsScript], fixture);
        assert.notEqual(badDocs.code, 0, badDocs.output);
        assert.match(badDocs.output, /Manifest command IDs or titles differ/u);

        manifest.contributes.commands[0].command = "iroiroIro.chooseColor";
        await writeFile(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`, "utf8");
        const settingsPath = join(fixture, "docs/settings.md");
        const settings = await readFile(settingsPath, "utf8");
        await writeFile(settingsPath, `${settings}\n\`\`\`json\n{"iroiroIro.adjustmentStep": 99}\n\`\`\`\n`, "utf8");
        const badExample = await run(process.execPath, [docsScript], fixture);
        assert.notEqual(badExample.code, 0, badExample.output);
        assert.match(badExample.output, /adjustmentStep is outside its allowed range/u);
        await writeFile(settingsPath, settings, "utf8");

        const readmePath = join(fixture, "README.md");
        const readme = await readFile(readmePath, "utf8");
        await writeFile(readmePath, `${readme}\n[Excluded document](CONTRIBUTING.md)\n`, "utf8");
        const excludedLink = await run(process.execPath, [docsScript], fixture);
        assert.notEqual(excludedLink.code, 0, excludedLink.output);
        assert.match(excludedLink.output, /absent from the VSIX/u);
        await writeFile(readmePath, readme, "utf8");

        manifest.files.push("src/**");
        await writeFile(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`, "utf8");
        const badPackage = await run(process.execPath, [projectScript], fixture);
        assert.notEqual(badPackage.code, 0, badPackage.output);
        assert.match(badPackage.output, /explicit release file list differs/u);
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
});
