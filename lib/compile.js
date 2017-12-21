'use strict';

var File = require('vinyl');
var logging = require('./logging');
const path = require('path');
const {applyNormalizedSourceMap} = require('./utils');

/*
 * Uses jspm api to bundle the specified input.
 * Returns a collection of vinyl files representing the bundled output.

 * options contains an array of bundle configs
 * Each bundle config takes the following form:
 * src
 * dst
 * options

 * Returns a promise which gets resolved or rejected upon completing
 * all specified bundles.
 */
function compile(options, jspm) {
  if (typeof jspm === 'undefined') {
    jspm = require('jspm');
  }
  options = Object.assign({
    baseURL: '.',
    sfx: false,
    bundles: [],
    config: {},
    bundleOptions: {}
  }, options);

  return Promise.all(options.bundles.map((bundle) => new Promise((resolve, reject) => {
    const builder = new jspm.Builder(options.baseURL, options.config),
      jspmBuild = builder[bundle.sfx ? 'buildStatic' : 'bundle'];

    if (!bundle.src) {
      return reject(new Error('bundle src not specified'));
    }
    if (!bundle.dst) {
      return reject(new Error('bundle dst not specified'));
    }

    const opts = Object.assign({}, options.bundleOptions, bundle.options);

    /* istanbul ignore if */
    if (opts.builderConfig) {
      builder.config(opts.builderConfig);
    }

    // These settings mirror those used by gulp.src() (which, in turn, are
    // those found in the glob-stream library)
    /* istanbul ignore else */
    if (typeof opts.cwd !== 'string') {
      opts.cwd = process.cwd();
    }
    /* istanbul ignore else */
    if (typeof opts.cwdbase !== 'boolean') {
      opts.cwdbase = false;
    }
    /* istanbul ignore if */
    if (opts.cwdbase) {
      opts.base = opts.cwd;
    }

    const inlineSourceMaps = (opts.sourceMaps === 'inline');
    // Force sourceMaps to be boolean, since we need to inline the sourcemaps
    // ourselves
    if (opts.sourceMaps) {
      opts.sourceMaps = !!opts.sourceMaps;
    }

    /* istanbul ignore next */
    const basePath = path.resolve(opts.base ? opts.base : process.cwd());

    jspmBuild.call(builder, bundle.src, opts)
      .then((result) => {
        /* istanbul ignore if */
        if (opts.summary) {
          logging.logTree(result.modules, result.inlineMap ? result.inlineMap : opts.rollup);
          logging.logBuild(bundle.dst, opts);
        }

        const file = new File({
          path: bundle.dst,
          contents: new Buffer(result.source),
          cwd: path.resolve(opts.cwd),
          base: path.resolve(basePath),
        });

        if (opts.sourceMaps) {
          applyNormalizedSourceMap(file, result.sourceMap.toString(), opts);
        }

        if (file.sourceMap && inlineSourceMaps) {
          const b64Map = new Buffer(JSON.stringify(file.sourceMap)).toString('base64');
          file.contents = new Buffer([
            result.source,
            `//# sourceMappingURL=data:application/json;base64,${b64Map}`].join('\n'));
          delete file.sourceMap;
        }

        resolve(file);
      })
      .catch((reason) => reject(reason));
  })));
}

module.exports = compile;
