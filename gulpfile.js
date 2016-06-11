'use strict';
var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var tsc = require('gulp-tsc');
var shell = require('gulp-shell');
var runseq = require('run-sequence');
var tslint = require('gulp-tslint');

gulp.task('static', function () {
  return gulp.src('**/*.ts')
    .pipe(excludeGitignore())
    .pipe(tslint())
    .pipe(tslint.report('prose', {
      emitError: true
    }));;
});

gulp.task('nsp', function (cb) {
  nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', ['build'], function () {
  return gulp.src('lib/**/*.js')
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('watch', function () {
  gulp.watch(paths.tscripts.src, runseq(['build', 'test']));
});

gulp.task('coveralls', ['test'], function () {
  if (!process.env.CI) {
    return;
  }

  return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});

gulp.task('prepublish', ['nsp']);
gulp.task('default', ['static', 'test', 'coveralls']);

var paths = {
  tscripts: {
    src: ['**/*.ts', '!node_modules/**/*.ts', '!typings/**/*.ts'],
    dest: ''
  }
};

// ** Compilation ** //
gulp.task('build', function () {
  return gulp
    .src(paths.tscripts.src)
    .pipe(tsc({
      // module: "commonjs",
      // target: 'ES6',
      sourceMap: true,
      sourceRoot: process.cwd(),
      emitError: false
    }))
    .pipe(gulp.dest(paths.tscripts.dest));
});

// ** Linting ** //
gulp.task('lint', function () {
  return gulp.src(paths.tscripts.src)
    .pipe(tslint())
    .pipe(tslint.report('prose', {
      emitError: false
    }));
});
