/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
// const CopyPlugin = require('copy-webpack-plugin');
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
      // {
      //   test: /\.s[ac]ss$/i,
      //   use: [
      //     // Creates `style` nodes from JS strings
      //     'style-loader',
      //     // Translates CSS into CommonJS
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         // オプションでCSS内のurl()メソッドの取り込みを禁止する
      //         url: false,
      //         sourceMap: enabledSourceMap,
      //       },
      //     },
      //     // Compiles Sass to CSS
      //     'sass-loader',
      //   ],
      // },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  // plugins: [
  //   new CopyPlugin({
  //     patterns: [
  //       {
  //         from: '**/*',
  //         to: './',
  //         context: 'src',
  //         globOptions: {
  //           ignore: [
  //             '**/*.ts',
  //             '**/*.scss',
  //           ],
  //         },
  //       },
  //     ],
  //   }),
  // ],
  cache: true,
};
