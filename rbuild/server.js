/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { src, dest } = require('gulp');
const webpackStream = require('webpack-stream');
const hashsum = require('gulp-hashsum');
const filter = require('gulp-filter');
const fs = require('fs');
// const stream = require('stream');
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
  return new Promise((resolve) => pipeF().on('end', resolve));
}

// function series(f1, ...fns) {
//   return fns.reduce((acc, f) => acc.then(f), f1());
// }

function parallel(...fns) {
  return () => Promise.all(fns.map(pipeToP));
}

const build = parallel(cp, webpack);

function rbuild() {
  return webpackStream(webpackConfig)
    .pipe(src(['src/**/*.*', '!src/**/*.ts']))
    .pipe(dest('dist'))
    .pipe(hashsum({
      dest: './hashsum',
      filename: 'hashsum.json',
      stream: true,
      json: true,
    }))
    .pipe(filter('**/hashsum.json'));
  // return series(
  //   build,
  //   () => pipeToP(outputChecksum),
  // );
}

// const buftrans = new stream.Transform({
//   transform(chunk, encoding, callback) {
//     callback(null, chunk);
//   },
// });

function startServer() {
  return http.createServer(async (req, res) => {
    // console.log(req.url);
    switch (req.url) {
      case '/build': {
        // await pipeToP(rbuild);
        // const [err, buf] = await new Promise((resolve) => {
        //   fs.readFile('./hashsum/hashsum.json', (err, buf) => resolve([err, buf]));
        // });
        // if (err) {
        //   res.writeHead(200, { 'Content-Type': 'text/plane' });
        //   res.end(err);
        //   return;
        // }
        // res.writeHead(200, { 'Content-Type': 'application/json' });
        // res.end(buf);
        const chunks = [];
        rbuild()
          // eslint-disable-next-line no-return-assign
          .on('data', (chunk) => chunks.push(chunk))
        // buftrans.on('data', (chunk) => res.write(chunk));
          .on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log(JSON.stringify(chunks));
            const result = Buffer.concat(chunks);
            // res.end(JSON.stringify(chunks));
            res.end(result);
          })
          .on('error', () => {
            res.writeHead(200, { 'Content-Type': 'text/plane' });
            res.end('{ "test": "AAA" }');
          });
        // res.write('{ "test": "AAA" }');
        // hashStream.pipe(res);
        // .on('data', (chunk) => chunks.push(chunk));
        // hashStream.on('data', (chunk) => console.log(chunk));

        // res.write(hash);
        // res.setHeader('Content-Type', 'text/html');
        // res.writeHead(200, { 'Content-Type': 'application/json' });
        // res.end(hash);
        break;
      }
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
// exports.rbuild = rbuild;
