const compile = require('./compile');
const through = require('through2');
const jspm = require('jspm');

function build(options) {
  const loader = jspm.Loader(),
    stream = through.obj();

  options = Object.assign({}, options || {}, {config: loader.getConfig()});

  compile(options)
    .then((results) => {
      results.forEach((files) =>
        files.forEach((f) => stream.write(f)));
      stream.end();
    })
    .catch((e) => stream.destroy(e));

  return stream;
}

module.exports = build;
