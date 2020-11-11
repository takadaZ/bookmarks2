/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const http = require('http');

(async () => {
  function request(host, port, path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        host,
        port,
        path,
        method: 'POST',
      }, (res) => {
        res.resume();
        res.on('data', (chunk) => {
          resolve(chunk);
        });
        res.on('end', () => {
          if (!res.complete) {
            reject('The connection was terminated while the message was still being sent');
          }
        });
      });
      req.on('error', (e) => {
        reject(`problem with request: ${e.message}`);
      });
    });
  }

  const [,, host, port] = process.argv;
  const portNumber = Number(port);

  if (host != null && Number.isInteger(portNumber)) {
    const result = await request(host, portNumber, '/build').catch(console.error.bind(console));
    if (result !== 'ok') {
      return false;
    }
  }
})();
