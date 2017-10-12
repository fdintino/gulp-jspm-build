var File = require('vinyl');
var stringify = require('json-stable-stringify');

function buildConfig(config) {
    if (config.bundles) {
        for (var b in config.bundles) {
            config.bundles[b].sort();
        }
    }
    var configStr = stringify(config, { space: '    ' });
    return new File({
        path: 'jspm.config.js',
        contents: new Buffer('SystemJS.config(' + configStr + ');')
    });
}

module.exports = buildConfig;
