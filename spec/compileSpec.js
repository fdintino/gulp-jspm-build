var _ = require('lodash');
var proxyquire = require('proxyquire');


function compile(options, mockOpts) {
  mockOpts = mockOpts || {};
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

  var _compile = proxyquire('../lib/compile', {
    jspm: {
      Builder: function() {
        _.assign(this, builder);
      }
    },
    './logging': {
      logTree: function() {
        if (mockOpts.triggerException) {
          throw new Error('this is an expected exception');
        }
      },
      logBuild: function() {}
    }
  });

  const promise = new Promise((resolve, reject) => {
    _compile(options).then((results) => {
      resolve({builder, results});
    }).catch(e => reject(e));
  });
  return promise;
}

/**
 * Merges an array of arrays into a single array
 */
function concat(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

describe('compile', function() {
  it('should invoke builder for each bundle', function(done) {
    compile({
      config: {},
      bundles: [
        {src: 'a', dst: 'b', options: {minify: true}},
        {src: 'e', dst: 'f'}
      ]
    }).then((values) => {
      const {builder} = values;
      expect(builder.bundle).toHaveBeenCalledWith('a', {minify: true});
      expect(builder.bundle).toHaveBeenCalledWith('e', {});
      done();
    }).catch(e => done.fail(e));
  });

  it('should return a vinyl file for bundle', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'b'}]
    }).then((values) => {
      const {results} = values;
      const sourceFile = concat(results).find(f => f.path === 'b');
      expect(sourceFile.contents.toString()).toBe('source');
      done();
    }).catch(e => done.fail(e));
  });

  it('should handle a promise exception in the jspm build', function(done) {
    compile({bundles: [{src: 'a', dst: 'b'}]}, {
      triggerException: true
    }).then(() => {
      done.fail(new Error('did not throw the expected exception'));
    }).catch(() => done());
  });
});

describe('options', function() {
  it('should call buildStatic when the bundleSfx option is specified', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'b'}],
      bundleSfx: true
    }).then((values) => {
      const {builder} = values;
      expect(builder.buildStatic).toHaveBeenCalled();
      done();
    }).catch(e => done.fail(e));
  });

  it('should fail if bundle dst not passed', function(done) {
    compile({
      bundles: [{src: 'a'}]
    }).then(() => {
      done.fail(new Error('compile did not fail'));
    }).catch(() => done());
  });

  it('should fail if bundle src not passed', function(done) {
    compile({
      bundles: [{dst: 'b'}]
    }).then(() => {
      done.fail(new Error('compile did not fail'));
    }).catch(() => done());
  });
});

describe('source maps on', function() {
  it('should generate when bundle level option is on', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'b', options: {sourceMaps: true}}]
    }).then((values) => {
      const {results} = values;
      const sourceMapFile = concat(results).find(f => f.path === 'b.map');
      expect(sourceMapFile.contents.toString()).toBe('source-map');
      done();
    }).catch(e => done.fail(e));
  });

  it('should generate when global option is on', function(done) {
    compile({
      bundleOptions: {sourceMaps: true},
      bundles: [{src: 'a', dst: 'b'}]
    }).then((values) => {
      const {results} = values;
      const sourceMapFile = concat(results).find(f => f.path === 'b.map');
      expect(sourceMapFile.contents.toString()).toBe('source-map');
      done();
    }).catch(e => done.fail(e));
  });

  it('should append source maps location to the end of source file', function(done) {
    compile({
      bundleOptions: {sourceMaps: true},
      bundles: [{src: 'a', dst: 'b'}]
    }).then((values) => {
      const {results} = values;
      const source = concat(results).find((f) => f.path === 'b');
      expect(source.contents.toString()).toBe('source\n//# sourceMappingURL=b.map');
      done();
    }).catch(e => done.fail(e));
  });
});

describe('source maps off', function() {
  it('should not generate the maps file', function(done) {
    compile({
      bundles: [{src: 'a', dst: 'b'}]
    }).then((values) => {
      const {results} = values;
      const hasSourceMapFile = concat(results).some(f => f.path === 'b.map');
      expect(hasSourceMapFile).toBe(false);
      done();
    }).catch(e => done.fail(e));
  });
});

describe('passing options to system builder', function() {
  it('should pass the global options specified', function(done) {
    const opts = {
      minify: true
    };

    compile({
      bundleOptions: opts,
      bundles: [{src: 'a', dst: 'b'}]
    }).then((values) => {
      const {builder} = values;
      expect(builder.bundle).toHaveBeenCalledWith('a', opts);
      done();
    }).catch(e => done.fail(e));
  });

  it('should pass the overrides specified for each bundle', function(done) {
    compile({
      bundleOptions: {
        minify: false
      },
      bundles: [{src: 'a', dst: 'b', options: {minify: true}}]
    }).then((values) => {
      const {builder} = values;
      expect(builder.bundle).toHaveBeenCalledWith('a', {minify: true});
      done();
    }).catch(e => done.fail(e));
  });
});
