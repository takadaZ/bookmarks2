const {
  webpack,
  cp,
  build,
  startServer,
  rbuild,
} = require('./rbuild/server');

exports.cp = cp;
exports.webpack = webpack;
exports.startServer = startServer;
exports.default = build;
exports.rbuild = rbuild;
