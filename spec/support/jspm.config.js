SystemJS.config({
  paths: {
    'npm:': 'jspm_packages/npm/'
  },
  browserConfig: {
    'baseURL': '/'
  },
  devConfig: {
    'map': {
      'plugin-babel': 'npm:systemjs-plugin-babel@0.0.25'
    }
  },
  transpiler: 'plugin-babel'
});

SystemJS.config({
  packageConfigPaths: [
    'npm:@*/*.json',
    'npm:*.json'
  ],
  map: {},
  packages: {}
});
