// The next/core-web-vitals shareable config currently crashes when loaded
// through @eslint/eslintrc's FlatCompat shim on this ESLint version (circular
// structure in the react plugin's config object) — not specific to this repo.
// Falling back to plain recommended JS/TS rules until that's fixed upstream;
// this doesn't affect `next build`, which no longer runs lint automatically.
import tseslint from "typescript-eslint";

const eslintConfig = [
  {
    ignores: ["public/tool.html", ".next/**"],
  },
  ...tseslint.configs.recommended,
];

export default eslintConfig;
