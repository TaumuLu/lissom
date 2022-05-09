const path = require('path')

const isDev = process.env.NODE_ENV !== 'production'
const context = process.cwd()
const folderName = './build'
const outputPath = path.join(context, folderName)

module.exports = {
  isDev,
  context,
  outputPath,
  mode: isDev ? 'development' : 'production',
  // devtool: isDev ? 'cheap-module-eval-source-map' : 'cheap-module-source-map',
  devtool: 'source-map',
  resolve: {
    alias: {},
    modules: [path.join(context, 'web_modules/node_modules'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
}
