var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var del = require('del');
var isparta = require('isparta');

var config = require('../config');

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-register');

gulp.task('static', function () {
  return gulp.src(config.src)
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
  nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
  return gulp.src(config.src)
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true,
      instrumenter: isparta.Instrumenter
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
  var mochaErr;

  gulp.src(config.testSrc)
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      console.log(err);
      mochaErr = err;
    })
    .pipe(istanbul.writeReports({
      reporters: ['lcov', 'text', 'text-summary']
    }))
    .on('end', function () {
      cb(mochaErr);
      process.exit();
    });
});

gulp.task('watch', function () {
  gulp.watch([config.src, 'test/**'], ['test']);
});

gulp.task('babel', ['clean'], function () {
  return gulp.src(config.src)
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return del('dist');
});

gulp.task('dev', [], function() {
  gulp.watch(config.src, ['browserify', 'babel']);
});

gulp.task('prepublish', ['nsp', 'babel', 'browserify', 'minify']);
gulp.task('default', ['static', 'test']);
