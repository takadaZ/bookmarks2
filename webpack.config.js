/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */

const path = require('path');

const MODE = 'development';

// const enabledSourceMap = MODE === 'development';

module.exports = {
  mode: MODE,
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
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  cache: true,
};
