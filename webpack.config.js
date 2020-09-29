const CopyPlugin = require('copy-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
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
        use: 'ts-loader',
      },
      // {
      //   test: /\.css$/,
      //   use: [
      //     'style-loader',
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         // オプションでCSS内のurl()メソッドの取り込みを禁止する
      //         url: false,
      //         sourceMap: enabledSourceMap,
      //       },
      //     },
      //   ],
      // },
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
            ],
          },
        },
      ],
    }),
  ],
};
