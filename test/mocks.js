'use strict';

const sinon = require('sinon');

/**
 * Mocks jspm.Builder behavior.
 *
 * The level of fidelity to the real behavior is completely unnecessary,
 * bordering on deranged.
 */
class Builder {
  constructor() {
    ['config', 'bundle', 'buildStatic'].forEach((method) => {
      sinon.spy(this, method);
    });
  }
  config() {}
  bundle(expressionOrTree, outFile, opts) {
    return this._buildOrBundle('bundle', expressionOrTree, outFile, opts);
  }
  buildStatic(expressionOrTree, outFile, opts) {
    return this._buildOrBundle('build', expressionOrTree, outFile, opts);
  }
  _buildOrBundle(type, pkg, outFile, opts) {
    if (pkg !== 'a' && pkg !== 'foobar') {
      throw new Error('jspm Builder mock only works for packages named "a" or "foobar"');
    }
    if (outFile && typeof outFile === 'object') {
      opts = outFile;
      outFile = undefined;
    }
    opts = opts || {};
    const expected = Builder.expected[type][pkg];
    return Promise.resolve({
      source: expected.source,
      sourceMap: (!opts.sourceMaps) ? undefined : {
        toString: () => JSON.stringify(expected.sourceMap),
      },
      modules: [`${pkg}/index.js`],
    });
  }
  static get expected() {
    const retval = {};
    ['build', 'bundle'].forEach((type) => {
      retval[type] = {};
      ['a', 'foobar'].forEach((pkg) => {
        retval[type][pkg] = {
          source: Builder._getSource(pkg, type),
          sourceMap: Builder._getSourceMap(pkg, type),
        };
      });
    });
    return retval;
  }
  static _getSourceMap(pkg, type) {
    const mappings = {
      a: {build: 'oCAAe', bundle: '4GAAe'},
      foobar: {build: 'gCAAiB', bundle: 'mHAAWA,EAAM'},
    };
    return {
      version: 3,
      sources: [`src/${pkg}/index.js`],
      names: (type === 'bundle' && pkg === 'foobar') ? ['bar']: [],
      mappings: mappings[pkg],
      file: `${pkg}.js`,
    };
  }
  static _getSource(pkg, type) {
    if (pkg !== 'a' && pkg !== 'foobar') {
      throw new Error('jspm Builder mock only works for packages named "a" or "foobar"');
    }
    if (type === 'build') {
      const prop = (pkg === 'a') ? 'default' : 'bar';
      const global = (pkg === 'a') ? 'a' : 'foo';
      return [
        `!function(a){"use strict";a.${prop}="${pkg}"}`,
        `(this.${global}=this.${global}||{});`].join('');
    } else {
      const vars = (pkg === 'foobar') ? 'var c;' : '';
      const body = (pkg === 'foobar')
        ? 'a("bar",c="foobar"),a("bar",c)'
        : 'a("default","a")';
      return [
        `System.register("${pkg}/index.js",[],function(a,b){"use strict";`,
        `${vars};return{setters:[],execute:function(){${body}}}});`].join('');
    }
  }
}

module.exports = {
  Builder: Builder,
};
