'use strict';

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const through = require('through2');
const proxyquire = require('proxyquire').noPreserveCache();
const chai = require('chai');
const gulp = require('gulp');
const gulplog = require('gulplog');
const gulpSourcemaps = require('gulp-sourcemaps');
const File = require('vinyl');
const sinonChai = require('sinon-chai');

const utils = require('./utils');
const jspmConfigRefresh = require('../lib/jspm-config-refresh');

chai.use(sinonChai);

const expect = chai.expect;
const cwd = process.cwd();


describe('gulp plugin', function() {
  this.timeout(10000);

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
      sinon.stub(gulplog, 'info').callsFake(function() {});
      const _build = proxyquire('../lib/build', {
        jspm: jspm,
        through2: {
          obj: function() {
            var obj = through.obj();
            sinon.spy(obj, 'write');
            return obj;
          }
        }
      });
      build = function build(opts) {
        opts = Object.assign({packagePath: dir}, opts);
        return _build(opts);
      };
      done();
    }).catch(e => done(e));
  });

  afterEach(() => {
    if (dir) {
      utils.rmdir(dir);
    }
    process.chdir(cwd);
    jspm.install.restore();
    gulplog.info.restore();
  });

  it('should build a simple package', function(done) {
    build({bundles: [{src: 'foobar', dst: 'foobar.js'}]})
      .on('finish', function() {
        expect(this.write).to.have.been.called;
        const callArg = this.write.getCall(0).args[0];
        expect(callArg, 'the call to stream.write').to.be.an.instanceOf(File);
        expect(callArg.contents.toString(), 'File contents').to.contain('foobar');
        done();
      });
  });

  it('should allow installing and bundling an npm dependency', function(done) {
    build({
      bundles: [{src: 'test-app-repeat-string', dst: 'test-app-repeat-string.js'}],
      install: 'force'
    }).on('finish', function() {
      expect(this.write).to.have.been.called;
      const callArg = this.write.getCall(0).args[0];
      expect(callArg, 'the call to stream.write').to.be.an.instanceOf(File);
      expect(callArg.contents.toString(), 'File contents').to.contain('return repeat');
      done();
    });
  });

  it('should allow being called with multiple package paths', function(done) {
    build({bundles: [{src: 'a', dst: 'a.js'}]}).on('finish', () => {
      utils.jspmTemp().then((dir2) => {
        build({
          packagePath: dir2,
          bundles: [{src: 'foobar', dst: 'foobar.js'}]
        }).on('finish', function() {
          expect(this.write).to.have.been.called;
          const callArg = this.write.getCall(0).args[0];
          expect(callArg, 'the call to stream.write').to.be.an.instanceOf(File);
          expect(callArg.contents.toString(), 'File contents').to.contain('foobar');
          done();
        });
      });
    });
  });

  it('should install even without a bundle', function(done) {
    build({install: 'force'}).on('finish', () => {
      expect(
        fs.existsSync(path.join(dir, 'jspm_packages/system.js')),
        'jspm_packages/system.js file exists').to.be.true;
      done();
    });
  });

  it('should not install twice if package.json has not changed', function(done) {
    build({install: true}).on('finish', () => {
      build({install: true})
        .on('finish', function() {
          expect(jspm.install).to.have.been.calledOnce;
          done();
        });
    });
  });

  it('should always install if forced', function(done) {
    build({install: 'force'}).on('finish', () => {
      build({install: 'force'}).on('finish', () => {
        expect(jspm.install).to.have.been.calledTwice;
        done();
      });
    });
  });

  it('should log if installOptions.summary is true', function(done) {
    build({
      install: 'force',
      installOptions: {summary: true}
    }).on('finish', function() {
      expect(gulplog.info).to.have.been.called;
      done();
    });
  });

  it('should not save files before gulp.dest called', function(done) {
    build({
      bundles: [{src: 'foobar', dst: 'foobar.js'}]
    }).on('finish', function() {
      expect(
        fs.existsSync(path.join(dir, 'foobar.js')),
        'foobar.js exists'
      ).to.not.be.true;
      done();
    });
  });

  it('should save files when piped to gulp.dest', function(done) {
    build({bundles: [{src: 'foobar', dst: 'foobar.js'}]})
      .pipe(gulp.dest('dist'))
      .on('finish', function() {
        expect(
          fs.existsSync(path.join(dir, 'dist/foobar.js')),
          'dist/foobar.js exists'
        ).to.be.true;
        done();
      });
  });

  it('should save sourcemaps when piped to gulp-sourcemaps write', function(done) {
    build({bundles: [{src: 'foobar', dst: 'dist/foobar.js', options: {sourceMaps: true}}]})
      .pipe(gulpSourcemaps.write('.'))
      .pipe(gulp.dest(path.resolve('.')))
      .on('finish', function() {
        const sourceMapPath = path.join(dir, 'dist/foobar.js.map');
        expect(
          fs.existsSync(sourceMapPath), 'dist/foobar.js.map exists'
        ).to.be.true;

        const sourcemap = JSON.parse(fs.readFileSync(sourceMapPath));
        expect(sourcemap.sources[0]).to.equal('../src/foobar/index.js');
        done();
      });
  });

});
