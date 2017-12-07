'use strict';

var proxyquire = require('proxyquire');
var File = require('vinyl');

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
      Object.assign(this, builder);
    }
  },
  './logging': {
    logTree: function() {},
    logBuild: function() {}
  }
});

function callBuild(options) {
  var promise, throughSpy, build, stream;
  promise = new Promise((resolve) => {
    throughSpy = jasmine.createSpyObj('DestroyableTransform', ['write']);
    throughSpy.end = () => {
      process.nextTick(() => resolve(stream));
    };
    throughSpy.destroy = () => { stream._destroyed = true; resolve(stream); };

    build = proxyquire('../lib/build', {
      through2: {
        obj: function() {
          return throughSpy;
        }
      },
      jspm: {
        Loader: function() {
          return {getConfig: () => {}};
        }
      },
      './compile': compile
    });

    stream = build(options);
    stream.throughSpy = throughSpy;
  });
  return promise;
}

describe('build', function() {
  it('should successfully return a stream with bundled files', function(done) {
    callBuild({
      bundles: [{src: 'a', dst: 'b'}]
    }).then((stream) => {
      expect(stream.throughSpy.write).toHaveBeenCalledWith(new File({
        path: 'b',
        contents: new Buffer('source')
      }));
      done();
    });
  });

  it('should return a destroyed stream on error', function(done) {
    callBuild({
      bundles: [{src: 'a'}]  // bundle is missing `dst`
    }).then((stream) => {
      expect(stream._destroyed).toBe(true);
      done();
    });
  });

  it('should return an empty stream with no options', function(done) {
    callBuild().then((stream) => {
      expect(stream.throughSpy.write).not.toHaveBeenCalled();
      done();
    });
  });
});
