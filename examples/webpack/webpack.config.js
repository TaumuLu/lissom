const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HappyPack = require('happypack');
const ssrWebpack = require('lissom/webpack');

const happyThreadPool = HappyPack.ThreadPool({ size: 2 });

const commonConfig = require('./common.config');

const { isDev, outputPath, ...config } = commonConfig;
const { context } = config;

// 从dll包的原始位置（webpack/build目录下）匹配要插入html的dll文件
const globOptions = { cwd: outputPath };
const vendorAssets = glob.sync('./dll/vendor*.dll.js', globOptions);
const hasDll = vendorAssets.length > 0;

const babelOptions = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: false }],
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-runtime',
  ],
};

const browsers = [
  'last 4 versions',
  'Firefox ESR',
  '> 1%',
  'ie >= 9',
  'Safari >=9',
];
const compassMixinsPath = path.join(require.resolve('compass-mixins'), '..');

module.exports = ssrWebpack({
  ...config,
  entry: './index.js',
  output: {
    path: outputPath,
    filename: isDev
      ? 'assets/scripts/[name].js'
      : 'assets/scripts/[name]-[chunkhash].js',
    chunkFilename: isDev
      ? 'assets/scripts/[name].chunk.js'
      : 'assets/scripts/[name]-[chunkhash].chunk.js',
    publicPath: '/',
    // libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|es6)$/,
        exclude: /node_modules/,
        use: 'happypack/loader?id=babel',
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              allowTsInNodeModules: true,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer({
                  browsers,
                }),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: [compassMixinsPath],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer({
                  browsers,
                }),
              ],
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: {
          loader: 'url-loader',
        },
      },
    ],
  },
  devServer: {
    contentBase: outputPath,
    // compress: true,
    host: '127.0.0.1',
    port: 9966,
    historyApiFallback: true,
    open: true,
    // watchContentBase: true,
    // public: 'frame.terminus.io:80',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/styles/[name].css',
      chunkFilename: 'assets/styles/[id].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: '../public/index.html',
      // hash: true,
      inject: true,
    }),
    hasDll &&
      (new webpack.DllReferencePlugin({
        context,
        manifest: path.join(outputPath, './dll/manifest.json'),
        // name: './../dll',
        // sourceType: 'commonjs2',
      }),
      new HtmlWebpackIncludeAssetsPlugin({
        assets: vendorAssets,
        append: false,
      })),
    new HappyPack({
      id: 'babel',
      loaders: [
        {
          loader: 'babel-loader',
          options: babelOptions,
        },
      ],
      threadPool: happyThreadPool,
      cache: true,
      verbose: true,
    }),
  ].filter(Boolean),
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'common',
    },
    runtimeChunk: {
      name: 'runtime',
    },
  },
});
