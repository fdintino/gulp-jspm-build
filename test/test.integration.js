'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const jspmConfigRefresh = require('../lib/jspm-config-refresh');
const sinon = require('sinon');
const through = require('through2');
const proxyquire = require('proxyquire').noPreserveCache();
const chai = require('chai');
const expect = chai.expect;
const gutil = require('gulp-util');

const helpers = require('./helpers');

chai.use(helpers);

const cwd = process.cwd();

describe('build integration', function() {
  this.timeout(5000);

  let build;
  let dir;
  let jspm;

  beforeEach((done) => {
    utils.jspmTemp().then((d) => {
      dir = d;
      process.chdir(dir);
      jspm = jspmConfigRefresh();
      jspm.setPackagePath(dir);
      sinon.spy(jspm, 'install');
      sinon.stub(gutil, 'log').callsFake(function() {});
      // logging.log('ok', 'test');
      build = proxyquire('../lib/build', {
        jspm: jspm,
        through2: {
          obj: function() {
            var obj = through.obj();
            sinon.spy(obj, 'write');
            return obj;
          }
        }
      });
      done();
    }).catch(e => done(e));
  });

  afterEach(() => {
    if (dir) {
      utils.rmdir(dir);
    }
    process.chdir(cwd);
    jspm.install.restore();
    gutil.log.restore();
  });

  it('should build a simple package', function(done) {
    build({
      packagePath: dir,
      bundles: [{src: 'test-app-42', dst: path.join(dir, 'dist')}]
    }).on('finish', function() {
      expect(this.write).to.have.been.firstCalled.withFirstArg.that.contains('return 42');
      done();
    });
  });

  it('should allow installing and bundling an npm dependency', function(done) {
    build({
      packagePath: dir,
      bundles: [{src: 'test-app-repeat-string', dst: path.join(dir, 'dist')}],
      install: 'force'
    }).on('finish', function() {
      expect(this.write).to.have.been.firstCalled.withFirstArg.that.contains('return repeat');
      done();
    });
  });

  it('should allow being called with multiple package paths', function(done) {
    build({
      packagePath: dir,
      bundles: [{src: 'test-app-42', dst: path.join(dir, 'dist')}]
    }).on('finish', function() {
      utils.jspmTemp().then((dir2) => {
        build({
          packagePath: dir2,
          bundles: [{src: 'test-app-42', dst: path.join(dir, 'dist')}]
        }).on('finish', function() {
          expect(this.write).to.have.been.firstCalled.withFirstArg.that.contains('return repeat');
          done();
        });
      });
    });
  });


  it('should install even without a bundle', function(done) {
    build({
      packagePath: dir,
      install: 'force'
    }).on('finish', function() {
      expect(fs.existsSync(path.join(dir, 'jspm_packages/system.js'))).to.equal(true);
      done();
    });
  });

  it('should not install twice if package.json has not changed', function(done) {
    build({
      packagePath: dir,
      install: true
    }).on('finish', function() {
      build({
        packagePath: dir,
        install: true
      }).on('finish', function() {
        expect(jspm.install).to.have.been.calledOnce;
        done();
      });
    });
  });

  it('should install twice if forced', function(done) {
    build({
      packagePath: dir,
      install: 'force'
    }).on('finish', function() {
      build({
        packagePath: dir,
        install: 'force'
      }).on('finish', function() {
        expect(jspm.install).to.have.been.calledTwice;
        done();
      });
    });
  });

  it('should log if installOptions.summary is true', function(done) {
    build({
      packagePath: dir,
      install: 'force',
      installOptions: {summary: true}
    }).on('finish', function() {
      expect(gutil.log).to.have.been.called;
      done();
    });
  });

});
