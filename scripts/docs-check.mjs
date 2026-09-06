import { access, readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";

const requiredPackageDocuments = [
    "README.md",
    "docs/install.md",
    "docs/user-guide.md",
    "docs/settings.md",
    "docs/troubleshooting.md",
    "CHANGELOG.md",
    "LICENSE",
];

const expectedSettings = {
    "iroiroIro.color": { type: "string", default: "", scope: "window" },
    "iroiroIro.autoColor.enabled": { type: "boolean", default: false, scope: "window" },
    "iroiroIro.autoColor.source": {
        type: "string",
        default: "presets",
        scope: "window",
        enum: ["presets", "generated"],
    },
    "iroiroIro.preferDistinctColors": { type: "boolean", default: true, scope: "window" },
    "iroiroIro.adjustmentStep": { type: "integer", default: 5, scope: "window", minimum: 1, maximum: 10 },
    "iroiroIro.coloredParts": {
        type: "object",
        scope: "window",
        default: {
            activityBar: true,
            statusBar: true,
            titleBar: true,
            sashHover: true,
            editorGroupBorder: false,
            panelBorder: false,
            sideBarBorder: false,
            statusBarBorder: false,
            titleBarBorder: false,
            tabActiveBorder: false,
            windowBorder: false,
        },
    },
    "iroiroIro.adjustments": {
        type: "object",
        scope: "window",
        default: { activityBar: "lighten", titleBar: "none", statusBar: "none" },
    },
    "iroiroIro.presets": { type: "array", default: [], scope: "window", maxItems: 1000 },
    "iroiroIro.preview.enabled": { type: "boolean", default: true, scope: "window" },
    "iroiroIro.statusBarItem.enabled": { type: "boolean", default: true, scope: "window" },
};
const expectedSettingsDocumentation = {
    "iroiroIro.color": ["String", "Empty string", "Workspace"],
    "iroiroIro.autoColor.enabled": ["Boolean", "`false`", "User and workspace"],
    "iroiroIro.autoColor.source": ["String", "`presets`", "User and workspace"],
    "iroiroIro.preferDistinctColors": ["Boolean", "`true`", "User and workspace"],
    "iroiroIro.adjustmentStep": ["Integer", "`5`", "User and workspace"],
    "iroiroIro.coloredParts": ["Object", "See below", "User and workspace"],
    "iroiroIro.adjustments": ["Object", "Activity bar `lighten`. Title and status bars `none`", "User and workspace"],
    "iroiroIro.presets": ["Array", "`[]`", "User"],
    "iroiroIro.preview.enabled": ["Boolean", "`true`", "User and workspace"],
    "iroiroIro.statusBarItem.enabled": ["Boolean", "`true`", "User and workspace"],
};

async function walk(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
            files.push(...(await walk(path)));
        } else if (entry.isFile()) {
            files.push(path);
        }
    }
    return files;
}

function section(source, start, end) {
    const startIndex = source.indexOf(start);
    const endIndex = source.indexOf(end, startIndex + start.length);
    if (startIndex < 0 || endIndex < 0) {
        throw new Error(`Cannot find section ${start}.`);
    }
    return source.slice(startIndex, endIndex);
}

function anchorForHeading(heading) {
    return heading
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/gu, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/gu, "-")
        .replace(/-+/gu, "-");
}

function equal(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function report(condition, message, failures) {
    if (!condition) {
        failures.push(message);
    }
}

function validateSchema(value, schema, location) {
    const validType =
        schema.type === "array"
            ? Array.isArray(value)
            : schema.type === "object"
              ? typeof value === "object" && value !== null && !Array.isArray(value)
              : schema.type === "integer"
                ? Number.isInteger(value)
                : typeof value === schema.type;
    if (!validType) {
        throw new Error(`${location} needs type ${schema.type}.`);
    }
    if (schema.enum !== undefined && !schema.enum.includes(value)) {
        throw new Error(`${location} is outside its allowed values.`);
    }
    if (
        typeof value === "number" &&
        ((schema.minimum !== undefined && value < schema.minimum) ||
            (schema.maximum !== undefined && value > schema.maximum))
    ) {
        throw new Error(`${location} is outside its allowed range.`);
    }
    if (typeof value === "string") {
        const length = [...value].length;
        if (
            (schema.minLength !== undefined && length < schema.minLength) ||
            (schema.maxLength !== undefined && length > schema.maxLength) ||
            (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value))
        ) {
            throw new Error(`${location} violates its string constraints.`);
        }
    }
    if (Array.isArray(value)) {
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            throw new Error(`${location} exceeds its item limit.`);
        }
        value.forEach((item, index) => validateSchema(item, schema.items, `${location}[${index}]`));
    } else if (schema.type === "object") {
        for (const key of schema.required ?? []) {
            if (!Object.hasOwn(value, key)) {
                throw new Error(`${location} omits required property ${key}.`);
            }
        }
        for (const [key, item] of Object.entries(value)) {
            const property = schema.properties?.[key];
            if (property === undefined) {
                if (schema.additionalProperties === false) {
                    throw new Error(`${location} has unrecognized property ${key}.`);
                }
            } else {
                validateSchema(item, property, `${location}.${key}`);
            }
        }
    }
}

function validateExample(value, properties, location) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(`${location} must be a settings object.`);
    }
    const keys = Object.keys(value);
    if (keys.length > 0 && keys.every((key) => Object.hasOwn(properties["iroiroIro.coloredParts"].properties, key))) {
        validateSchema(value, properties["iroiroIro.coloredParts"], `${location}.coloredParts`);
        return;
    }
    for (const [key, item] of Object.entries(value)) {
        if (Object.hasOwn(properties, key)) {
            validateSchema(item, properties[key], `${location}.${key}`);
        } else {
            throw new Error(`${location} has unknown setting ${key}.`);
        }
    }
}

try {
    const failures = [];
    const requirements = await readFile("docs/requirements.md", "utf8");
    const manifest = JSON.parse(await readFile("package.json", "utf8"));

    const commandRows = [
        ...section(requirements, "### 4.3 Catalog C", "### 4.4 Profile T").matchAll(
            /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|/gmu,
        ),
    ].map((match) => ({
        command: match[1],
        title: match[2]?.trim(),
    }));
    report(
        commandRows.length === 17,
        `Catalog C contains ${String(commandRows.length)} parsed commands instead of 17.`,
        failures,
    );
    report(
        equal(
            manifest.contributes?.commands?.map(({ command, title }) => ({ command, title })),
            commandRows,
        ),
        "Manifest command IDs or titles differ from Catalog C.",
        failures,
    );
    report(
        manifest.contributes?.commands?.every(({ category }) => category === "iroiro iro") === true,
        "Each contributed command must use the iroiro iro category.",
        failures,
    );

    const properties = manifest.contributes?.configuration?.properties ?? {};
    report(
        equal(Object.keys(properties), Object.keys(expectedSettings)),
        "The manifest setting catalog does not contain exactly ten expected keys.",
        failures,
    );
    for (const [key, expected] of Object.entries(expectedSettings)) {
        const actual = properties[key];
        for (const [field, value] of Object.entries(expected)) {
            report(equal(actual?.[field], value), `${key}.${field} differs from the settings contract.`, failures);
        }
    }

    const partRows = [
        ...section(requirements, "### 4.2 Catalog S", "### 4.3 Catalog C").matchAll(
            /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*(On|Off)\s*\|$/gmu,
        ),
    ].map((match) => ({
        id: match[1],
        label: match[2]?.trim(),
        default: match[3] === "On",
    }));
    const surfaceSource = await readFile("src/domain/settings.ts", "utf8");
    const implementedParts = [
        ...surfaceSource.matchAll(/\{ id: "([^"]+)", label: "([^"]+)", default: (true|false) \}/gu),
    ].map((match) => ({
        id: match[1],
        label: match[2],
        default: match[3] === "true",
    }));
    report(equal(implementedParts, partRows), "Implemented colored parts differ from Catalog S.", failures);

    const presetSource = await readFile("src/domain/presets.ts", "utf8");
    const implementedPresets = [...presetSource.matchAll(/\{ name: "([^"]+)", value: "([^"]+)" \}/gu)].map((match) => ({
        name: match[1],
        value: match[2],
    }));
    report(
        implementedPresets.length === 240,
        `The canonical preset catalog contains ${String(implementedPresets.length)} entries instead of 240.`,
        failures,
    );
    report(
        new Set(implementedPresets.map((preset) => preset.name?.normalize("NFKC").toLowerCase())).size === 240 &&
            new Set(implementedPresets.map((preset) => preset.value)).size === 240,
        "The canonical preset catalog must contain distinct names and values.",
        failures,
    );
    for (const preset of implementedPresets) {
        report(
            /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/u.test(preset.name ?? "") && /^#[0-9a-f]{6}$/u.test(preset.value ?? ""),
            "The canonical preset catalog contains an invalid name or hex value.",
            failures,
        );
    }
    for (const name of ["Red", "Dark red", "Light red", "Green", "Plum"]) {
        report(
            implementedPresets.some((preset) => preset.name === name),
            `The canonical preset catalog omits ${name}.`,
            failures,
        );
    }

    for (const path of requiredPackageDocuments) {
        try {
            await access(path);
        } catch {
            failures.push(`Required package document is missing: ${path}.`);
        }
        report(manifest.files?.includes(path) === true, `The explicit package file list omits ${path}.`, failures);
    }

    const settingsDocument = await readFile("docs/settings.md", "utf8").catch(() => "");
    for (const key of Object.keys(expectedSettings)) {
        report(settingsDocument.includes(key), `docs/settings.md does not identify ${key}.`, failures);
    }
    const documentedSettings = Object.fromEntries(
        [...settingsDocument.matchAll(/^\| `([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gmu)].map(
            (match) => [match[1], [match[2]?.trim(), match[3]?.trim(), match[4]?.trim()]],
        ),
    );
    report(
        equal(documentedSettings, expectedSettingsDocumentation),
        "The settings reference key, type, default, or scope catalog differs from the manifest contract.",
        failures,
    );

    const markdownFiles = [
        "README.md",
        "CONTRIBUTING.md",
        "CHANGELOG.md",
        ...(await walk("docs")).filter((path) => path.endsWith(".md")),
    ];
    for (const path of markdownFiles) {
        let source;
        try {
            source = await readFile(path, "utf8");
        } catch {
            continue;
        }
        for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/gu)) {
            try {
                validateExample(JSON.parse(match[1] ?? ""), properties, path);
            } catch (error) {
                failures.push(`${path} has invalid JSON: ${error instanceof Error ? error.message : String(error)}.`);
            }
        }
        for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
            const rawTarget = match[1]?.trim() ?? "";
            if (rawTarget === "" || /^(?:https?:|mailto:)/u.test(rawTarget)) {
                continue;
            }
            const [relativePath, fragment] = rawTarget.split("#", 2);
            const targetPath =
                relativePath === "" ? path : resolve(dirname(path), decodeURIComponent(relativePath ?? ""));
            if (requiredPackageDocuments.includes(path)) {
                const packagedTarget = relative(process.cwd(), resolve(targetPath)).replaceAll("\\", "/");
                report(
                    requiredPackageDocuments.includes(packagedTarget) ||
                        (packagedTarget === manifest.icon && manifest.files?.includes(packagedTarget) === true),
                    `${path} links to ${rawTarget}, which is absent from the VSIX.`,
                    failures,
                );
            }
            let targetSource;
            try {
                targetSource = await readFile(targetPath, "utf8");
            } catch {
                failures.push(`${path} has a broken internal link to ${rawTarget}.`);
                continue;
            }
            if (fragment !== undefined && fragment !== "") {
                const anchors = new Set(
                    [...targetSource.matchAll(/^#{1,6}\s+(.+)$/gmu)].map((heading) =>
                        anchorForHeading(heading[1] ?? ""),
                    ),
                );
                report(
                    anchors.has(decodeURIComponent(fragment).toLowerCase()),
                    `${path} has a broken anchor link to ${rawTarget}.`,
                    failures,
                );
            }
        }
    }

    if (failures.length > 0) {
        throw new Error(failures.join("\n"));
    }
    console.log("Commands, settings, parts, presets, JSON examples, package documents, and internal links are valid.");
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
