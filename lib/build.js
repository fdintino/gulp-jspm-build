'use strict';

const compile = require('./compile');
const through = require('through2');
const jspmConfigRefresh = require('./jspm-config-refresh');
const install = require('./install');
const logging = require('./logging');
const _ = require('lodash');

function build(options) {
  let jspm = require('jspm');

  jspm.on('log', (type, msg) => {
    /* istanbul ignore next */
    logging.log(type, msg);
  });

  options = options || {};
  const originalDir = process.cwd();
  const stream = through.obj();
  const originalLogLevel = logging.getLogLevel();

  try {
    /* istanbul ignore if */
    if (options.logLevel) {
      logging.setLogLevel(options.logLevel);
    } else {
      logging.setLogLevel('err');
    }
    if (options.packagePath) {
      process.chdir(options.packagePath);
      try {
        jspm.setPackagePath(options.packagePath);
      } catch(e) {
        /* istanbul ignore if */
        if (!(e instanceof Error) || !(/already been loaded/.test(e.message))) {
          throw e;
        }
        jspm = jspmConfigRefresh();
        jspm.setPackagePath(options.packagePath);
      }
    }

    // force loading of jspm config
    jspm.Loader();

    options = _.merge({
      /**
       * Whether jspm should run install before building;
       *   - false: do not install
       *   - true / 'auto': install if package.json or jspm.config.js has been updated
       *   - 'force': install regardless of whether out-of-date
       */
      install: false,
      /**
       * Options passed to jspm.install, should it be called
       */
      installOptions: {
        summary: false
      },
    }, options);

    install(options, jspm)
      .then((result) => {
        if (result !== false && options.installOptions.summary) {
          logging.log('ok', 'jspm install complete');
        }
        compile(options, jspm)
          .then((files) => {
            files.forEach((f) => stream.write(f));
            stream.end();
          })
          .catch((e) => stream.destroy(e));
      })
      .catch((e) => stream.destroy(e));
  } finally {
    process.chdir(originalDir);
    logging.setLogLevel(originalLogLevel);
  }

  return stream;
}

module.exports = build;
