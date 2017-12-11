/* eslint-disable */
SystemJS.config({
  paths: {
    "npm:": "jspm_packages/npm/",
    "test-app-42/": "src/test-app-42/",
    "test-app-repeat-string/": "src/test-app-repeat-string/"
  },
  transpiler: "none",
  packages: {
    "test-app-42": {
      "main": "index.js",
      "format": "cjs"
    },
    "test-app-repeat-string": {
      "main": "index.js",
      "format": "cjs"
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json"
  ],
  map: {
    "repeat-string": "npm:repeat-string@1.6.1"
  },
  packages: {}
});
