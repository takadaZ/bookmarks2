/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const {
  src,
  dest,
  parallel,
} = require('gulp');

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
      dest: 'hashsum',
      filename: 'hashsum.json',
      json: true,
    }));
}

const build = parallel(
  webpack,
  cp,
);

function startServer() {
  return http.createServer(async (req, res) => {
    switch (req.url) {
      case '/build':
        await build();
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

if (Number.isInteger(portNumber) && portNumber >= 80 && portNumber <= 65536) {
  const server = startServer();
  server.listen(port);
}

exports.cp = cp;
exports.webpack = webpack;
exports.startServer = startServer;
exports.build = build;
