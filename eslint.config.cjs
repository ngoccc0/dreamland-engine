module.exports = [
  // Ignore common build directories and git hooks
  {
    ignores: ["node_modules/**", ".next/**"],
  },
  // Basic linting for JS/TS files. Teams can extend this file to add rules/plugins.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // keep rules minimal so the pre-commit hook is not too strict here
    },
  },
];
