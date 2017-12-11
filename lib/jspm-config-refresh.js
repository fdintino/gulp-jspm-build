const path = require('path');

/**
 * Unloads all modules in jspm/lib/config from the require cache
 */
function jspmConfigRefresh() {
  const jspmLibDir = path.dirname(require.resolve('jspm')),
    systemjsLibDir = path.dirname(path.dirname(require.resolve('systemjs')));
  Object.keys(require.cache)
    .filter((p) => p.indexOf(jspmLibDir) === 0 || p.indexOf(systemjsLibDir) === 0)
    .forEach((p) => {
      delete require.cache[p];
    });
  delete process.env.jspmConfigPath;
  return require('jspm');
}

module.exports = jspmConfigRefresh;
