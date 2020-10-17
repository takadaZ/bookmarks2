/* eslint-disable import/no-extraneous-dependencies */
const webpackStream = require('webpack-stream');
const gulp = require('gulp');
const hashsum = require('gulp-hashsum');

const { src, dest, series, parallel } = gulp;

const webpackConfig = require('./webpack.config.js');

function cp() {
  return src(['src/**/*.*', '!src/**/*.ts'])
    .pipe(dest('dist'));
}

function webpack() {
  return webpackStream(webpackConfig)
    .pipe(dest('dist'));
}

function outputChecksum() {
  return gulp.src(['dist/**/*.*'])
    .pipe(hashsum({
      dest: 'hashsum',
      filename: 'hashsum.json',
      json: true,
    }));
}

const build = parallel(
  webpack,
  cp,
);

exports.remote = series(
  build,
  outputChecksum,
);

exports.cp = cp;
exports.webpack = webpack;
exports.default = build;
