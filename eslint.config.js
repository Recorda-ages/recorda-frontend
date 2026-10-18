const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");
const i18next = require("eslint-plugin-i18next");

module.exports = defineConfig([
  ...expoConfig,
  prettierConfig,
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/mocks/**", "src/**/*.mock.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            include: [
              "placeholder",
              "title",
              "subtitle",
              "label",
              "message",
              "description",
              "hint",
              "[a-zA-Z]+Label",
              "[a-zA-Z]+Title",
              "[a-zA-Z]+Text",
              "[a-zA-Z]+Message",
              "[a-zA-Z]+Hint",
              "[a-zA-Z]+Description"
            ]
          },
          callees: {
            exclude: [
              "t",
              "i18n(ext)?",
              "require",
              "includes",
              "indexOf",
              "startsWith",
              "endsWith",
              "interpolate"
            ]
          }
        }
      ]
    }
  },
  {
    ignores: [
      ".expo/",
      "coverage/",
      "dist/",
      "node_modules/",
      "web-build/",
      "src/services/api/generated/**"
    ]
  }
]);
