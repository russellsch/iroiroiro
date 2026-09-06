import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const nodeGlobals = {
    Buffer: "readonly",
    URL: "readonly",
    URLSearchParams: "readonly",
    console: "readonly",
    process: "readonly",
    setTimeout: "readonly",
    clearTimeout: "readonly",
};

export default tseslint.config(
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            ".test-dist/**",
            "artifacts/**",
            "coverage/**",
            ".cache/**",
            "src/generated/**",
            "**/*.vsix",
        ],
    },
    eslint.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: nodeGlobals,
        },
        rules: {
            curly: ["error", "all"],
            eqeqeq: ["error", "always"],
            "no-debugger": "error",
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    ...tseslint.configs.recommendedTypeChecked.map((configuration) => ({
        ...configuration,
        files: ["**/*.ts", "**/*.tsx"],
    })),
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            curly: ["error", "all"],
            eqeqeq: ["error", "always"],
            "no-console": "off",
            "no-debugger": "error",
            "no-unused-vars": "off",
            "no-var": "error",
            "prefer-const": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/ban-ts-comment": [
                "error",
                {
                    "ts-check": true,
                    "ts-ignore": true,
                    "ts-nocheck": true,
                    "ts-expect-error": { descriptionFormat: ".{10,}" },
                },
            ],
            "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-floating-promises": [
                "error",
                { checkThenables: true, ignoreVoid: false, ignoreIIFE: false },
            ],
            "@typescript-eslint/no-misused-promises": [
                "error",
                { checksConditionals: true, checksSpreads: true, checksVoidReturn: true },
            ],
            "@typescript-eslint/no-non-null-assertion": "error",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: false }],
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
        },
    },
    {
        files: ["src/**/*.ts"],
        rules: {
            "no-console": "error",
        },
    },
    prettier,
);
