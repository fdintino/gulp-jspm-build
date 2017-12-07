'use strict';

var _ = require('lodash');
var proxyquire = require('proxyquire');

var builder = jasmine.createSpyObj('bundle', ['config', 'bundle', 'buildStatic']);
builder.bundle.and.returnValue(Promise.resolve({
  source: 'source',
  sourceMap: 'source-map',
  modules: []
}));
builder.buildStatic.and.returnValue(Promise.resolve({
  source: 'source',
  sourceMap: 'source-map',
  modules: []
}));

var compile = proxyquire('../lib/compile', {
  jspm: {
    Builder: function() {
      _.assign(this, builder);
    }
  },
  './logging': {
    logTree: function() {},
    logBuild: function() {}
  }
});

module.exports = compile;
