import prettierPlugin from "eslint-plugin-prettier"
import prettierPluginRecommendedConfig from "eslint-plugin-prettier/recommended"
import prettierConfig from "eslint-config-prettier"
import tseslint from "typescript-eslint"

export default tseslint.config(
  prettierConfig,
  prettierPluginRecommendedConfig,
  tseslint.configs.recommended,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "max-classes-per-file": "off",
      "no-shadow": "off",
      "no-extra-semi": "off",
      curly: ["error", "multi-line"],
    },
  },
  {
    files: ["src/**/*.ts", "examples/**/*.ts", "examples/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-parameter-properties": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-extra-semi": "off",
      "@typescript-eslint/no-redeclare": [
        "off",
        { ignoreDeclarationMerge: true },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          caughtErrors: "none",
          argsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "no-public",
        },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: true,
        },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
        },
      ],
    },
  },
)
