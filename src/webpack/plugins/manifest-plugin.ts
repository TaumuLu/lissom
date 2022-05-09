import { RawSource } from 'webpack-sources'

import { ASSETS_MANIFEST, HTML_WEBPACK_PLUGIN } from '../../lib/constants'

const chunkOnlyConfig = {
  assets: false,
  cached: true,
  children: false,
  chunks: true,
  chunkModules: false,
  chunkOrigins: false,
  errorDetails: false,
  hash: false,
  modules: true,
  reasons: false,
  source: false,
  timings: false,
  // version: false,
}

export default class ManifestPlugin {
  // getCssChunkObject(mainChunk) {
  //   const obj = {}
  //   for (const chunk of mainChunk.getAllAsyncChunks()) {
  //     for (const module of chunk.modulesIterable) {
  //       if (module.type.includes('mini-css-extract-plugin')) {
  //         obj[chunk.id] = 1
  //         break
  //       }
  //     }
  //   }
  //   return obj
  // }

  public apply(compiler) {
    // compiler.hooks.thisCompilation.tap('CssChunkPlugin', (compilation) => {
    //   const { mainTemplate } = compilation
    //   mainTemplate.hooks.requireEnsure.tap('CssChunkPluginMap', (source, chunk) => {
    //     const chunkMap = this.getCssChunkObject(chunk)
    //     return source
    //   })
    // })
    compiler.hooks.emit.tap('ManifestPlugin', compilation => {
      const {
        options: { plugins = [] },
        context,
      } = compiler
      // 输出打包清单供服务端使用
      const stats = compilation.getStats().toJson(chunkOnlyConfig)

      stats.context = context
      stats.assets = Object.keys(compilation.assets)
      stats[HTML_WEBPACK_PLUGIN] = []
      stats.chunks = stats.chunks.reduce((p, chunk) => {
        const { id, entry, initial, names, files, hash } = chunk
        return {
          ...p,
          [id]: {
            entry,
            initial,
            names,
            files,
            hash,
          },
        }
      }, {})
      stats.modules = stats.modules.reduce((p, module) => {
        const { id, name, issuerId } = module
        return {
          ...p,
          [id]: {
            name,
            issuerId,
          },
        }
      }, {})

      plugins.map(plugin => {
        const {
          constructor: { name },
        } = plugin
        if (name === HTML_WEBPACK_PLUGIN) {
          const { childCompilationOutputName, assetJson } = plugin
          stats[HTML_WEBPACK_PLUGIN].push({
            childCompilationOutputName, // 输出html文件目录
            assetJson,
          })
        }

        return {
          constructor: name,
          ...plugin,
        }
      })
      compilation.assets[ASSETS_MANIFEST] = new RawSource(
        JSON.stringify(stats, null, 2),
      )
      // compilation.assets[CONFIG_MANIFEST] = new RawSource(JSON.stringify({ ...options, plugins }, null, 2))
    })
  }
}
