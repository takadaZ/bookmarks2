/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const archiver = require('archiver');
const fs = require('fs');
const http = require('http');
const webpackConfig = require('../webpack.config.js');

const archive = archiver('zip', {
  zlib: { level: 9 }, // Sets the compression level.
});

function pipeP(...fns) {
  return (a) => fns.reduce((promise, f) => promise.then(f), Promise.resolve(a));
}

// function cp() {
//   return src(['src/**/*.*', '!src/**/*.ts'])
//     .pipe(dest('dist'));
// }

// function webpack() {
//   return webpackStream(webpackConfig)
//     .pipe(dest('dist'));
// }

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

// function parallel(...fns) {
//   return () => Promise.all(fns.map(pipeToP));
// }

// const build = parallel(cp, webpack);

function webpack(reject) {
  return webpackStream(webpackConfig)
    .on('error', function err(error) {
      this.emit('end');
      reject(error);
    })
    .pipe(src(['src/**/*.*', '!src/**/*.ts']))
    .pipe(dest('dist'))
    .pipe(src('dist/**/*.bundle.js'))
    .pipe(hashsum({
      dest: './',
      filename: 'hashsum.json',
      // stream: true,
      json: true,
    }));
}

async function build() {
  const errBuild = await pipeToP(webpack).catch((reason) => reason);
  if (errBuild) {
    throw errBuild.message;
  }
  const [errHash, buff] = await new Promise((resolve) => {
    fs.readFile('./hashsum.json', (err, buf) => resolve([err, buf]));
  });
  if (errHash) {
    throw errHash.message;
  }
  return JSON.parse(buff);
}

function sorting(req) {
  return async (remoteHash) => {
    let body = '';
    // eslint-disable-next-line no-return-assign
    await pipeToP(() => req.on('data', (chunk) => body += chunk));
    const localHash = JSON.parse(body);
    const removes = Object.keys(localHash).filter((key) => !remoteHash[key]);
    const updates = Object.entries(remoteHash)
      .filter(([key, value]) => localHash[key] !== value)
      .map(([key]) => key);
    return [removes, updates];
  };
}

function startServer() {
  return http.createServer(async (req, res) => {
    switch (req.url) {
      case '/build': {
        pipeP(
          build,
          sorting(req),
          ([, updates]) => {
            updates.forEach((filePath) => {
              archive.file(filePath);
            });
            archive.pipe(res).on('end', () => res.end());
            // res.writeHead(200, { 'Content-Type': 'application/json' });
          },
        )().catch((message) => {
          res.writeHead(500, { 'Content-Type': 'text/plane' });
          res.end(message);
        });
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

// exports.cp = cp;
// exports.webpack = webpack;
// exports.startServer = startServer;
// exports.build = build;
exports.pipeToP = pipeToP;
