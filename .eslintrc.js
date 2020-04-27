module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["react", "@typescript-eslint"],
  "env": {
    "browser": true,
    "jasmine": true,
    "jest": true
  },
  "rules": {
    "no-labels": [ "error", { "allowSwitch": true } ],
    
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/no-unused-vars": 2,
    "@typescript-eslint/camelcase": 0,

    "@typescript-eslint/no-var-requires": 0,
    
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "react/prop-types": 0
  },
  "settings": {
    "react": {
      "pragma": "React",
      "version": "detect"
    }
  },
  "parser": "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2017
  },
}