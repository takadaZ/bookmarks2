'use strict';

const { src, dest, series } = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');
const webpack = require('webpack-stream');

const webpackConfig = require('./webpack.config.js');

function webPack() {
  return src([`./src/**/*.tsx`])
    .pipe(webpack(webpackConfig))
    .pipe(dest(`./dist`));
}

function cp() {
  return src('src/*.*')
    .pipe(dest('dist'));
}

function clean(cb){
  return del(['dist'], cb);
}

const build = series(
  clean,
  webPack,
  cp
)

exports.default = exports.prd = build;
