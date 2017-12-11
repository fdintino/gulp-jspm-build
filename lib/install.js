'use strict';

const fs = require('fs');
const path = require('path');
const logging = require('./logging');

function needsInstall(pjson) {
  var pjsonMtime = fs.statSync(pjson.file.fileName).mtime;
  var configMtime = fs.statSync(pjson.configFile).mtime;
  var depsJson = path.resolve(pjson.packages, '.dependencies.json');
  var depsJsonMtime;
  try {
    depsJsonMtime = fs.statSync(depsJson).mtime;
  } catch(e) {
    /* istanbul ignore else */
    if (e.code === 'ENOENT') {
      return true;
    } else {
      throw e;
    }
  }
  return !!(depsJsonMtime < pjsonMtime || depsJsonMtime < configMtime);
}

function install(options, jspm) {
  const forceInstall = (options.install === 'force');
  const installOpts = options.installOptions;

  function log(type, msg) {
    if (installOpts.summary) {
      logging.log(type, msg);
    }
  }

  return new Promise((resolve, reject) => {
    if (!options.install) {
      return resolve(false);
    }
    /* istanbul ignore if */
    if (typeof jspm === 'undefined') {
      jspm = require('jspm');
    }
    const jspmConfig = require('jspm/lib/config');
    const jspmCore = require('jspm/lib/core');

    let doesNeedInstall;
    try {
      doesNeedInstall = needsInstall(jspmConfig.pjson);
    } catch(e) {
      /* istanbul ignore next */
      return reject(e);
    }
    if (doesNeedInstall) {
      log('ok', 'jspm install out-of-date, installing');
    } else if (forceInstall) {
      log('ok', 'jspm install already up-to-date, but force installing anyway');
    } else {
      log('ok', 'jspm install already up-to-date, skipping');
      return resolve(false);
    }

    let installResult;

    jspm.install(true, installOpts).then((result) => {
      installResult = result;
      return jspmCore.checkDlLoader();
    }).then(() => {
      resolve(installResult);
    }).catch((e) => { /* istanbul ignore next */ reject(e); });
  });
}

module.exports = install;
