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

function pipeToP(stream) {
  return new Promise((resolve, reject) => (
    stream(reject)
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
    // console.log(req.url);
    switch (req.url) {
      case '/build': {
        const errBuild = await pipeToP(rbuild).catch((reason) => reason);
        if (errBuild) {
          return respError(res, errBuild.message);
        }
        const [errHash, remoteHash] = await new Promise((resolve) => {
          fs.readFile('./hashsum/hashsum.json', (err, buf) => resolve([err, buf]));
        });
        if (errHash) {
          return respError(res, errHash.message);
        }
        let body = '';
        // eslint-disable-next-line no-return-assign
        await pipeToP(req.on('data', (chunk) => body += chunk));
        const localHash = JSON.parse(body);
        const entries = Object.entries(localHash);
        const removes = entries.filter(([key]) => !remoteHash[key]);
        const updates = entries.filter(([key, value]) => remoteHash[key] !== value);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ updates, removes }));
        // const hashsumJson = fs.createReadStream('./hashsum/hashsum.json', { encoding: 'utf-8' });
        // hashsumJson.pipe(res);
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
// exports.rbuild = rbuild;
exports.pipeToP = pipeToP;
