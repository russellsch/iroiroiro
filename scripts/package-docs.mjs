import { inflateRawSync } from "node:zlib";
import { posix } from "node:path";

const archiveAliases = new Map([
    ["README.md", "readme.md"],
    ["CHANGELOG.md", "changelog.md"],
    ["LICENSE", "LICENSE.txt"],
]);

function markdownAnchor(heading) {
    return heading
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/gu, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/gu, "-")
        .replace(/-+/gu, "-");
}

function normalizedArchivePath(path) {
    return archiveAliases.get(path) ?? path;
}

export function normalizeStagedMarkdownLinks(source, documentPath) {
    return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/gu, (whole, opening, rawTarget, closing) => {
        const target = rawTarget.trim();
        if (target === "" || /^(?:https?:|mailto:|#)/u.test(target)) {
            return whole;
        }
        const hashIndex = target.indexOf("#");
        const targetPath = hashIndex < 0 ? target : target.slice(0, hashIndex);
        const fragment = hashIndex < 0 ? "" : target.slice(hashIndex);
        const resolved = posix.normalize(posix.join(posix.dirname(documentPath), decodeURIComponent(targetPath)));
        const normalized = normalizedArchivePath(resolved);
        if (normalized === resolved) {
            return whole;
        }
        let replacement = posix.relative(posix.dirname(documentPath), normalized);
        if (replacement === "") {
            replacement = posix.basename(normalized);
        }
        return `${opening}${replacement}${fragment}${closing}`;
    });
}

export function readZipPayloads(buffer) {
    let endOffset = -1;
    const minimum = Math.max(0, buffer.length - 65_557);
    for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            endOffset = offset;
            break;
        }
    }
    if (endOffset < 0) {
        throw new Error("The candidate is not a ZIP archive with an end record.");
    }
    const entryCount = buffer.readUInt16LE(endOffset + 10);
    let centralOffset = buffer.readUInt32LE(endOffset + 16);
    const payloads = new Map();
    for (let index = 0; index < entryCount; index += 1) {
        if (buffer.readUInt32LE(centralOffset) !== 0x02014b50) {
            throw new Error(`Invalid central-directory record at entry ${String(index)}.`);
        }
        const method = buffer.readUInt16LE(centralOffset + 10);
        const compressedSize = buffer.readUInt32LE(centralOffset + 20);
        const uncompressedSize = buffer.readUInt32LE(centralOffset + 24);
        const nameLength = buffer.readUInt16LE(centralOffset + 28);
        const extraLength = buffer.readUInt16LE(centralOffset + 30);
        const commentLength = buffer.readUInt16LE(centralOffset + 32);
        const localOffset = buffer.readUInt32LE(centralOffset + 42);
        const name = buffer.subarray(centralOffset + 46, centralOffset + 46 + nameLength).toString("utf8");
        if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
            throw new Error(`Invalid local ZIP record for ${name}.`);
        }
        const localNameLength = buffer.readUInt16LE(localOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localOffset + 28);
        const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
        const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
        const payload = method === 0 ? Buffer.from(compressed) : method === 8 ? inflateRawSync(compressed) : undefined;
        if (payload === undefined) {
            throw new Error(`Unsupported ZIP compression method ${String(method)} for ${name}.`);
        }
        if (payload.length !== uncompressedSize) {
            throw new Error(`ZIP size mismatch for ${name}.`);
        }
        payloads.set(name, payload);
        centralOffset += 46 + nameLength + extraLength + commentLength;
    }
    return payloads;
}

export function validatePackagedMarkdownLinks(payloads) {
    const failures = [];
    for (const [path, payload] of payloads) {
        if (!path.toLowerCase().endsWith(".md")) {
            continue;
        }
        const source = Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload);
        for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
            const target = match[1]?.trim() ?? "";
            if (target === "" || /^(?:https?:|mailto:)/u.test(target)) {
                continue;
            }
            const hashIndex = target.indexOf("#");
            const targetPath = hashIndex < 0 ? target : target.slice(0, hashIndex);
            const fragment = hashIndex < 0 ? "" : decodeURIComponent(target.slice(hashIndex + 1)).toLowerCase();
            const resolved =
                targetPath === ""
                    ? path
                    : posix.normalize(posix.join(posix.dirname(path), decodeURIComponent(targetPath)));
            const targetPayload = payloads.get(resolved);
            if (targetPayload === undefined) {
                failures.push(`${path} has a broken packaged link to ${target}.`);
                continue;
            }
            if (fragment !== "") {
                const targetSource = Buffer.isBuffer(targetPayload)
                    ? targetPayload.toString("utf8")
                    : String(targetPayload);
                const anchors = new Set();
                const counts = new Map();
                for (const heading of targetSource.matchAll(/^#{1,6}\s+(.+)$/gmu)) {
                    const base = markdownAnchor(heading[1] ?? "");
                    const count = counts.get(base) ?? 0;
                    counts.set(base, count + 1);
                    anchors.add(count === 0 ? base : `${base}-${String(count)}`);
                }
                if (!anchors.has(fragment)) {
                    failures.push(`${path} has a broken packaged anchor to ${target}.`);
                }
            }
        }
    }
    if (failures.length > 0) {
        throw new Error(failures.join("\n"));
    }
}
