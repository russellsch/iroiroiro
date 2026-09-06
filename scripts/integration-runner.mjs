import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import process from "node:process";

let executionLog = "";

function run(command, args, options = {}) {
    return new Promise((resolvePromise, reject) => {
        const { timeoutMilliseconds = 120_000, ...spawnOptions } = options;
        const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false, ...spawnOptions });
        let timedOut = false;
        let killTimer;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
            killTimer = setTimeout(() => child.kill("SIGKILL"), 5_000);
        }, timeoutMilliseconds);
        const record = (data, target) => {
            const text = data.toString();
            executionLog += text;
            target.write(text);
        };
        child.stdout?.on("data", (data) => record(data, process.stdout));
        child.stderr?.on("data", (data) => record(data, process.stderr));
        child.once("error", reject);
        child.once("close", (code, signal) => {
            clearTimeout(timer);
            if (killTimer !== undefined) {
                clearTimeout(killTimer);
            }
            if (code === 0) {
                resolvePromise();
                return;
            }
            reject(
                new Error(
                    `${command} failed with ${timedOut ? `a ${String(timeoutMilliseconds)} ms timeout` : signal === null ? `exit code ${String(code)}` : signal}.`,
                ),
            );
        });
    });
}

function optionValue(name) {
    const index = process.argv.indexOf(name);
    const value = index >= 0 ? process.argv[index + 1] : undefined;
    if (value === undefined || value.startsWith("--")) {
        throw new Error(`Supply ${name} <path>. This command never downloads VS Code.`);
    }
    return resolve(value);
}

function optionalValue(name) {
    const index = process.argv.indexOf(name);
    if (index < 0) {
        return undefined;
    }
    const value = process.argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
        throw new Error(`Supply ${name} <path>.`);
    }
    return resolve(value);
}

let temporaryDirectory;
try {
    const executable = optionValue("--vscode-path");
    if (process.platform === "win32" && extname(executable).toLowerCase() === ".cmd") {
        throw new Error(
            "Use the VS Code Code.exe path on Windows. A .cmd wrapper cannot run with shell execution disabled.",
        );
    }
    const vsixPath = optionalValue("--vsix-path");
    const artifactSha256 =
        vsixPath === undefined
            ? undefined
            : createHash("sha256")
                  .update(await readFile(vsixPath))
                  .digest("hex");
    const testMode = vsixPath === undefined ? "source" : "installed-vsix";
    temporaryDirectory = await mkdtemp(join(tmpdir(), "iroiro-iro-integration-"));
    const singleFolder = join(temporaryDirectory, "single-folder");
    const firstFolder = join(temporaryDirectory, "multi-first");
    const secondFolder = join(temporaryDirectory, "multi-second");
    await Promise.all([mkdir(singleFolder), mkdir(firstFolder), mkdir(secondFolder)]);
    const workspaceFile = join(temporaryDirectory, "multi.code-workspace");
    await writeFile(
        workspaceFile,
        `${JSON.stringify({ folders: [{ path: firstFolder }, { path: secondFolder }], settings: {} }, null, 4)}\n`,
        "utf8",
    );
    const driverDirectory = join(temporaryDirectory, "driver-extension");
    await mkdir(driverDirectory);
    await writeFile(
        join(driverDirectory, "package.json"),
        `${JSON.stringify(
            {
                name: "iroiro-iro-integration-driver",
                displayName: "iroiro iro integration driver",
                version: "0.0.0",
                publisher: "iroiro-test",
                engines: { vscode: "^1.104.0" },
                main: "./extension.js",
                activationEvents: ["*"],
            },
            null,
            4,
        )}\n`,
        "utf8",
    );
    await writeFile(
        join(driverDirectory, "extension.js"),
        "exports.activate = function activate() { return undefined; };\n",
        "utf8",
    );

    const isolatedEnvironment = { ...process.env };
    delete isolatedEnvironment.VSCODE_IPC_HOOK_CLI;
    delete isolatedEnvironment.ELECTRON_RUN_AS_NODE;
    await run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"]);
    await run(executable, ["--version"], { env: isolatedEnvironment });

    const results = [];
    for (const [scenario, workspace] of [
        ["single-folder", singleFolder],
        ["multi-folder", workspaceFile],
    ]) {
        const profile = join(temporaryDirectory, `profile-${scenario}`);
        const extensions = join(temporaryDirectory, `extensions-${scenario}`);
        const result = join(temporaryDirectory, `result-${scenario}.json`);
        await Promise.all([mkdir(profile), mkdir(extensions)]);
        const environment = { ...isolatedEnvironment };
        environment.IROIRO_INTEGRATION_RESULT = result;
        environment.IROIRO_INTEGRATION_SCENARIO = scenario;
        if (vsixPath !== undefined) {
            await run(
                executable,
                [
                    "--user-data-dir",
                    profile,
                    "--extensions-dir",
                    extensions,
                    "--install-extension",
                    vsixPath,
                    "--force",
                ],
                { cwd: process.cwd(), env: environment, timeoutMilliseconds: 120_000 },
            );
        }
        await run(
            executable,
            [
                "--user-data-dir",
                profile,
                "--extensions-dir",
                extensions,
                `--extensionDevelopmentPath=${vsixPath === undefined ? process.cwd() : driverDirectory}`,
                `--extensionTestsPath=${resolve(".test-dist/test/integration/index.js")}`,
                "--disable-updates",
                "--skip-welcome",
                "--skip-release-notes",
                "--disable-workspace-trust",
                "--new-window",
                "--wait",
                workspace,
            ],
            { cwd: process.cwd(), env: environment, timeoutMilliseconds: 120_000 },
        );
        const resultData = JSON.parse(await readFile(result, "utf8"));
        const enrichedResult = {
            ...resultData,
            testMode,
            nodeVersion: process.versions.node,
            npmVersion: process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/u)?.[1] ?? "unavailable",
            ...(artifactSha256 === undefined ? {} : { artifactSha256 }),
        };
        results.push(enrichedResult);
        console.log(`Integration result: ${JSON.stringify(enrichedResult)}`);
    }
    await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
    await writeFile(
        new URL("../artifacts/integration-results.json", import.meta.url),
        `${JSON.stringify({ completedAt: new Date().toISOString(), behaviorHelper: true, testMode, results }, null, 4)}\n`,
        "utf8",
    );
    await rm(new URL("../artifacts/integration-failure.log", import.meta.url), { force: true });
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
    await writeFile(
        new URL("../artifacts/integration-failure.log", import.meta.url),
        `${new Date().toISOString()}\n${message}\n${executionLog}`,
        "utf8",
    );
    process.exitCode = 1;
} finally {
    if (temporaryDirectory !== undefined) {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
}
