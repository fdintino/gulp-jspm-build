'use strict';

var jspmui = require('jspm/lib/ui');
var gulplog = require('gulplog');

jspmui.setResolver();

/**
 * log utility functions extracted from jspm core
 */
function log(type, msg) {
  let format = jspmui.format[type];
  if (type === 'debug') {
    format = jspmui.format.info;
  }
  if (format) {
    msg = format(msg);
  }
  if (type === 'err') {
    type = 'error';
  }
  if (type === 'ok') {
    type = 'info';
  }
  if (typeof gulplog[type] !== 'undefined') {
    gulplog[type](msg);
  }
}

function logDepTree(items, firstParent) {
  var len = items.length;
  items.forEach(function(item, index) {
    var char = ((len === 1)
      ? '──'
      : (index === len - 1)
        ? '└─'
        : (index === 0 && !firstParent)
          ? '┌─' : '├─');
    log('info', `  \`${char} %${item}%\``);
  });
}

function logBuild(outFile, opts) {
  var resolution = opts.lowResSourceMaps ? '' : 'high-res ';
  log('ok', 'Built into `' + outFile + '`' +
    (opts.sourceMaps ? ' with ' + resolution + 'source maps' : '') + ', ' +
    (opts.minify ? '' : 'un') + 'minified' +
    (opts.minify ? (opts.mangle ? ', ' : ', un') + 'mangled' : '') +
    (opts.extra ? opts.extra : '') + '.');
}

function logTree(modules, inlineMap) {
  inlineMap = inlineMap || {};
  var inlinedModules = [];

  Object.keys(inlineMap).forEach(function(inlineParent) {
    inlinedModules = inlinedModules.concat(inlineMap[inlineParent]);
  });

  log('info', '');

  if (inlineMap['@dummy-entry-point'])
    logDepTree(inlineMap['@dummy-entry-point'], false);

  if (inlineMap !== true)
    modules.sort().forEach(function(name) {
      if (inlinedModules.indexOf(name) === -1)
        log('info', '  `' + name + '`');

      if (inlineMap[name])
        logDepTree(inlineMap[name], true);
    });
  else
    logDepTree(modules, false);

  if (inlinedModules.length || inlineMap === true)
    log('info', '');

  if (inlinedModules.length)
    log('ok', '%Optimized% - modules in bold inlined via Rollup static optimizations.');
  if (inlineMap === true)
    log('ok', '%Fully-optimized% - entire tree built via Rollup static optimization.');
  log('info', '');
}

module.exports = {
  log: log,
  logTree: logTree,
  logBuild: logBuild,
  setLogLevel: function(level) {
    if (typeof level === 'number') {
      jspmui.logLevel = level;
    } else {
      jspmui.setLogLevel(level);
    }
  },
  getLogLevel: function() {
    return jspmui.logLevel;
  }
};
