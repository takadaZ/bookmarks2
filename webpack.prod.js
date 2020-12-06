/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */

const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup.ts',
    background: './src/redux-provider.ts',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
};
