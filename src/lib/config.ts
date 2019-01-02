export const chunkOnlyConfig = {
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

const _DEV_ = process.env.NODE_ENV !== 'production'

export const defaultConfig = {
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
}
