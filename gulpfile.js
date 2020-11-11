const {
  webpack,
  cp,
  build,
  startServer,
} = require('./rbuild/server');

exports.cp = cp;
exports.webpack = webpack;
exports.startServer = startServer;
exports.default = build;
