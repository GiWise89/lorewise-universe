import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "components/VipArtExperience.tsx",
      "components/VipAtelierExperience.tsx",
      "components/VipGamesExperience.tsx",
    ],
    rules: {
      // These authenticated private-media responses must bypass the public image optimizer cache.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["scripts/guide-blueprints/*.mjs"],
    rules: {
      // Blueprint modules intentionally export a single anonymous data object.
      "import/no-anonymous-default-export": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".netlify/**",
    ".vinext/**",
    "android/**",
    "dist/**",
    "tmp/**",
    "coverage/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
