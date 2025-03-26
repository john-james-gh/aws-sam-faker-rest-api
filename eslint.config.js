import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier/flat"

export default defineConfig([
  globalIgnores([".aws-sam", "coverage"]),
  {
    files: ["src/**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["tests/**/*.test.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
])
