/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies

const fetch = require('node-fetch');
const { src } = require('gulp');
const hashsum = require('gulp-hashsum');
const unzipper = require('unzipper');
const filter = require('gulp-filter');
const through2 = require('through2');

const { pipeToP, pipeP, gulpThrough } = require('./server');

function makeHashsum(gulpStream) {
  return gulpStream
    .pipe(hashsum({
      dest: './',
      filename: 'hashsum.json',
      stream: true,
      json: true,
    }))
    .pipe(filter('**/hashsum.json'));
}

function getHashsum(gulpStream) {
  return new Promise((resolve) => (
    gulpStream.pipe(through2.obj(gulpThrough((vinyl) => resolve(vinyl.contents))))
  ));
}

function req(host, port, command) {
  return (body) => {
    // const agent = new http.Agent({ keepAlive: true });
    const url = new URL(`http://${host}:${port}/${command}`);
    return fetch(url, {
      // agent,
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

async function start() {
  const [,, host, port, command] = process.argv;
  const portNumber = Number(port);

  if (host != null && Number.isInteger(portNumber)) {
    const res = await pipeP(
      makeHashsum,
      getHashsum,
      req(host, portNumber, command),
    )(src('dist/**/*.*'));
    if (!res.ok) {
      const message = await res.text();
      console.log(res.status, message);
      return;
    }
    switch (command) {
      case 'build':
        // await pipeToP(() => (
        //   res.body.pipe(unzipper.Parse())
        //     .on('entry', (entry) => console.log(entry.path))
        // ));
        await pipeToP(() => res.body.pipe(unzipper.Extract({ path: './' })));
        console.log('done!');
        break;
      case 'test': {
        const html = await res.text();
        console.log(html);
        break;
      }
      default:
    }
  }
}

(async () => {
  await start();
})();
