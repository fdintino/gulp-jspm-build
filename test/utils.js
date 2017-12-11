'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');

function rmdir(dirPath) {
  fs.emptyDirSync(dirPath);
  fs.rmdir(dirPath);
}

function jspmTemp() {
  return new Promise((resolve, reject) => {
    let temp;
    try {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg'));
      fs.emptyDirSync(temp);
      fs.copySync(path.join(__dirname, 'fixtures/pkg'), temp);
      resolve(temp);
    } catch(e) {
      if (temp) {
        rmdir(temp);
      }
      reject(e);
    }
  });
}

module.exports = {
  rmdir: rmdir,
  jspmTemp: jspmTemp
};
