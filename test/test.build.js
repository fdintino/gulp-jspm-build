'use strict';

var proxyquire = require('proxyquire').noPreserveCache();
var File = require('vinyl');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const helpers = require('./helpers');

chai.use(helpers);

class Builder {
  config() {}
  bundle() {
    return Promise.resolve({
      source: 'source',
      sourceMap: 'source-map',
      modules: []
    });
  }
  buildStatic() {
    return Promise.resolve({
      source: 'source',
      sourceMap: 'source-map',
      modules: []
    });
  }
}

function callBuild(options) {
  var promise, build;
  promise = new Promise((resolve) => {
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
      install: function() {
        return Promise.resolve(true);
      },
      Loader: function() {
        return {getConfig: () => {}};
      },
      Builder: function() {
        return new Builder();
      }
    };

    build = proxyquire('../lib/build', {
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
  return promise;
}

describe('build', function() {
  it('should successfully return a stream with bundled files', function(done) {
    callBuild({
      bundles: [{src: 'a', dst: 'b'}]
    }).then((stream) => {
      expect(stream.write).to.have.been.calledWith(new File({
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
