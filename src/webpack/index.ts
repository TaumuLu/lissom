import { join } from 'path'
import { RUNTIME_NAME } from '../lib/constants'
import { ChunksPlugin, ManifestPlugin, PagesPlugin } from './plugins'
import { getEntry, prepareOptions } from './utils'

export default (config) => {
  return (env, argv) => {
    const options = prepareOptions(config, argv)
    const { entry } = options

    // options.output.libraryTarget = 'commonjs2'
    if (!options.optimization) options.optimization = {}

    // 拆分出webpack运行时，避免污染js chunks
    options.optimization.runtimeChunk = {
      name: RUNTIME_NAME,
    }
    // 便于服务端查询模块，现已不需要了
    // options.optimization.namedModules = true
    // options.optimization.namedChunks = true
    // options.optimization.moduleIds = 'named'

    // 添加支持服务端webpack插件
    options.plugins.push(
      new ChunksPlugin(),
      new PagesPlugin(),
      new ManifestPlugin()
    )

    // 打入客户端挂载执行文件
    options.entry = getEntry(
      [join(__dirname, '../client/index.js')],
      entry
    )

    return options
  }
}
