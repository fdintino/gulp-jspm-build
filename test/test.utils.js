'use strict';

const chai = require('chai');
const File = require('vinyl');
const {applyNormalizedSourceMap} = require('../lib/utils');

const expect = chai.expect;

describe('utils', function() {

  it('should normalize sourcemap paths relative to the base and dest', function(done) {
    const file = new File({
      path: '/tmp/pkg/dist/a.js',
      contents: new Buffer('source')
    });
    const map = JSON.stringify({
      version: 3,
      sources: [ 'src/a/index.js' ],
      names: [],
      mappings: 'oCAAe',
      file: 'a.js'
    });

    applyNormalizedSourceMap(file, map, {base: '/tmp/pkg'});

    expect(file.sourceMap.sources[0]).to.equal('../src/a/index.js');

    done();
  });

  it('should normalize sourcemaps with file:// protocol', function(done) {
    const file = new File({
      path: '/tmp/pkg/dist/a.js',
      contents: new Buffer('source')
    });
    const map = JSON.stringify({
      version: 3,
      sources: ['file:///tmp/pkg/src/a/index.js'],
      names: [],
      mappings: 'oCAAe',
      file: 'a.js'
    });

    applyNormalizedSourceMap(file, map, {base: '/tmp/pkg'});

    expect(file.sourceMap.sources[0]).to.equal('/tmp/pkg/src/a/index.js');

    done();
  });

});
