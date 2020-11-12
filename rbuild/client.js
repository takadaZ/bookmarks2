/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const request = require('request');

(async () => {
  function req(host, port, command) {
    // const agent = new http.Agent({ keepAlive: true });
    // options.agent = keepAliveAgent;
    const url = new URL(`http://${host}:${port}/${command}`);
    // const path = `/${command}`;
    return new Promise((resolve, reject) => {
      request(url, {
        // host,
        // port,
        // path,
        // agent,
        method: 'POST',
      }, (err, res, body) => {
        if (body === 'ok') {
          resolve(body);
        }
        reject(res.statusCode);
        // res.resume();
        // res.on('data', (chunk) => {
        //   resolve(chunk);
        // });
        // res.on('end', () => {
        //   if (!res.complete) {
        //     reject('The connection was terminated while the message was still being sent');
        //   }
        // });
      });
      // req.on('error', (e) => {
      //   reject(`problem with request: ${e.message}`);
      // });
    });
  }

  const [,, host, port, command] = process.argv;
  const portNumber = Number(port);

  if (host != null && Number.isInteger(portNumber)) {
    const result = await req(host, portNumber, command).catch(console.error.bind(console));
    if (result !== 'ok') {
      return false;
    }
  }
})();
