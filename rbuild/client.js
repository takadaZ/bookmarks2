/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require('node-fetch');
const { src } = require('gulp');
const hashsum = require('gulp-hashsum');
const fs = require('fs');
const { pipeToP } = require('./server');

function outputHashsum() {
  return src('dist/**/*.*')
    .pipe(hashsum({
      dest: './hashsum',
      filename: 'hashsum.json',
      // stream: true,
      json: true,
    }));
}

function req(host, port, command, body) {
  // const agent = new http.Agent({ keepAlive: true });
  const url = new URL(`http://${host}:${port}/${command}`);
  return fetch(url, {
    // agent,
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
}

function start() {
  return async () => {
    const [,, host, port, command] = process.argv;
    const portNumber = Number(port);

    if (host != null && Number.isInteger(portNumber)) {
      await pipeToP(outputHashsum);
      const localHashsum = await new Promise((resolve, reject) => {
        fs.readFile('./hashsum/hashsum.json', (err, buf) => {
          if (err) {
            reject(err.message);
          }
          resolve(buf);
        });
      });
      const res = await req(host, portNumber, command, localHashsum);
      if (!res.ok) {
        const message = await res.text();
        console.log(res.status, message);
        return;
      }
      switch (command) {
        case 'build': {
          const json = await res.json();
          console.log(json);
          break;
        }
        default:
      }
    }
  };
}

start()();
