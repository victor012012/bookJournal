{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "react"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "react/jsx-key": "warn",
    "@typescript-eslint/ban-types": "warn",
    "no-prototype-builtins": "warn",
    "no-unsafe-optional-chaining": "warn"
  }
}
