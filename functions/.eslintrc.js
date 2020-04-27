module.exports = {
    parserOptions: {
      ecmaVersion: 2017
    },
    env: {
      browser: false,
      node: true,
      es6: true
    },
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    "rules": {
      "no-labels": [ "error", { "allowSwitch": true } ],
      "@typescript-eslint/no-var-requires": 0,
      "@typescript-eslint/no-use-before-define": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/explicit-function-return-type": 0,
      "@typescript-eslint/camelcase": 0,
    },
  };