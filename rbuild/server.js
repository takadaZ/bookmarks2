/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const archiver = require('archiver');
const fs = require('fs');
const http = require('http');
const webpackConfig = require('../webpack.config.js');

function pipeP(...fns) {
  return (a) => fns.reduce((promise, f) => promise.then(f), Promise.resolve(a));
}

function pipeToP(pipeF) {
  return new Promise((resolve, reject) => (
    pipeF(reject)
      .on('error', reject)
      .on('end', resolve)
  ));
}

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

async function build(localHash) {
  const errBuild = await pipeToP(webpack).catch((reason) => reason);
  if (errBuild) {
    throw errBuild.message;
  }
  const [errHash, remoteHash] = await new Promise((resolve) => {
    fs.readFile('./hashsum.json', (err, buf) => resolve([err, buf]));
  });
  if (errHash) {
    throw errHash.message;
  }
  return [
    JSON.parse(remoteHash),
    JSON.parse(localHash),
  ];
}

function sorting([remoteHash, localHash]) {
  const removes = Object.keys(localHash).filter((key) => !remoteHash[key]);
  const updates = Object.entries(remoteHash)
    .filter(([key, value]) => localHash[key] !== value)
    .map(([key]) => key);
  return [removes, updates];
}

function archive([, updates]) {
  const zip = archiver('zip', {
    zlib: { level: 1 }, // Sets the compression level.
  });
  updates.forEach((filePath) => zip.file(filePath));
  zip.finalize();
  return zip;
}

async function getTextFromStream(strm) {
  let text = '';
  // eslint-disable-next-line no-return-assign
  await pipeToP(() => strm.on('data', (chunk) => text += chunk));
  return text;
}

function startServer() {
  return http.createServer(async (req, res) => {
    switch (req.url) {
      case '/build': {
        pipeP(
          getTextFromStream,
          build,
          sorting,
          archive,
          (zipped) => zipped
            .on('warning', (err) => { throw err; })
            .on('error', (err) => { throw err; })
            .pipe(res),
        )(req).catch((message) => {
          res.writeHead(500, { 'Content-Type': 'text/plane' });
          res.end(message);
        });
        break;
      }
      case '/browsing': {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const html = fs.createReadStream('./rbuild.html', { encoding: 'utf-8' });
        html.pipe(res);
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

exports.pipeToP = pipeToP;
