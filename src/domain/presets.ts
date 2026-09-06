import { parseHex } from "./colors";

export interface Preset {
    readonly name: string;
    readonly value: string;
}

export const BUILTIN_PRESETS: readonly Preset[] = [
    { name: "Red", value: "#ff0000" },
    { name: "Dark red", value: "#8b0000" },
    { name: "Light red", value: "#ff8080" },
    { name: "Orange", value: "#ffa500" },
    { name: "Dark orange", value: "#ff8c00" },
    { name: "Yellow", value: "#ffff00" },
    { name: "Gold", value: "#ffd700" },
    { name: "Green", value: "#008000" },
    { name: "Dark green", value: "#006400" },
    { name: "Light green", value: "#90ee90" },
    { name: "Teal", value: "#008080" },
    { name: "Cyan", value: "#00ffff" },
    { name: "Blue", value: "#0000ff" },
    { name: "Dark blue", value: "#00008b" },
    { name: "Light blue", value: "#add8e6" },
    { name: "Purple", value: "#800080" },
    { name: "Plum", value: "#dda0dd" },
    { name: "Pink", value: "#ffc0cb" },
    { name: "Brown", value: "#a52a2a" },
    { name: "Gray", value: "#808080" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#ffffff" },
    { name: "Pale rose red", value: "#f6cad2" },
    { name: "Light rose red", value: "#ec8d9d" },
    { name: "Rose red", value: "#de3551" },
    { name: "Deep rose red", value: "#af1d35" },
    { name: "Dark rose red", value: "#761324" },
    { name: "Pale coral red", value: "#f8cec9" },
    { name: "Light coral red", value: "#f09589" },
    { name: "Coral red", value: "#e64c37" },
    { name: "Deep coral red", value: "#ba2a17" },
    { name: "Dark coral red", value: "#7f1d10" },
    { name: "Pale brick red", value: "#efcdc8" },
    { name: "Light brick red", value: "#dd9488" },
    { name: "Brick red", value: "#be4937" },
    { name: "Deep brick red", value: "#8e3729" },
    { name: "Dark brick red", value: "#63261d" },
    { name: "Pale cherry red", value: "#f8c4d1" },
    { name: "Light cherry red", value: "#ee7795" },
    { name: "Cherry red", value: "#da1b4b" },
    { name: "Deep cherry red", value: "#9f1436" },
    { name: "Dark cherry red", value: "#6d0d25" },
    { name: "Scarlet", value: "#f32116" },
    { name: "Dark scarlet", value: "#960f08" },
    { name: "Pale peach orange", value: "#fcdfca" },
    { name: "Light peach orange", value: "#f8b98c" },
    { name: "Peach orange", value: "#f39049" },
    { name: "Deep peach orange", value: "#dd640e" },
    { name: "Dark peach orange", value: "#904109" },
    { name: "Pale amber orange", value: "#fde8c4" },
    { name: "Light amber orange", value: "#f9cb7b" },
    { name: "Amber orange", value: "#f6a823" },
    { name: "Deep amber orange", value: "#ce8509" },
    { name: "Dark amber orange", value: "#895906" },
    { name: "Pale pumpkin orange", value: "#f9dbc3" },
    { name: "Light pumpkin orange", value: "#f1ac74" },
    { name: "Pumpkin orange", value: "#e87517" },
    { name: "Deep pumpkin orange", value: "#b05911" },
    { name: "Dark pumpkin orange", value: "#793d0c" },
    { name: "Pale rust orange", value: "#f3cebf" },
    { name: "Light rust orange", value: "#e49472" },
    { name: "Rust orange", value: "#c95726" },
    { name: "Deep rust orange", value: "#96411d" },
    { name: "Dark rust orange", value: "#672d14" },
    { name: "Pale lemon yellow", value: "#fdface" },
    { name: "Light lemon yellow", value: "#faf389" },
    { name: "Lemon yellow", value: "#f6e828" },
    { name: "Dark lemon yellow", value: "#9d9307" },
    { name: "Pale butter yellow", value: "#fbf3d5" },
    { name: "Light butter yellow", value: "#f5e49e" },
    { name: "Butter yellow", value: "#efd25d" },
    { name: "Dark butter yellow", value: "#b09111" },
    { name: "Pale mustard yellow", value: "#f5e9c7" },
    { name: "Light mustard yellow", value: "#e8cd7d" },
    { name: "Mustard yellow", value: "#d0a525" },
    { name: "Dark mustard yellow", value: "#7e6416" },
    { name: "Pale honey yellow", value: "#fbebc6" },
    { name: "Light honey yellow", value: "#f5ce75" },
    { name: "Honey yellow", value: "#eeaf1b" },
    { name: "Dark honey yellow", value: "#936a0b" },
    { name: "Cream yellow", value: "#f6edc1" },
    { name: "Golden yellow", value: "#edac07" },
    { name: "Pale mint green", value: "#d7f4e5" },
    { name: "Light mint green", value: "#a0e3c2" },
    { name: "Mint green", value: "#59cf94" },
    { name: "Deep mint green", value: "#2e9e66" },
    { name: "Dark mint green", value: "#1f6b45" },
    { name: "Pale grass green", value: "#d6f4cd" },
    { name: "Light grass green", value: "#9ae481" },
    { name: "Grass green", value: "#53ca2b" },
    { name: "Deep grass green", value: "#3c931f" },
    { name: "Dark grass green", value: "#286115" },
    { name: "Pale leaf green", value: "#cbf1ce" },
    { name: "Light leaf green", value: "#7edd86" },
    { name: "Leaf green", value: "#30b53b" },
    { name: "Deep leaf green", value: "#23852b" },
    { name: "Dark leaf green", value: "#18591d" },
    { name: "Pale olive green", value: "#e4ecca" },
    { name: "Light olive green", value: "#c1d586" },
    { name: "Olive green", value: "#8ba63a" },
    { name: "Deep olive green", value: "#65792a" },
    { name: "Dark olive green", value: "#46531d" },
    { name: "Pale forest green", value: "#c3efd0" },
    { name: "Light forest green", value: "#73d991" },
    { name: "Forest green", value: "#2b9c4d" },
    { name: "Deep forest green", value: "#207439" },
    { name: "Dark forest green", value: "#154c25" },
    { name: "Pale sea green", value: "#c8efe2" },
    { name: "Light sea green", value: "#81dabc" },
    { name: "Sea green", value: "#34b288" },
    { name: "Deep sea green", value: "#257e61" },
    { name: "Dark sea green", value: "#18533f" },
    { name: "Pale aqua", value: "#d0f6f6" },
    { name: "Light aqua", value: "#87e8e8" },
    { name: "Aqua", value: "#28d2d2" },
    { name: "Dark aqua", value: "#167474" },
    { name: "Pale turquoise", value: "#c8f3ef" },
    { name: "Light turquoise", value: "#7de3d9" },
    { name: "Turquoise", value: "#2ac6b6" },
    { name: "Dark turquoise", value: "#176d65" },
    { name: "Pale blue green", value: "#cbecf1" },
    { name: "Light blue green", value: "#7ed0dd" },
    { name: "Blue green", value: "#2fa0b1" },
    { name: "Dark blue green", value: "#1b5b65" },
    { name: "Pale ocean teal", value: "#c0eef1" },
    { name: "Light ocean teal", value: "#68d6de" },
    { name: "Ocean teal", value: "#259fa7" },
    { name: "Dark ocean teal", value: "#14575c" },
    { name: "Pale teal", value: "#b5eeee" },
    { name: "Dark teal", value: "#114a4a" },
    { name: "Pale sky blue", value: "#d1ebfa" },
    { name: "Light sky blue", value: "#8bcdf4" },
    { name: "Sky blue", value: "#3cabec" },
    { name: "Deep sky blue", value: "#127cba" },
    { name: "Dark sky blue", value: "#0c5179" },
    { name: "Pale powder blue", value: "#dbe8f5" },
    { name: "Light powder blue", value: "#b0cce8" },
    { name: "Powder blue", value: "#79a8d8" },
    { name: "Deep powder blue", value: "#3473b2" },
    { name: "Dark powder blue", value: "#214a73" },
    { name: "Pale cornflower blue", value: "#ccdbf5" },
    { name: "Light cornflower blue", value: "#87abe8" },
    { name: "Cornflower blue", value: "#477ddc" },
    { name: "Deep cornflower blue", value: "#2051a7" },
    { name: "Dark cornflower blue", value: "#14346b" },
    { name: "Pale royal blue", value: "#c5d1f7" },
    { name: "Light royal blue", value: "#708feb" },
    { name: "Royal blue", value: "#2050df" },
    { name: "Deep royal blue", value: "#1739a1" },
    { name: "Dark royal blue", value: "#0f2567" },
    { name: "Pale navy blue", value: "#d5dced" },
    { name: "Light navy blue", value: "#8a9abd" },
    { name: "Navy blue", value: "#34466f" },
    { name: "Deep navy blue", value: "#22345c" },
    { name: "Dark navy blue", value: "#111d38" },
    { name: "Pale steel blue", value: "#ccddea" },
    { name: "Light steel blue", value: "#8bb1d0" },
    { name: "Steel blue", value: "#4780ae" },
    { name: "Deep steel blue", value: "#325a7b" },
    { name: "Dark steel blue", value: "#213a50" },
    { name: "Pale lavender purple", value: "#e5d7f4" },
    { name: "Light lavender purple", value: "#c2a0e3" },
    { name: "Lavender purple", value: "#9961d1" },
    { name: "Dark lavender purple", value: "#4f247b" },
    { name: "Pale violet purple", value: "#e7ccf5" },
    { name: "Light violet purple", value: "#c47ee7" },
    { name: "Violet purple", value: "#a031d8" },
    { name: "Dark violet purple", value: "#581778" },
    { name: "Pale grape purple", value: "#ebccf0" },
    { name: "Light grape purple", value: "#ce81da" },
    { name: "Grape purple", value: "#a134b2" },
    { name: "Dark grape purple", value: "#561c5f" },
    { name: "Pale orchid purple", value: "#f3cdf0" },
    { name: "Light orchid purple", value: "#e283da" },
    { name: "Orchid purple", value: "#d13dc5" },
    { name: "Dark orchid purple", value: "#781c70" },
    { name: "Pale plum purple", value: "#efd2e8" },
    { name: "Light plum purple", value: "#d78ec5" },
    { name: "Plum purple", value: "#b13e95" },
    { name: "Dark plum purple", value: "#622252" },
    { name: "Lilac", value: "#c6a6dd" },
    { name: "Indigo", value: "#4423a9" },
    { name: "Mauve", value: "#bd7fa8" },
    { name: "Eggplant purple", value: "#51244a" },
    { name: "Pale blush pink", value: "#f6dfe3" },
    { name: "Light blush pink", value: "#ecb6bf" },
    { name: "Blush pink", value: "#df8695" },
    { name: "Dark blush pink", value: "#a92d42" },
    { name: "Pale rose pink", value: "#f8d3e1" },
    { name: "Light rose pink", value: "#ef9ab9" },
    { name: "Rose pink", value: "#e4588b" },
    { name: "Dark rose pink", value: "#9e1a4a" },
    { name: "Pale salmon pink", value: "#f9d7d2" },
    { name: "Light salmon pink", value: "#f1a89d" },
    { name: "Salmon pink", value: "#e97967" },
    { name: "Dark salmon pink", value: "#ae2d19" },
    { name: "Pale berry pink", value: "#f6d0e3" },
    { name: "Light berry pink", value: "#e887b8" },
    { name: "Berry pink", value: "#d72d82" },
    { name: "Dark berry pink", value: "#7c184a" },
    { name: "Hot pink", value: "#f434a4" },
    { name: "Dusty pink", value: "#bd7f8f" },
    { name: "Pale tan brown", value: "#eadccc" },
    { name: "Light tan brown", value: "#d1b28f" },
    { name: "Tan brown", value: "#b88851" },
    { name: "Dark tan brown", value: "#694c2b" },
    { name: "Pale caramel brown", value: "#eed6bf" },
    { name: "Light caramel brown", value: "#dba876" },
    { name: "Caramel brown", value: "#bd7832" },
    { name: "Dark caramel brown", value: "#6d451d" },
    { name: "Pale chestnut brown", value: "#e7c8bb" },
    { name: "Light chestnut brown", value: "#cd8b70" },
    { name: "Chestnut brown", value: "#975235" },
    { name: "Dark chestnut brown", value: "#572f1e" },
    { name: "Pale coffee brown", value: "#dfc9b9" },
    { name: "Light coffee brown", value: "#bd8d6b" },
    { name: "Coffee brown", value: "#7b5437" },
    { name: "Dark coffee brown", value: "#432d1e" },
    { name: "Warm white", value: "#fffaf0" },
    { name: "Cool white", value: "#f5fbff" },
    { name: "Ivory", value: "#fffff0" },
    { name: "Cream", value: "#fffdd0" },
    { name: "Pale beige", value: "#f5ead7" },
    { name: "Beige", value: "#e6d5b8" },
    { name: "Dark beige", value: "#b8a68a" },
    { name: "Sand", value: "#cdbb8b" },
    { name: "Taupe", value: "#8b7d6b" },
    { name: "Warm gray", value: "#91877d" },
    { name: "Light warm gray", value: "#c7beb5" },
    { name: "Dark warm gray", value: "#5c554f" },
    { name: "Cool gray", value: "#7f8793" },
    { name: "Light cool gray", value: "#c4cbd4" },
    { name: "Dark cool gray", value: "#4b525c" },
    { name: "Silver gray", value: "#b7bcc2" },
    { name: "Charcoal gray", value: "#36414a" },
    { name: "Slate gray", value: "#667788" },
    { name: "Blue gray", value: "#657b8f" },
    { name: "Brown gray", value: "#756a61" },
    { name: "Soft black", value: "#17191c" },
    { name: "Deep black", value: "#08090a" },
];

export function normalizeName(name: string): string {
    return name.normalize("NFKC").toLowerCase();
}

function displayName(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    const name = value.trim().normalize("NFC");
    const length = [...name].length;
    if (length < 1 || length > 64 || /\p{Cc}/u.test(name)) {
        return undefined;
    }
    return name;
}

function nameProperty(value: object): unknown {
    if (Object.hasOwn(value, "name") && "name" in value) {
        return value.name;
    }
    return undefined;
}

function valueProperty(value: object): unknown {
    if (Object.hasOwn(value, "value") && "value" in value) {
        return value.value;
    }
    return undefined;
}

export function validatePresetName(
    name: unknown,
    existing: readonly Preset[],
    excludedName?: string,
): string | undefined {
    const display = displayName(name);
    if (display === undefined) {
        return "Preset names must contain 1 through 64 characters and no control characters.";
    }
    const normalized = normalizeName(display);
    const excluded = excludedName === undefined ? undefined : normalizeName(excludedName);
    if (BUILTIN_PRESETS.some((preset) => normalizeName(preset.name) === normalized)) {
        return "A built-in preset already uses this name.";
    }
    if (
        existing.some((preset) => normalizeName(preset.name) === normalized && normalizeName(preset.name) !== excluded)
    ) {
        return "A custom preset already uses this name.";
    }
    return undefined;
}

export function readCustomPresets(value: unknown): {
    readonly presets: readonly Preset[];
    readonly issues: readonly string[];
} {
    if (!Array.isArray(value)) {
        return value === undefined
            ? { presets: [], issues: [] }
            : { presets: [], issues: ["presets must be an array."] };
    }
    const presets: Preset[] = [];
    const issues: string[] = [];
    const names = new Set(BUILTIN_PRESETS.map((preset) => normalizeName(preset.name)));
    for (let index = 0; index < value.length; index += 1) {
        if (presets.length >= 1000) {
            issues.push(`Preset entry ${index + 1} exceeds the 1,000-entry limit.`);
            continue;
        }
        const entry: unknown = Object.hasOwn(value, index) ? value[index] : undefined;
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
            issues.push(`Preset entry ${index + 1} must be an object.`);
            continue;
        }
        const keys = Object.keys(entry);
        const name = displayName(nameProperty(entry));
        const color = parseHex(valueProperty(entry));
        if (
            keys.length !== 2 ||
            !keys.includes("name") ||
            !keys.includes("value") ||
            name === undefined ||
            color === undefined
        ) {
            issues.push(`Preset entry ${index + 1} has an invalid name or color.`);
            continue;
        }
        const normalized = normalizeName(name);
        if (names.has(normalized)) {
            issues.push(`Preset entry ${index + 1} has a duplicate name.`);
            continue;
        }
        names.add(normalized);
        presets.push({ name, value: color });
    }
    return { presets, issues };
}

export function allPresets(custom: readonly Preset[]): readonly Preset[] {
    const sortedCustom = [...custom].sort((first, second) => {
        const firstName = [...normalizeName(first.name)];
        const secondName = [...normalizeName(second.name)];
        const length = Math.min(firstName.length, secondName.length);
        for (let index = 0; index < length; index += 1) {
            const firstPoint = firstName[index]?.codePointAt(0) ?? -1;
            const secondPoint = secondName[index]?.codePointAt(0) ?? -1;
            if (firstPoint !== secondPoint) {
                return firstPoint - secondPoint;
            }
        }
        return firstName.length - secondName.length;
    });
    return [...BUILTIN_PRESETS, ...sortedCustom];
}
