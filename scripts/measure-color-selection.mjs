import { performance } from "node:perf_hooks";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { selectRandomColor } = require("../.test-dist/src/domain/colors.js");

const candidates = [];
for (let index = 0; index < 1_240; index += 1) {
    candidates.push(`#${((index * 13_007 + 0x010203) & 0xffffff).toString(16).padStart(6, "0")}`);
}
const peers = [];
for (let index = 0; index < 32; index += 1) {
    peers.push(`#${((index * 524_287 + 0xabcdef) & 0xffffff).toString(16).padStart(6, "0")}`);
}
let draw = 0;
const randomInt = (minimum, maximum) => minimum + (draw++ % (maximum - minimum));
const measure = () => {
    const started = performance.now();
    selectRandomColor(candidates, peers, "#010203", true, randomInt);
    return performance.now() - started;
};
for (let index = 0; index < 5; index += 1) {
    measure();
}
const timesMs = Array.from({ length: 100 }, measure);
const sorted = [...timesMs].sort((first, second) => first - second);
process.stdout.write(
    `${JSON.stringify({
        node: process.version,
        fixture: { candidates: candidates.length, peers: peers.length, warmups: 5, operations: 100 },
        p95Ms: sorted[94],
        minimumMs: sorted[0],
        medianMs: sorted[49],
        maximumMs: sorted[99],
        timesMs,
    })}\n`,
);
