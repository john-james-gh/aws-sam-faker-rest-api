import { defineConfig } from "eslint/config" // globalIgnores is deprecated, use ignores property
import globals from "globals"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier" // Correct import for flat config

export default defineConfig([
  {
    ignores: [
      ".aws-sam/**", // Use forward slashes for paths
      "coverage/**",
      "node_modules/**", // Often ignored by default, but explicit is fine
    ],
  },

  // 2. Apply base recommended rules from @eslint/js
  // This provides core JavaScript rules.
  js.configs.recommended,

  // 3. Apply base recommended rules from typescript-eslint
  // This provides TypeScript-specific rules.
  // Use tseslint.configs.recommended for general TS rules.
  // If you have a tsconfig.json and want type-aware linting rules (more powerful, but requires type info),
  // use tseslint.configs.recommendedTypeChecked instead (or tseslint.configs.strictTypeChecked).
  ...tseslint.configs.recommended,
  // Example for type-checked rules (requires parserOptions setup below):
  // ...tseslint.configs.recommendedTypeChecked,

  // 4. Custom configuration for YOUR JS/TS files
  // This applies to all files matched by the `files` glob AFTER the recommended configs.
  // You can override rules or set language options here.
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js global variables
      },
      // If using type-checked rules (e.g., tseslint.configs.recommendedTypeChecked):
      // parserOptions: {
      //   project: true, // Use tsconfig.json in the root or specified by tsconfigRootDir
      //   tsconfigRootDir: import.meta.dirname, // Usually the directory of eslint.config.js
      // },
    },
    // You can add specific rule overrides here if needed:
    // rules: {
    //   "no-unused-vars": "warn", // Override core JS rule
    //   "@typescript-eslint/no-unused-vars": "warn", // Override TS rule
    //   // Add other custom rules or overrides
    // }
  },

  // 5. Jest-specific overrides for test files
  // This applies ONLY to test files.
  {
    files: ["tests/**/*.test.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.jest, // Add Jest global variables (describe, it, expect, etc.)
      },
    },
    // You might consider adding Jest plugin rules here too:
    // Example: import eslintPluginJest from 'eslint-plugin-jest';
    // ...eslintPluginJest.configs['flat/recommended'],
    // rules: {
    //   ...eslintPluginJest.configs['flat/recommended'].rules,
    //   // your jest rule overrides
    // }
    rules: {
      "@typescript-eslint/no-require-imports": "off", // Disable this rule for Jest test files
    },
  },

  // 6. Prettier config MUST be the LAST element
  // This disables ESLint rules that conflict with Prettier's formatting.
  eslintConfigPrettier,
])
