import nextPlugin from "@next/eslint-plugin-next"
import tsParser from "@typescript-eslint/parser"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import checkFilePlugin from "eslint-plugin-check-file"
import importPlugin from "eslint-plugin-import-x"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"

const baseSetting = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  ignores: ["eslint.config.mjs"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
      project: "./tsconfig.json",
    },
    globals: {
      React: "readable",
      JSX: "readable",
    },
  },
}

const fileConvention = {
  plugins: {
    "check-file": checkFilePlugin,
  },
  files: ["app/**/*"],
  rules: {
    "check-file/filename-naming-convention": [
      "error",
      { "**/*.{ts,tsx}": "KEBAB_CASE" },
      { ignoreMiddleExtensions: true },
    ],
  },
}

const importConvention = {
  files: ["app/**/*"],
  plugins: {
    "import-x": importPlugin,
  },
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importPlugin.flatConfigs.typescript.rules,
    "import-x/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: ["./components", "./hooks", "./lib", "./types", "./utils"],
            from: ["./features", "./app"],
          },
        ],
      },
    ],
  },
  settings: {
    "import-x/resolver-next": [
      createTypeScriptImportResolver({
        alwaysTryTypes: true,
      }),
    ],
  },
}

const nextConvention = {
  plugins: {
    "@next/next": nextPlugin,
    react: reactPlugin,
    "react-hooks": reactHooksPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs["recommended-latest"].rules,
    "react/self-closing-comp": [
      "error",
      {
        component: true,
        html: true,
      },
    ],
    "react/prefer-destructuring-assignment": "off",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}

const globalIgnores = {
  ignores: [
    ".next/**",
    "node_modules/**",
    "lib/generated/**",
    "prisma/migrations/**",
  ],
}

export default defineConfig([
  globalIgnores,
  baseSetting,
  fileConvention,
  importConvention,
  nextConvention,
])
