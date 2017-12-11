'use strict';

var File = require('vinyl');
var logging = require('./logging');

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
      jspmBuild = builder[options.sfx ? 'buildStatic' : 'bundle'];

    /* istanbul ignore if */
    if (options.builderConfig) {
      builder.config(options.builderConfig);
    }

    if (!bundle.src) {
      return reject(new Error('bundle src not specified'));
    }
    if (!bundle.dst) {
      return reject(new Error('bundle dst not specified'));
    }

    const opts = Object.assign({}, options.bundleOptions, bundle.options);

    jspmBuild.call(builder, bundle.src, opts)
      .then((result) => {
        const files = [];
        let source = result.source;

        /* istanbul ignore if */
        if (opts.summary) {
          logging.logTree(result.modules, result.inlineMap ? result.inlineMap : opts.rollup);
          logging.logBuild(bundle.dst, opts);
        }

        if (opts.sourceMaps) {
          source = `${source}\n//# sourceMappingURL=${bundle.dst}.map`;

          files.push(new File({
            path: `${bundle.dst}.map`,
            contents: new Buffer(result.sourceMap.toString())
          }));
        }

        files.push(new File({
          path: bundle.dst,
          contents: new Buffer(source)
        }));

        resolve(files);
      })
      .catch((reason) => reject(reason));
  })));
}

module.exports = compile;
