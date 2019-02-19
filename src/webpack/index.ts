import HtmlWebpackPlugin from 'html-webpack-plugin';
import { join } from 'path';
import { JSONP_FUNCTION, RUNTIME_NAME } from '../lib/constants';
import { ChunksPlugin, ManifestPlugin, PagesPlugin } from './plugins';
import { getEntry, isMissHtmlPlugin, log, prepareOptions } from './utils';

const entries = [join(__dirname, '../client/index.js')];

export default config => {
  return (...params) => {
    const options = prepareOptions(config, ...params);
    const { entry } = options;

    options.output.libraryTarget = 'umd';
    options.output.libraryExport = 'default';
    options.output.umdNamedDefine = true;
    options.output.jsonpFunction = JSONP_FUNCTION;
    if (!options.optimization) options.optimization = {};

    // 拆分出webpack运行时，避免污染js chunks
    options.optimization.runtimeChunk = {
      name: RUNTIME_NAME,
    };
    // 便于服务端查询模块，现已不需要了
    // options.optimization.namedModules = true
    // options.optimization.namedChunks = true
    // options.optimization.moduleIds = 'named'

    // 添加支持服务端webpack插件
    options.plugins.push(
      new ChunksPlugin(),
      new PagesPlugin(),
      new ManifestPlugin()
    );
    // 必须要有html-webpack-plugin插件，没有使用默认的
    if (isMissHtmlPlugin(options.plugins)) {
      log.yellow(
        '[lissom] > Your webpack config missing "html-webpack-plugin" plugin use lissom default plugin'
      );
      options.plugins.unshift(
        new HtmlWebpackPlugin({
          filename: 'lissom.html',
        })
      );
    }
    // 打入客户端挂载执行文件
    options.entry = getEntry(entries, entry);

    return options;
  };
};
