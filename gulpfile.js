const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');
const { pipeToP } = require('./rbuild/server');
// function series(f1, ...fns) {
//   return fns.reduce((acc, f) => acc.then(f), f1());
// }

function parallel(...fns) {
  return () => Promise.all(fns.map(pipeToP));
}

function cp() {
  return src(['src/**/*.*', '!src/**/*.ts'])
    .pipe(dest('dist'));
}

function webpack() {
  return webpackStream(webpackConfig)
    .pipe(dest('dist'));
}

const build = parallel(cp, webpack);

exports.cp = cp;
exports.webpack = webpack;
exports.default = build;

// test!

const util = require('util');
const filter = require('gulp-filter');
const through2 = require('through2');
const Vinyl = require('vinyl');

async function getTextFromStream(strm) {
  let text = '';
  // eslint-disable-next-line no-return-assign
  await pipeToP(() => strm.on('data', (chunk) => text += chunk));
  return text;
}

function hook(vinyl, enc, done) {
  console.log(vinyl);
  this.push(vinyl);
  done();
}

const file1 = new Vinyl({
  cwd: '/',
  base: '/src/',
  path: '/src/file.js',
  contents: Buffer.from('var x = 123'),
});

exports.test = async () => {
  // console.log(file1);
  const source = src(['src/**/*.*', '!src/**/*.ts', '!src/**/*.scss'])
    .pipe(filter(['**/*.html']))
    .pipe(through2.obj(function aa(vinyl, a2, done) {
      this.push(vinyl);
      done();
    }, function es(cb) {
      this.push(file1);
      cb();
    }))
    .pipe(through2.obj(hook));
    // .pipe(dest('./'));
  // const text = await getTextFromStream(source);
  // console.log(util.inspect(text, { depth: null }));
  return source;
};
