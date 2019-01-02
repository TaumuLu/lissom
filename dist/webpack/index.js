"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const constants_1 = require("../lib/constants");
const plugins_1 = require("./plugins");
const utils_1 = require("./utils");
exports.default = (config) => {
    return (...params) => {
        const options = utils_1.prepareOptions(config, ...params);
        const { entry } = options;
        options.output.libraryTarget = 'umd';
        options.output.libraryExport = 'default';
        options.output.umdNamedDefine = true;
        options.output.jsonpFunction = constants_1.JSONP_FUNCTION;
        if (!options.optimization)
            options.optimization = {};
        // 拆分出webpack运行时，避免污染js chunks
        options.optimization.runtimeChunk = {
            name: constants_1.RUNTIME_NAME,
        };
        // 便于服务端查询模块，现已不需要了
        // options.optimization.namedModules = true
        // options.optimization.namedChunks = true
        // options.optimization.moduleIds = 'named'
        // 添加支持服务端webpack插件
        options.plugins.push(new plugins_1.ChunksPlugin(), new plugins_1.PagesPlugin(), new plugins_1.ManifestPlugin());
        // 打入客户端挂载执行文件
        options.entry = utils_1.getEntry([path_1.join(__dirname, '../client/index.js')], entry);
        return options;
    };
};
//# sourceMappingURL=index.js.map