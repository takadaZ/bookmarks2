/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const fetch = require('node-fetch');

function req(host, port, command) {
  // const agent = new http.Agent({ keepAlive: true });
  const url = new URL(`http://${host}:${port}/${command}`);
  return fetch(url, {
    // agent,
    method: 'POST',
  });
}

function start() {
  return async () => {
    const [,, host, port, command] = process.argv;
    const portNumber = Number(port);

    if (host != null && Number.isInteger(portNumber)) {
      const res = await req(host, portNumber, command);
      if (!res.ok) {
        const message = await res.text();
        console.log(res.status, message);
        return;
      }
      switch (command) {
        case 'build': {
          const hashsum = await res.json();
          console.log(hashsum);
          break;
        }
        default:
      }
    }
  };
}

start()();
