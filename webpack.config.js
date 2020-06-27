/* eslint-env node */

const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const { version } = require('./package.json')

const { NODE_ENV } = process.env

const PUBLIC_FOLDER = path.resolve(__dirname, 'server', 'public')

module.exports = {
  mode: NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    path: PUBLIC_FOLDER,
    filename: 'bundle.js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { context: './src', from: '*.html' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      version
    }),
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: 'webpack-glsl-loader'
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          NODE_ENV === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  devtool: 'source-map',
  devServer: {
    contentBase: PUBLIC_FOLDER
  }
}
