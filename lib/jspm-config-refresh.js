const path = require('path');
const logging = require('./logging');

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
  const jspm = require('jspm');
  jspm.on('log', (type, msg) => {
    /* istanbul ignore next */
    logging.log(type, msg);
  });
  return jspm;
}

module.exports = jspmConfigRefresh;
