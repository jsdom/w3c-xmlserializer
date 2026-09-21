import domenicConfig from "@domenic/eslint-config";
import globals from "globals";
import stylisticConfig from "@domenic/eslint-config/stylistic";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  ...domenicConfig,
  ...stylisticConfig
];
