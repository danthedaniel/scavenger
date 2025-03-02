import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const config = [
  ...compat.extends("next", "next/core-web-vitals", "prettier"),
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
