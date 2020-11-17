/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const fs = require('fs');
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

// function outputChecksum() {
//   return src(['dist/**/*.*'])
//     .pipe(hashsum({
//       dest: './hashsum',
//       filename: 'hashsum.json',
//       stream: true,
//       json: true,
//     }));
// }

function pipeToP(pipeF) {
  return new Promise((resolve, reject) => (
    pipeF(reject)
      .on('error', reject)
      .on('end', resolve)
  ));
}

// function series(f1, ...fns) {
//   return fns.reduce((acc, f) => acc.then(f), f1());
// }

function parallel(...fns) {
  return () => Promise.all(fns.map(pipeToP));
}

const build = parallel(cp, webpack);

function rbuild(reject) {
  return webpackStream(webpackConfig)
    .on('error', function err(error) {
      this.emit('end');
      reject(error);
    })
    .pipe(src(['src/**/*.*', '!src/**/*.ts']))
    .pipe(dest('dist'))
    .pipe(src('dist/**/*.bundle.js'))
    .pipe(hashsum({
      dest: './hashsum',
      filename: 'hashsum.json',
      // stream: true,
      json: true,
    }));
}

function respError(res, message) {
  res.writeHead(500, { 'Content-Type': 'text/plane' });
  res.end(message);
}

function startServer() {
  return http.createServer(async (req, res) => {
    switch (req.url) {
      case '/build': {
        const errBuild = await pipeToP(rbuild).catch((reason) => reason);
        if (errBuild) {
          return respError(res, errBuild.message);
        }
        const [errHash, buff] = await new Promise((resolve) => {
          fs.readFile('./hashsum/hashsum.json', (err, buf) => resolve([err, buf]));
        });
        if (errHash) {
          return respError(res, errHash.message);
        }
        const remoteHash = JSON.parse(buff);
        let body = '';
        // eslint-disable-next-line no-return-assign
        await pipeToP(() => req.on('data', (chunk) => body += chunk));
        const localHash = JSON.parse(body);
        const removes = Object.keys(localHash).filter((key) => !remoteHash[key]);
        const updates = Object.entries(remoteHash)
          .filter(([key, value]) => localHash[key] !== value);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ updates, removes }));
        break;
      }
      default:
        console.error(req.url);
    }
    return true;
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
exports.pipeToP = pipeToP;
