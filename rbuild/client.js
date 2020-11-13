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

(async () => {
  const [,, host, port, command] = process.argv;
  const portNumber = Number(port);

  if (host != null && Number.isInteger(portNumber)) {
    const res = await req(host, portNumber, command);
    if (!res.ok) {
      console.log(res.status, res.statusText);
      return false;
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
})();
