# gulp-jspm-builder [![Build Status](https://travis-ci.org/fdintino/gulp-jspm-builder.svg?branch=master)](https://travis-ci.org/fdintino/gulp-jspm-builder)

Gulp task to run jspm build and produce output as a Vinyl stream.

Based on [gulp-jspm-build](https://github.com/buddyspike/gulp-jspm-build), but written to support jspm 0.17, with better logging, error handling, and sourcemap support, as well as the ability to run `jspm install` as part of the gulp task.


## Install

```
npm install --save-dev gulp-jspm-builder
```

## Usage

```javascript
var jspmBuilder = require('gulp-jspm-builder');

gulp.task('jspm', function(){
    jspmBuilder({
        bundles: [
            { src: 'app', dst: 'app.js' }
        ]
    })
    .pipe(gulp.dest('.dist'));
});

```

## API: jspmBuilder([options])

### install

Type: `boolean` or `string`<br>
Default: `false`

 - **`false`**: do not run `jspm install`
 - **`true`** / **`'auto'`**: only run `jspm install` if package.json or config files have changed since an install was last run.
 - **`'force'`**: always run `jspm install`

### installOptions

Type: `object`

Options passed to `jspm.install()`. Pass `{summary: true}` to generate log output for the install.

### bundles

Type: `Array`

An array of bundles to create. Each object is a jspm bundle created with `jspm.Builder`, according to the following format.

#### src

Type: `string`

Modules to bundle. You can use jspm arithmetic expressions here.

```javascript
'app'
'core + navigation + app'
'app - react'
```

#### dst

Type: `string`

Output filename for the bundle. The eventually created file will be at this path, relative to the directory passed into `gulp.dest()`.

#### sfx

Type: `string`<br>
Default: `false`

Create a single file executable, including all necessary dependencies and systemjs.

See the [jspm documentation](https://github.com/jspm/jspm-cli/blob/master/docs/production-workflows.md#creating-a-self-executing-bundle) for more information.

#### options

Type: `object`

The options argument passed to `jspm.Builder.buildStatic` or `jspm.Builder.bundle` (depending on whether `sfx` is `true` or `false`, respectively).

```javascript
{
  minify: true,
  mangle: true,
  sourceMaps: true,
  format: 'global',
  globalName: 'myGlobal'
}
```

**Note!** For sourcemaps files to be created, it is also necessary to pipe the stream returned from `jspmBuilder()` to [gulp-sourcemaps](https://github.com/gulp-sourcemaps/gulp-sourcemaps)'s `write()` function:

```javascript
const sourcemaps = require('gulp-sourcemaps');

// Because of a long-standing bug in gulp-sourcemaps, it is necessary to either
// include the destination directory in bundles.dst (and call gulp.dest() with
// '.') or to pass the sourceRoot option to sourcemaps.write() in order for
// the relative paths of sources to be correct.
jspmBuilder({bundles: [{src: 'pkg', dst: 'dist/pkg.js', sourceMaps: true}]})
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('.'));
```

### bundleOptions

Same as `bundle.options`, but applies to all bundles.

### packagePath

Type: `string`

Optional, the path where the `package.json` containing the jspm config lives. For the common case this should be omitted.

### baseURL
The jspm base URL, as normally specified in your `package.json` under `config.jspm.directories.baseURL`. Defaults to `'.'`.

### config
Optional, an object passed to SystemJS.config() to override SystemJS settings.

## Example

```javascript
var jspmBuilder = require('gulp-jspm-builder');

gulp.task('jspm', function(){
    jspmBuilder({        
        bundleOptions: {
            minify: true,
            mangle: true
        },
        bundles: [
            { src: 'app', dst: 'app.js', sfx: true }
            {
                src: 'react + react-router',
                dst: 'lib.js',
                options: { mangle: false }
            }
        ],
        install: true,
        installOptions: {
            summary: true
        }
    })
    .pipe(gulp.dest('.dist'));
});
```
