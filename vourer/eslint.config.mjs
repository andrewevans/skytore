import globals from "globals"
import pluginJs from "@eslint/js"

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          semi: false,
        },
      ],
    },
  },
  eslintPluginPrettierRecommended,
]
