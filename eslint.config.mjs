import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  // Next.js recommended rules (converted from legacy config)
  ...compat.extends("next/core-web-vitals"),

  // Global rules
  {
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // API + lib files: console allowed
  {
    files: ["app/api/**/*.ts", "lib/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // UI files: only console.error / console.warn allowed
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    rules: {
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
];

export default eslintConfig;
