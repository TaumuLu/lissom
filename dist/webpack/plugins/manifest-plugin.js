"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_sources_1 = require("webpack-sources");
const constants_1 = require("../../lib/constants");
const config_1 = require("../../lib/config");
class ManifestPlugin {
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
    apply(compiler) {
        // compiler.hooks.thisCompilation.tap('CssChunkPlugin', (compilation) => {
        //   const { mainTemplate } = compilation
        //   mainTemplate.hooks.requireEnsure.tap('CssChunkPluginMap', (source, chunk) => {
        //     const chunkMap = this.getCssChunkObject(chunk)
        //     return source
        //   })
        // })
        compiler.hooks.emit.tap('ManifestPlugin', (compilation) => {
            const { options: { plugins = [] }, context } = compiler;
            // 输出打包清单供服务端使用
            const stats = compilation.getStats().toJson(config_1.chunkOnlyConfig);
            stats.context = context;
            stats.assets = Object.keys(compilation.assets);
            stats[constants_1.HTML_WEBPACK_PLUGIN] = [];
            stats.chunks = stats.chunks.reduce((p, chunk) => {
                const { id, entry, initial, names, files, hash } = chunk;
                return Object.assign(p, {
                    [id]: {
                        entry, initial, names, files, hash,
                    },
                });
            }, {});
            stats.modules = stats.modules.reduce((p, module) => {
                const { id, name, issuerId } = module;
                return Object.assign(p, {
                    [id]: {
                        name,
                        issuerId,
                    },
                });
            }, {});
            plugins.map((plugin) => {
                const { constructor: { name } } = plugin;
                if (name === constants_1.HTML_WEBPACK_PLUGIN) {
                    const { childCompilationOutputName, assetJson } = plugin;
                    stats[constants_1.HTML_WEBPACK_PLUGIN].push({
                        childCompilationOutputName,
                        assetJson,
                    });
                }
                return Object.assign({ constructor: name }, plugin);
            });
            compilation.assets[constants_1.ASSETS_MANIFEST] = new webpack_sources_1.RawSource(JSON.stringify(stats, null, 2));
            // compilation.assets[CONFIG_MANIFEST] = new RawSource(JSON.stringify({ ...options, plugins }, null, 2))
        });
    }
}
exports.default = ManifestPlugin;
//# sourceMappingURL=manifest-plugin.js.map