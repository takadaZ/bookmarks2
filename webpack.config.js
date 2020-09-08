const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const MODE = "development";

const enabledSourceMap = MODE === "development";

module.exports = {
  mode: MODE,
  entry: {
    popup: './src/index.ts',
    bkg: './src/background.ts',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // オプションでCSS内のurl()メソッドの取り込みを禁止する
              url: false,
              sourceMap: enabledSourceMap
            },
          },
        ],
      },
    ],
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
