const path = require('path');
const applySourceMap = require('vinyl-sourcemaps-apply');

const isWin = process.platform.match(/^win/);

function fromFileUrl(url) {
  return url.substr(7 + !!isWin).replace(/\//g, path.sep);
}

function isFileUrl(url) {
  return url.substr(0, 8) === 'file:///';
}

function applyNormalizedSourceMap(file, sourceMap, opts) {
  const basePath = path.resolve(opts.base ? opts.base : process.cwd());
  const outPath = path.dirname(file.path);

  const normalized = JSON.parse(sourceMap);

  normalized.sources = normalized.sources.map(function(source) {
    source = (isFileUrl(source)) ? fromFileUrl(source) : source;

    // If the source is already a root-relative path, use it as-is, otherwise
    // make it relative to the outPath.
    const isRootRelative = /^[\\/]/.test(source);
    source = (isRootRelative
      ? source
      : path.relative(outPath, path.resolve(basePath, source))).replace(/\\/g, '/');

    return source;
  });

  applySourceMap(file, JSON.stringify(normalized));
}

exports.applyNormalizedSourceMap = applyNormalizedSourceMap;
