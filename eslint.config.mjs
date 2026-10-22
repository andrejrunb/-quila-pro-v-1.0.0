import js from "@eslint/js";
import ts from "typescript-eslint";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  // Global ignores
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/out/**",
    "**/archive_old_aquila/**",
    "**/*.db",
    "**/*.sqlite"
  ]),
  
  // Base JS rules
  js.configs.recommended,
  
  // TypeScript rules
  ...ts.configs.recommended,
  
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "no-console": "off"
    }
  }
];

export default eslintConfig;
