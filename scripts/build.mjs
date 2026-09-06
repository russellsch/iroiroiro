import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const outputDirectory = new URL("../dist/", import.meta.url);

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

try {
    await rm(outputDirectory, { recursive: true, force: true });
    await run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"]);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
