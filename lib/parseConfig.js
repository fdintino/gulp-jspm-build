var path = require('path');
var fs = require('fs');
var SystemJSLoader = require('systemjs').constructor;

function parseConfig(file) {
    var source = '';

    try {
        source = fs.readFileSync(file);
    } catch (e) {
    }

    /* jshint ignore:start */
    var SystemJS = new SystemJSLoader();
    var System = SystemJS;
    /* jshint ignore:end */

    eval(source.toString());
    return SystemJS.getConfig();
}

module.exports = parseConfig;
