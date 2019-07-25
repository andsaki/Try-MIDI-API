const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/scripts/midi.js',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'eslint-loader',
        options: {
          fix: true
        }
      },
      {
        // 拡張子 .js の場合
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          {
            // Babel を利用する
            loader: 'babel-loader',
            // Babel のオプションを指定する
            options: {
              presets: [
                // プリセットを指定することで、ES2018 を ES5 に変換
                '@babel/preset-env'
                // React の JSX を解釈
                //'@babel/react'
              ]
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpg|png)$/,
        loader: 'url-loader'
      }
    ]
  },
  plugins: [
    new UglifyJSPlugin(),
    new HtmlWebpackPlugin({
      template: './src/midi.html'
    }),
    new StyleLintPlugin({
      configFile: '.stylelintrc'
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  devServer: {
    port: 8000,
    historyApiFallback: true
  }
};
