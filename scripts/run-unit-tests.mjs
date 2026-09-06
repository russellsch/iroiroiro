import { spawn } from "node:child_process";
import { readdir, rm } from "node:fs/promises";
import process from "node:process";

function run(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: "inherit", shell: false });
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

async function collectTests(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
            if (entry.name !== "integration") {
                files.push(...(await collectTests(path)));
            }
        } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
            files.push(path);
        }
    }
    return files.sort();
}

try {
    await rm(new URL("../.test-dist/", import.meta.url), { recursive: true, force: true });
    await run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.test.json"]);
    const tests = await collectTests(".test-dist/test");
    if (tests.length === 0) {
        throw new Error("No compiled unit test files match test/**/*.test.ts.");
    }
    await run(process.execPath, ["--test", ...tests]);
    await run(process.execPath, ["--test", "--test-isolation=none", "test/tooling.test.mjs"]);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
