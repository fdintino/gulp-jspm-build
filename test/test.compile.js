'use strict';

const proxyquire = require('proxyquire').noPreserveCache();
const chai = require('chai');
const sinonChai = require('sinon-chai');

const mocks = require('./mocks');

chai.use(sinonChai);

const expect = chai.expect;
const Builder = mocks.Builder;

function compile(options, mockOpts) {
  mockOpts = mockOpts || {};

  const builder = new Builder();

  var _compile = proxyquire('../lib/compile', {
    jspm: {
      on: function() {},
      Builder: function() {
        [
          'bundle', 'buildStatic', 'config', '_buildOrBundle',
        ].forEach((prop) => {
          this[prop] = builder[prop].bind(this);
        });
        this.expected = Builder.expected;
      },
    },
    './logging': {
      logTree: function() {
        if (mockOpts.triggerException) {
          throw new Error('this is an expected exception');
        }
      },
      logBuild: function() {},
    }
  });

  const promise = new Promise((resolve, reject) => {
    _compile(options).then((files) => {
      resolve({builder, files});
    }).catch(e => reject(e));
  });
  return promise;
}

describe('compile', function() {
  const defaultOpts = {
    cwd: process.cwd(),
    cwdbase: false,
  };

  it('should invoke builder for each bundle', function(done) {
    compile({
      config: {},
      bundles: [
        {src: 'a', dst: 'a.js', options: {minify: true}},
        {src: 'foobar', dst: 'foobar.js'}
      ]
    }).then((results) => {
      const builder = results.builder;
      expect(builder.bundle).to.have.been.calledWith(
        'a', Object.assign({}, defaultOpts, {minify: true}));
      expect(builder.bundle).to.have.been.calledWith('foobar', defaultOpts);
      done();
    }).catch(e => done(e));
  });

  it('should return a vinyl file for bundle', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'a.js'}],
    }).then((results) => {
      const sourceFile = results.files[0];
      expect(sourceFile.contents.toString()).to.equal(Builder.expected.bundle.a.source);
      done();
    }).catch(e => done(e));
  });

  it('should handle a promise exception in the jspm build', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'a.js'}],
      bundleOptions: {summary: true},
    }, {
      triggerException: true
    }).then(() => {
      done(new Error('did not throw the expected exception'));
    }).catch(() => done());
  });

  it('should call buildStatic when the sfx option is specified', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'a.js', sfx: true}]
    }).then((results) => {
      const builder = results.builder;
      expect(builder.buildStatic).to.have.been.calledOnce;
      done();
    }).catch(e => done(e));
  });

  it('should fail if bundle dst not passed', function(done) {
    compile({
      bundles: [{src: 'a'}]
    }).then(() => {
      done(new Error('compile did not fail'));
    }).catch(() => done());
  });

  it('should fail if bundle src not passed', function(done) {
    compile({
      bundles: [{dst: 'a.js'}]
    }).then(() => {
      done(new Error('compile did not fail'));
    }).catch(() => done());
  });

  it('should be generated when options.sourceMaps on bundle is true', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'a.js', options: {sourceMaps: true}}]
    }).then((results) => {
      expect(results.files[0].sourceMap).to.exist;
      done();
    }).catch(e => done(e));
  });

  it('should be generated when bundleOptions.sourceMaps is true', function(done) {
    compile({
      bundleOptions: {sourceMaps: true},
      bundles: [{src: 'a', dst: 'b'}]
    }).then((results) => {
      expect(results.files[0].sourceMap).to.exist;
      done();
    }).catch(e => done(e));
  });

  it('should not generate sourcemaps if not requested', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'b'}]
    }).then((results) => {
      expect(results.files[0].sourceMap).to.be.undefined;
      done();
    }).catch(e => done(e));
  });

  it('should pass bundleOptions to each bundle', function(done) {
    const opts = {minify: true};

    compile({
      bundleOptions: opts,
      bundles: [{src: 'a', dst: 'a.js'}]
    }).then((results) => {
      expect(results.builder.bundle).to.have.been.calledWith(
        'a', Object.assign({}, defaultOpts, opts));
      done();
    }).catch(e => done(e));
  });

  it('should pass the overrides specified for each bundle', function(done) {
    compile({
      bundleOptions: {
        minify: false
      },
      bundles: [{src: 'a', dst: 'b', options: {minify: true}}]
    }).then((results) => {
      expect(results.builder.bundle).to.have.been.calledWith(
        'a', Object.assign({}, defaultOpts, {minify: true}));
      done();
    }).catch(e => done(e));
  });
});
