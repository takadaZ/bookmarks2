/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
const CopyPlugin = require('copy-webpack-plugin');
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
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '**/*',
          to: './',
          context: 'src',
          globOptions: {
            ignore: [
              '**/*.ts',
              '**/*.scss',
            ],
          },
        },
      ],
    }),
  ],
};
