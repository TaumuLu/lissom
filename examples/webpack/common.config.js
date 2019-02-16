const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';
const context = process.cwd();
const folderName = './build';
const outputPath = path.join(context, folderName);

module.exports = {
  isDev,
  context,
  outputPath,
  mode: isDev ? 'development' : 'production',
  // devtool: isDev ? 'cheap-module-eval-source-map' : 'cheap-module-source-map',
  // mode: 'none',
  devtool: 'source-map',
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    modules: [path.join(context, 'web_modules/node_modules'), 'node_modules'],
    extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx'],
  },
};
