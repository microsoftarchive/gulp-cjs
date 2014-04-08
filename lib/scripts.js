'use strict';

var fs = require('fs');
var path = require('path');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var mold = require('mold-source-map');
var filesize = require('filesize');
var colors = require('gulp-streamify/node_modules/gulp-util').colors;

var uglifier = uglify({
  'beautify': {
    'width': 80,
    'max-line-len': 80
  },
  'mangle': true,
  'outSourceMap': false
});

function scripts (gulp, options) {

  var name = options.name || 'module';
  var sourceDir = path.resolve(options.sourceDir || 'public');
  var destDir = path.resolve(options.destDir || 'dest');

  var entry = path.dirname(sourceDir);
  var mapFilePath = path.resolve(destDir, name + '.map');
  var excludes = options.excludes || [];

  function mapFileUrlComment (sourcemap, callback) {
    var jsRoot = path.resolve(sourceDir, '..');
    sourcemap.sourceRoot('file://');
    var mapper = mold.mapPathRelativeTo(jsRoot);
    sourcemap.mapSources(function (file) {
      return path.join(name, mapper(file));
    });
    sourcemap.file(name);

    // write map file and return a sourceMappingUrl that points to it
    var content = sourcemap.toJSON(2);
    fs.writeFile(mapFilePath, content, 'utf-8', function (err) {
      if (err) {
        throw err;
      }
      callback('//@ sourceMappingURL=' + path.basename(mapFilePath));
    });
  }

  return function (callback) {
    var bundler = browserify({ 'basedir': sourceDir });

    excludes.forEach(function (module) {
      bundler = bundler.exclude(module);
    });

    bundler
      .require(entry, { 'entry': true })
      // dev version with sourcemaps
      .bundle({
        'standalone': name,
        'debug': true
      })
      .pipe(mold.transform(mapFileUrlComment))
      .pipe(source(name + '.js'))
      .pipe(gulp.dest(destDir))
      // minified version
      .pipe(streamify(uglifier))
      .pipe(rename({ 'suffix': '.min' }))
      .pipe(gulp.dest(destDir))
      .on('end', function () {
        setTimeout(function () {
          var builtFile = path.join(destDir, name);
          var buildSize = fs.statSync(builtFile + '.js').size;
          var minSize = fs.statSync(builtFile + '.min.js').size;
          console.info('%s Uncompressed\t%s\n%s Compressed\t%s',
                  colors.green('\u2713'),
                  colors.blue(filesize(buildSize, 2, false)),
                  colors.green('\u2713'),
                  colors.blue(filesize(minSize, 2, false)));
          callback();
        }, 2000);
      });
  };
}

module.exports = scripts;