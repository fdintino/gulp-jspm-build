'use strict';

var proxyquire = require('proxyquire').noPreserveCache();
var File = require('vinyl');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const mocks = require('./mocks');

chai.use(sinonChai);

const expect = chai.expect;
const Builder = mocks.Builder;

function callBuild(options) {
  return new Promise((resolve) => {
    function DestroyableTransform() {
      this.write = sinon.spy();
      this.destroy = () => {
        this._destroyed = true;
        process.nextTick(() => resolve(this));
      };
      this.end = function() {
        process.nextTick(() => resolve(this));
      };
    }

    const jspmProxy = {
      on: function() {},
      install: function() {
        return Promise.resolve(true);
      },
      Loader: function() {
        return {getConfig: () => {}};
      },
      Builder: Builder,
    };

    const build = proxyquire('../lib/build', {
      through2: {
        obj: function() {
          return new DestroyableTransform();
        }
      },
      jspm: jspmProxy,
      './compile': proxyquire('../lib/compile', {
        jspm: jspmProxy,
        './logging': {
          logTree: function() {},
          logBuild: function() {}
        }
      })
    });

    build(options);
  });
}

describe('build', function() {
  it('should return a stream with a bundled file', function(done) {
    callBuild({
      bundles: [{src: 'foobar', dst: 'foobar.js'}],
      bundleOptions: {minify: true},
    }).then((stream) => {
      expect(stream.write).to.have.been.calledWith(new File({
        path: 'foobar.js',
        contents: new Buffer(Builder.expected.bundle.foobar.source)
      }));
      done();
    });
  });

  it('should return a stream with a bundled file and source map', function(done) {
    callBuild({
      bundles: [{src: 'foobar', dst: 'foobar.js'}],
      bundleOptions: {minify: true, sourceMaps: true},
    }).then((stream) => {
      const file = new File({
        path: 'foobar.js',
        contents: new Buffer(Builder.expected.bundle.foobar.source)
      });
      file.sourceMap = Builder.expected.bundle.foobar.sourceMap;
      expect(stream.write).to.have.been.calledWith(file);
      done();
    });
  });

  it('should return a stream with as many files as there are bundles', function() {
    return callBuild({
      bundles: [
        {src: 'foobar', dst: 'foobar.js', sfx: true},
        {src: 'a', dst: 'a.js', options: {sourceMaps: true}},
      ],
      bundleOptions: {minify: true},
    }).then((stream) => {
      expect(stream.write).to.have.been.calledWith(new File({
        path: 'foobar.js',
        contents: new Buffer(Builder.expected.build.foobar.source),
      }));
      const file = new File({
        path: 'a.js',
        contents: new Buffer(Builder.expected.bundle.a.source),
      });
      file.sourceMap = Builder.expected.bundle.a.sourceMap;
      expect(stream.write).to.have.been.calledWith(file);
    });
  });

  it('should return a destroyed stream on error', function(done) {
    callBuild({
      bundles: [{src: 'a'}]  // bundle is missing `dst`
    }).then((stream) => {
      expect(stream._destroyed).to.equal(true);
      done();
    });
  });

  it('should return a destroyed stream on install error', function(done) {
    callBuild({
      install: true
    }).then((stream) => {
      expect(stream._destroyed).to.equal(true);
      done();
    });
  });

  it('should return an empty stream with no options', function(done) {
    callBuild().then((stream) => {
      expect(stream.write).to.not.have.been.called;
      done();
    });
  });
});
