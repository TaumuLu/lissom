const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const autoprefixer = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const lissomWebpack = require('../../webpack')

const commonConfig = require('./common.config')

const { isDev, outputPath, ...config } = commonConfig
const { context } = config

// 从dll包的原始位置（webpack/build目录下）匹配要插入html的dll文件
const globOptions = { cwd: outputPath }
const vendorAssets = glob.sync('./dll/vendor*.dll.js', globOptions)
const hasDll = vendorAssets.length > 0

const hasJsxRuntime = (() => {
  return false
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false
  }

  try {
    require.resolve('react/jsx-runtime')
    return true
  } catch (e) {
    return false
  }
})()

const compassMixinsPath = path.join(require.resolve('compass-mixins'), '..')

const getPostcssLoader = () => {
  return {
    loader: 'postcss-loader',
    options: {
      plugins: [autoprefixer()],
    },
  }
}

module.exports = lissomWebpack({
  ...config,
  entry: {
    app: './index.js',
    error: './error.js',
  },
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
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loader: require.resolve('babel-loader'),
        options: {
          customize: require.resolve(
            'babel-preset-react-app/webpack-overrides',
          ),
          presets: [
            [
              require.resolve('babel-preset-react-app'),
              {
                runtime: hasJsxRuntime ? 'automatic' : 'classic',
              },
            ],
          ],
          plugins: [
            [
              require.resolve('babel-plugin-named-asset-import'),
              {
                loaderMap: {
                  svg: {
                    ReactComponent:
                      '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                  },
                },
              },
            ],
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
          ],
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          // See #6846 for context on why cacheCompression is disabled
          cacheCompression: false,
          compact: !isDev,
        },
      },
      {
        test: /\.less$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          getPostcssLoader(),
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          getPostcssLoader(),
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [compassMixinsPath],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          getPostcssLoader(),
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
    host: '0.0.0.0',
    port: 9966,
    historyApiFallback: true,
    open: true,
    hot: true,
    inline: true,
    disableHostCheck: true,
    // watchContentBase: true,
    // public: 'frame.terminus.io:80',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: '../public/index.html',
      // hash: true,
      inject: true,
    }),
    !isDev &&
      new MiniCssExtractPlugin({
        filename: 'assets/styles/[name].css',
        chunkFilename: 'assets/styles/[id].css',
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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../public'),
          to: outputPath,
          globOptions: {
            ignore: ['*.html'],
          },
        },
      ],
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
})
