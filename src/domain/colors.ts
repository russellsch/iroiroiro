export type RandomInt = (min: number, maxExclusive: number) => number;

interface Rgb {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

interface Hsl {
    readonly hue: number;
    readonly saturation: number;
    readonly lightness: number;
}

interface Lab {
    readonly lightness: number;
    readonly a: number;
    readonly b: number;
}

export function parseHex(input: unknown): string | undefined {
    if (typeof input !== "string") {
        return undefined;
    }
    const text = input.trim().replace(/^#/, "");
    if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text)) {
        return undefined;
    }
    const expanded = text.length === 3 ? `${text[0]}${text[0]}${text[1]}${text[1]}${text[2]}${text[2]}` : text;
    return `#${expanded.toLowerCase()}`;
}

function rgbFromHex(color: string): Rgb {
    const parsed = parseHex(color);
    if (parsed === undefined) {
        return { red: 0, green: 0, blue: 0 };
    }
    return {
        red: Number.parseInt(parsed.slice(1, 3), 16),
        green: Number.parseInt(parsed.slice(3, 5), 16),
        blue: Number.parseInt(parsed.slice(5, 7), 16),
    };
}

function rgbToHex(rgb: Rgb): string {
    const channel = (value: number): string => Math.round(value).toString(16).padStart(2, "0");
    return `#${channel(rgb.red)}${channel(rgb.green)}${channel(rgb.blue)}`;
}

function rgbToHsl(rgb: Rgb): Hsl {
    const red = rgb.red / 255;
    const green = rgb.green / 255;
    const blue = rgb.blue / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const range = maximum - minimum;
    const lightness = (maximum + minimum) / 2;
    let hue = 0;
    if (range !== 0) {
        if (maximum === red) {
            hue = ((green - blue) / range) % 6;
        } else if (maximum === green) {
            hue = (blue - red) / range + 2;
        } else {
            hue = (red - green) / range + 4;
        }
        hue = (hue * 60 + 360) % 360;
    }
    const saturation = range === 0 ? 0 : range / (1 - Math.abs(2 * lightness - 1));
    return { hue, saturation: saturation * 100, lightness: lightness * 100 };
}

function hslToHex(hsl: Hsl): string {
    const chroma = (1 - Math.abs(2 * (hsl.lightness / 100) - 1)) * (hsl.saturation / 100);
    const segment = hsl.hue / 60;
    const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
    let partial: Rgb;
    if (segment < 1) {
        partial = { red: chroma, green: secondary, blue: 0 };
    } else if (segment < 2) {
        partial = { red: secondary, green: chroma, blue: 0 };
    } else if (segment < 3) {
        partial = { red: 0, green: chroma, blue: secondary };
    } else if (segment < 4) {
        partial = { red: 0, green: secondary, blue: chroma };
    } else if (segment < 5) {
        partial = { red: secondary, green: 0, blue: chroma };
    } else {
        partial = { red: chroma, green: 0, blue: secondary };
    }
    const offset = hsl.lightness / 100 - chroma / 2;
    return rgbToHex({
        red: (partial.red + offset) * 255,
        green: (partial.green + offset) * 255,
        blue: (partial.blue + offset) * 255,
    });
}

export function adjustLightness(color: string, delta: number): string {
    const hsl = rgbToHsl(rgbFromHex(color));
    return hslToHex({ ...hsl, lightness: Math.max(0, Math.min(100, hsl.lightness + delta)) });
}

function linearChannel(channel: number): number {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
    const rgb = rgbFromHex(color);
    return 0.2126 * linearChannel(rgb.red) + 0.7152 * linearChannel(rgb.green) + 0.0722 * linearChannel(rgb.blue);
}

export function contrastRatio(a: string, b: string): number {
    const first = luminance(a);
    const second = luminance(b);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function foregroundFor(color: string): string {
    return contrastRatio(color, "#000000") >= contrastRatio(color, "#ffffff") ? "#000000" : "#ffffff";
}

function toLab(color: string): Lab {
    const rgb = rgbFromHex(color);
    const red = linearChannel(rgb.red);
    const green = linearChannel(rgb.green);
    const blue = linearChannel(rgb.blue);
    const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
    const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
    const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
    return {
        lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
}

export function colorDistance(a: string, b: string): number {
    const first = toLab(a);
    const second = toLab(b);
    return labDistance(first, second);
}

function labDistance(first: Lab, second: Lab): number {
    return Math.hypot(first.lightness - second.lightness, first.a - second.a, first.b - second.b);
}

export function generatedCandidates(randomInt: RandomInt): readonly string[] {
    const candidates: string[] = [];
    for (let index = 0; index < 64; index += 1) {
        candidates.push(
            hslToHex({ hue: randomInt(0, 360), saturation: randomInt(45, 86), lightness: randomInt(25, 71) }),
        );
    }
    return candidates;
}

function randomMember(values: readonly string[], randomInt: RandomInt): string {
    const index = randomInt(0, values.length);
    return values[index] ?? values[0] ?? "#000000";
}

export function selectRandomColor(
    candidates: readonly string[],
    peers: readonly string[],
    current: string | undefined,
    preferDistinct: boolean,
    randomInt: RandomInt,
): string {
    const validCandidates = candidates.map(parseHex).filter((color): color is string => color !== undefined);
    const currentColor = parseHex(current);
    const available =
        currentColor !== undefined && validCandidates.some((color) => color !== currentColor)
            ? validCandidates.filter((color) => color !== currentColor)
            : validCandidates;
    if (available.length === 0) {
        return currentColor ?? "#000000";
    }
    if (!preferDistinct || peers.length === 0) {
        return randomMember(available, randomInt);
    }
    const validPeers = peers.map(parseHex).filter((color): color is string => color !== undefined);
    if (validPeers.length === 0) {
        return randomMember(available, randomInt);
    }
    const labCache = new Map<string, Lab>();
    const labFor = (color: string): Lab => {
        const cached = labCache.get(color);
        if (cached !== undefined) {
            return cached;
        }
        const converted = toLab(color);
        labCache.set(color, converted);
        return converted;
    };
    const peerLabs = validPeers.map(labFor);
    const ranked = available.map((color) => {
        const candidateLab = labFor(color);
        return { color, distance: Math.min(...peerLabs.map((peer) => labDistance(candidateLab, peer))) };
    });
    const preferred = ranked.filter((entry) => entry.distance >= 0.1).map((entry) => entry.color);
    if (preferred.length > 0) {
        return randomMember(preferred, randomInt);
    }
    const maximum = Math.max(...ranked.map((entry) => entry.distance));
    return randomMember(
        ranked.filter((entry) => Math.abs(entry.distance - maximum) <= Number.EPSILON).map((entry) => entry.color),
        randomInt,
    );
}
