/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const http = require('http');
const webpackConfig = require('../webpack.config.js');

function cp() {
  return src(['src/**/*.*', '!src/**/*.ts'])
    .pipe(dest('dist'));
}

function webpack() {
  return webpackStream(webpackConfig)
    .pipe(dest('dist'));
}

function outputChecksum() {
  return src(['dist/**/*.*'])
    .pipe(hashsum({
      dest: './rbuild/hashsum',
      filename: 'hashsum.json',
      json: true,
    }));
}

function pipeToP(pipeF) {
  return new Promise((resolve) => pipeF().on('end', resolve));
}

function series(f1, ...fns) {
  return fns.reduce((acc, f) => acc.then(f), f1());
}

function parallel(...fns) {
  return () => Promise.all(fns.map(pipeToP));
}

const build = parallel(cp, webpack);

function rbuild() {
  return series(
    build,
    () => pipeToP(outputChecksum),
  );
}

function startServer() {
  return http.createServer(async (req, res) => {
    // console.log(req.url);
    switch (req.url) {
      case '/build':
        await rbuild();
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        break;
      default:
        console.error(req.url);
    }
  });
}

const [,, port] = process.argv;
const portNumber = Number(port);

if (Number.isInteger(portNumber) && portNumber >= 80 && portNumber <= 65535) {
  const server = startServer();
  server.listen(portNumber);
}

exports.cp = cp;
exports.webpack = webpack;
exports.startServer = startServer;
exports.build = build;
exports.rbuild = rbuild;
