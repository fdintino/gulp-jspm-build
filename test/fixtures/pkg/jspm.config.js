/* eslint-disable */
SystemJS.config({
  paths: {
    "npm:": "jspm_packages/npm/",
    "a/": "src/a/",
    "foobar/": "src/foobar/",
    "test-app-repeat-string/": "src/test-app-repeat-string/"
  },
  transpiler: "none",
  packages: {
    "a": {
      "main": "index.js",
      "format": "esm"
    },
    "foobar": {
      "main": "index.js",
      "format": "esm"
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
