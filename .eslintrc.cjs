/* eslint-env node */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/**",
    "apps/desktop/src-tauri/**",
  ],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
  },
  overrides: [
    {
      files: ["**/*.tsx", "**/*.ts"],
      parserOptions: { ecmaFeatures: { jsx: true } },
      settings: { react: { version: "detect" } },
      rules: {},
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      env: { jest: false },
    },
  ],
};

