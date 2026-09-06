import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { normalizeStagedMarkdownLinks, readZipPayloads, validatePackagedMarkdownLinks } from "./package-docs.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function run(command, args, cwd = projectRoot) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: "inherit", shell: false });
        child.once("error", reject);
        child.once("exit", (code, signal) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`${command} failed with ${signal === null ? `exit code ${String(code)}` : signal}.`));
        });
    });
}

async function collectFiles(directory, prefix = "") {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(join(directory, entry.name), relative)));
        } else if (entry.isFile()) {
            files.push(relative);
        }
    }
    return files;
}

function compareContents(actual, expected) {
    const actualFiles = new Set(actual.filter((path) => !path.endsWith("/")));
    const expectedFiles = new Set(expected);
    const missing = [...expectedFiles].filter((path) => !actualFiles.has(path));
    const extra = [...actualFiles].filter((path) => !expectedFiles.has(path));
    if (missing.length > 0 || extra.length > 0) {
        throw new Error(
            `VSIX content mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`,
        );
    }
}

async function createStagingTree(stagingDirectory) {
    await mkdir(join(stagingDirectory, "docs"), { recursive: true });
    for (const path of ["package.json", "README.md", "CHANGELOG.md", "LICENSE", "iroiro-icon-256.png"]) {
        await copyFile(join(projectRoot, path), join(stagingDirectory, path));
    }
    for (const path of ["install.md", "user-guide.md", "settings.md", "troubleshooting.md"]) {
        await copyFile(join(projectRoot, "docs", path), join(stagingDirectory, "docs", path));
    }
    await cp(join(projectRoot, "dist"), join(stagingDirectory, "dist"), { recursive: true });
    for (const path of [
        "README.md",
        "CHANGELOG.md",
        "docs/install.md",
        "docs/user-guide.md",
        "docs/settings.md",
        "docs/troubleshooting.md",
    ]) {
        const stagedPath = join(stagingDirectory, path);
        const source = await readFile(stagedPath, "utf8");
        await writeFile(stagedPath, normalizeStagedMarkdownLinks(source, path), "utf8");
    }
}

let temporaryDirectory;
try {
    const npmCli = process.env.npm_execpath;
    if (npmCli === undefined || !npmCli.endsWith("npm-cli.js")) {
        throw new Error("Run package creation through npm run package so the locked npm CLI path is available.");
    }
    await access(npmCli);
    await run(process.execPath, [npmCli, "run", "check"]);
    await run(process.execPath, [npmCli, "test"]);
    await run(process.execPath, [npmCli, "run", "docs:check"]);
    await run(process.execPath, [npmCli, "run", "build"]);

    const manifest = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
    const filename = `iroiro-iro-${manifest.version}.vsix`;
    temporaryDirectory = await mkdtemp(join(tmpdir(), "iroiro-iro-package-"));
    const candidate = join(temporaryDirectory, filename);
    const stagingDirectory = join(temporaryDirectory, "staging");
    await createStagingTree(stagingDirectory);
    await run(
        process.execPath,
        [
            join(projectRoot, "node_modules/@vscode/vsce/vsce"),
            "package",
            "--no-dependencies",
            "--no-rewrite-relative-links",
            "--out",
            candidate,
        ],
        stagingDirectory,
    );

    const expected = [
        "[Content_Types].xml",
        "extension.vsixmanifest",
        "extension/package.json",
        "extension/readme.md",
        "extension/changelog.md",
        "extension/LICENSE.txt",
        "extension/iroiro-icon-256.png",
        "extension/docs/install.md",
        "extension/docs/user-guide.md",
        "extension/docs/settings.md",
        "extension/docs/troubleshooting.md",
        ...(await collectFiles(join(projectRoot, "dist"))).map((path) => `extension/dist/${path}`),
    ];
    const bytes = await readFile(candidate);
    const payloads = readZipPayloads(bytes);
    compareContents([...payloads.keys()], expected);
    validatePackagedMarkdownLinks(payloads);
    const checksum = createHash("sha256").update(bytes).digest("hex");

    const artifacts = join(projectRoot, "artifacts");
    await mkdir(artifacts, { recursive: true });
    const finalPath = join(artifacts, filename);
    await rm(finalPath, { force: true });
    await rm(join(artifacts, "SHA256SUMS"), { force: true });
    await copyFile(candidate, finalPath);
    await writeFile(join(artifacts, "SHA256SUMS"), `${checksum}  ${filename}\n`, "utf8");
    console.log(`Created artifacts/${filename}`);
    console.log(`SHA-256 ${checksum}`);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
} finally {
    if (temporaryDirectory !== undefined) {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}
