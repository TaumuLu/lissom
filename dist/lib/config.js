"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkOnlyConfig = {
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
};
const _DEV_ = process.env.NODE_ENV !== 'production';
exports.defaultConfig = {
    isSpa: true,
    output: './public',
    excludePathRegs: [/\/api\/.*/],
    excludeModuleRegs: [/node_modules/],
    dir: '.',
    dev: _DEV_,
    staticMarkup: false,
    generateEtags: true,
    quiet: false,
    requireModules: ['superagent'],
    excludeModules: ['babel-polyfill'],
    clientRender: true,
};
//# sourceMappingURL=config.js.map