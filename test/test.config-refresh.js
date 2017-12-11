'use strict';

const jspmConfigRefresh = require('../lib/jspm-config-refresh');
const utils = require('./utils');

describe('jspm config refresh', function() {
  let dir1, dir2;

  beforeEach((done) => {
    Promise.all([utils.jspmTemp(), utils.jspmTemp()]).then((values) => {
      dir1 = values[0];
      dir2 = values[1];
      done();
    }).catch(e => done(e));
  });

  afterEach(() => {
    if (dir1) { utils.rmdir(dir1); }
    if (dir2) { utils.rmdir(dir2); }
  });

  it('should allow for re-setting the package path', function(done) {
    let jspm = require('jspm');

    jspm.setPackagePath(dir1);
    jspm.Loader();  // initialize config

    jspm = jspmConfigRefresh();

    // This would throw an exception if the config refresh did not work.
    jspm.setPackagePath(dir2);
    jspm.Loader();

    done();
  });
});
