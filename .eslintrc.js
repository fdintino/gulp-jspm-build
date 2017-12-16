module.exports = {
  "extends": "eslint:recommended",
    "parserOptions": {
      "sourceType": "module",
      "ecmaVersion": 2017
  },
  "env": {
    "node": true,
    "es6": true,
    "jasmine": true
  },
  "rules": {
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "quotes": ["error", "single", { "allowTemplateLiterals": true }],
    "eqeqeq": "error",
    "semi": [2, "always"]
  },
  "globals": {
    "SystemJS": false
  }
};
