/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const fs = require('fs');
const http = require('http');

const { src, dest } = require('gulp');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const archiver = require('archiver');
const filter = require('gulp-filter');
const through2 = require('through2');
const Vinyl = require('vinyl');

const webpackConfig = require('../webpack.config.js');

function pipeP(...fns) {
  return (a) => fns.reduce((promise, f) => promise.then(f), Promise.resolve(a));
}

exports.pipeP = pipeP;

function pipeToP(pipeF) {
  return new Promise((resolve, reject) => (
    pipeF(reject)
      .on('error', reject)
      .on('end', resolve)
  ));
}

exports.pipeToP = pipeToP;

function build(reject) {
  return webpackStream(webpackConfig)
    .on('error', function err(error) {
      this.emit('end');
      reject(error);
    })
    .pipe(src('src/style.scss').pipe(sass().on('error', sass.logError)))
    .pipe(src(['src/**/*.*', '!src/**/*.ts', '!src/**/*.scss']))
    .pipe(dest('dist'));
}

function getHashsum(gulpStraem) {
  return gulpStraem
    .pipe(src('dist/**/*.bundle.js'))
    .pipe(hashsum({
      dest: './',
      filename: 'remote-hashsum.json',
      stream: true,
      json: true,
    }))
    .pipe(filter('**/remote-hashsum.json'));
}

async function getTextFromStream(strm) {
  let text = '';
  // eslint-disable-next-line no-return-assign
  await pipeToP(() => strm.on('data', (chunk) => text += chunk));
  return text;
}

function gulpThrough(option = () => {}) {
  return async function through(vinyl, _, done) {
    await option(vinyl);
    this.push(vinyl);
    done();
  };
}

exports.gulpThrough = gulpThrough;

function addGulpContents(name, contents) {
  return through2.obj(gulpThrough(), function endStream(done) {
    const vinyl = new Vinyl({
      path: name,
      contents,
    });
    this.push(vinyl);
    done();
  });
}

function addRequestStream(request) {
  return (gulpStraem) => (
    gulpStraem.pipe(addGulpContents('local-hashsum.json', request))
  );
}

async function combineHashsums(gulpStraem) {
  const hashsums = {};
  return new Promise((resolve) => {
    // eslint-disable-next-line prefer-arrow-callback
    gulpStraem.pipe(through2.obj(
      gulpThrough(async (vinyl) => {
        const jsonString = await (async () => {
          if (vinyl.isStream()) {
            const contents = await getTextFromStream(vinyl.contents);
            return contents;
          }
          return vinyl.contents;
        })();
        hashsums[vinyl.relative] = JSON.parse(jsonString);
      }),
      (done) => {
        resolve(hashsums);
        done();
      },
    ));
  });
}

function sorting(hashsums) {
  const localHash = hashsums['local-hashsum.json'];
  const remoteHash = hashsums['remote-hashsum.json'];
  const removes = Object.keys(localHash).filter((key) => !remoteHash[key]);
  const updates = Object.entries(remoteHash)
    .filter(([key, value]) => localHash[key] !== value)
    .map(([key]) => key);
  console.info({ updates, removes });
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

function startServer() {
  return http.createServer(async (req, res) => {
    switch (req.url) {
      case '/build': {
        pipeP(
          build,
          getHashsum,
          addRequestStream(req),
          combineHashsums,
          sorting,
          archive,
          (zipped) => zipped
            .on('warning', (err) => { throw err; })
            .on('error', (err) => { throw err; })
            .pipe(res),
        )().catch((err) => {
          res.writeHead(500, { 'Content-Type': 'text/plane' });
          res.end(err.message);
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
