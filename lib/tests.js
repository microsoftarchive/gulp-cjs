'use strict';

var path = require('path');

var browserify = require('browserify');
var glob = require('browserify/node_modules/glob');
var source = require('vinyl-source-stream');
var mold = require('mold-source-map');

function specs (gulp, options) {

  var name = options.name || 'module';
  var destDir = path.resolve(options.destDir || 'dist');
  var baseDir = path.resolve(options.baseDir || '.');
  var globPattern = options.pattern || '**/*.spec.js';

  var files = glob.sync(globPattern, {
    'cwd': baseDir
  }).map (function (file) {
    return path.resolve(baseDir, file);
  });

  return function (callback) {

    var bundler = browserify(files);

    var excludes = options.excludes || [];
    excludes.forEach(function (module) {
      bundler = bundler.exclude(module);
    });

    bundler
      .bundle({ 'debug': true })
      .pipe(mold.transformSourcesRelativeTo(baseDir))
      .pipe(source(name + '.js'))
      .pipe(gulp.dest(destDir))
      .on('end', function () {
        callback();
      });
  };
}

module.exports = specs;