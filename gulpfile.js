/* eslint-disable import/no-unresolved */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const webpackConfig = require('./webpack.config.js');
const { pipeToP } = require('./rbuild/server');

function parallel(...fns) {
  return () => Promise.all(fns.map(pipeToP));
}

function cp() {
  return src(['src/**/*.*', '!src/**/*.ts', '!src/**/*.scss'])
    .pipe(dest('dist'));
}

function webpack() {
  return webpackStream(webpackConfig)
    .pipe(dest('dist'));
}

function scss() {
  return src('src/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('dist'));
}

const build = parallel(cp, webpack, scss);

exports.cp = cp;
exports.scss = scss;
exports.webpack = webpack;
exports.default = build;
