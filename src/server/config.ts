import findUp from 'find-up'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { ASSETS_MANIFEST, RUNTIME_NAME } from '../lib/constants'
import {
  IAssetsConfig,
  IConfig,
  IEntrypoints,
  IHtmlWebpackPlugin,
  IOptions,
  IRegConfig,
  IRouters,
} from '../lib/types'
import ParseHtml from './lib/parse-html'
import {
  createReg,
  deleteCache,
  filterJsAssets,
  get,
  getPathName,
  log,
  printAndExit,
} from './lib/utils'
import { setWebpackConfig } from './lib/webpack-runtime'

const _DEV_ = process.env.NODE_ENV !== 'production'
// const suffixRegs = [/\.(html|php)/, /\/[^.]*/];

const defaultConfig: IConfig = {
  output: './public',
  outputDir: undefined,
  excludeRouteRegs: [/\/api\/.*/],
  excludeStaticRegs: [],
  purgeModuleRegs: [/node_modules\/lissom/],
  dir: '.',
  dev: _DEV_,
  staticMarkup: false,
  generateEtags: true,
  quiet: false,
  requireModules: ['superagent', 'react'],
  ignoreModules: ['babel-polyfill'],
  clientRender: true,
  serverRender: true,
  rootAttr: {},
  defaultEntry: undefined,
  errorHtml: '',
  isBase64: false,
}

class Config {
  private _isInit = false
  private _isCheck = false
  private _config: IConfig
  private _assetsConfig!: IAssetsConfig
  private _regConfig!: IRegConfig

  constructor() {
    this._config = { ...defaultConfig }
  }

  public setAssetsConfig() {
    this._assetsConfig = parseAssetsManifest(this._config)
    setWebpackConfig(this._assetsConfig)
  }

  public getAssetsConfig(): IAssetsConfig {
    return this._assetsConfig
  }

  public setRegConfig() {
    const { purgeModuleRegs, excludeRouteRegs, excludeStaticRegs } =
      this._config

    this._regConfig = {
      purgeModuleReg: createReg(purgeModuleRegs),
      excludeRouteReg: createReg(excludeRouteRegs, true),
      excludeStaticReg: createReg(excludeStaticRegs, true),
    }
  }

  public getRegConfig() {
    return this._regConfig
  }

  public check() {
    this._isCheck = true
    const { dev, outputDir = '', errorHtmlPath } = this._config
    if (!existsSync(outputDir)) {
      printAndExit(
        `> No such directory exists as the project root: ${outputDir}`,
      )
    }
    if (errorHtmlPath && !existsSync(errorHtmlPath)) {
      printAndExit(`> No such file path exists: ${errorHtmlPath}`)
    }
    // dev模式下延迟执行解析资源文件
    if (dev) {
      this.setAssetsConfig()
    }
  }

  public init(options: IOptions) {
    const { dev, dir = '', output, errorHtml } = this.set(options)
    if (!output) {
      printAndExit('> "output" config is required')
      return
    }
    const outputDir = resolve(output)
    const errorHtmlPath = errorHtml ? resolve(errorHtml) : errorHtml
    this.set({ outputDir, errorHtmlPath, dir: resolve(dir) })
    this.setRegConfig()
    if (!dev) {
      this.check()
      this.setAssetsConfig()
    }
    log('init config', JSON.stringify(this._config))
    this._isInit = true
    return this._config
  }

  public mode() {
    if (!this._isInit) {
      printAndExit(
        '> Must initialize the configuration, execute "new Server(config)"',
      )
    }
    const { dev } = this._config
    // 开发模式下每次请求进入都重新验证读取配置
    if (dev) {
      this._isCheck = false
    }
  }

  public get(): IConfig
  public get<K extends keyof IConfig>(K: string): IConfig[K]
  public get(key?: string) {
    if (key) return this._config[key]
    if (!this._isCheck) this.check()

    return this._config
  }

  public set(options: IConfig) {
    const { _config } = this
    // 合并操作
    const purgeModuleRegs = _config.purgeModuleRegs!.concat(
      get(options, 'purgeModuleRegs', []),
    )
    this._config = { ..._config, ...options, purgeModuleRegs }

    return this._config
  }
}

export default new Config()

const parseAssetsManifest = (config: IConfig): IAssetsConfig => {
  const { dev, defaultEntry, outputDir, errorHtmlPath } = config
  const assetsManifestPath = findUp.sync(ASSETS_MANIFEST, { cwd: outputDir })
  if (!assetsManifestPath || !assetsManifestPath.length) {
    printAndExit('> Your webpack config does not use lissom/webpack wrapping')
  }
  if (dev) {
    deleteCache(assetsManifestPath!)
  }
  const assetsManifest = require(assetsManifestPath!)
  const { entrypoints, HtmlWebpackPlugin, outputPath, modules, chunks } =
    assetsManifest
  const routers = getRouters(entrypoints, outputPath, defaultEntry)
  const parseHtml = getParseHtml(HtmlWebpackPlugin, outputPath)
  const errorHtml = errorHtmlPath ? readHtmlFile(errorHtmlPath) : errorHtmlPath

  return {
    routers,
    parseHtml,
    outputPath,
    modules,
    chunks,
    errorHtml,
  }
}

const getRouters = (
  entrypoints: IEntrypoints,
  outputPath: string,
  defaultEntry?: string,
): IRouters => {
  return Object.keys(entrypoints).reduce(
    (p, key, i) => {
      const { chunks, assets: originAssets } = entrypoints[key]
      const assets = filterJsAssets(originAssets)

      const router = {
        name: key,
        chunks: chunks.filter(name => name !== RUNTIME_NAME),
        assets,
        existsAts: assets.map(path => resolve(outputPath, path)),
        size: assets.length,
      }
      // 默认取第一个入口
      if (i === 0 && !defaultEntry) defaultEntry = key
      if (key === defaultEntry) {
        p.default = router
      }
      const page = getPathName(key)

      return {
        ...p,
        [page]: router,
      }
    },
    { default: null } as any,
  )
}

const readHtmlFile = (existsAt: string): string => {
  if (!existsSync(existsAt)) {
    const message = `Could not find a valid html file in the '${existsAt}' path!`
    printAndExit(message)
  }
  return readFileSync(existsAt, 'utf8')
}

const getParseHtml = (
  HtmlWebpackPlugin: IHtmlWebpackPlugin[],
  outputPath: string,
): ParseHtml => {
  // 默认取第一个插件配置
  const [htmlConfig] = HtmlWebpackPlugin
  const { childCompilationOutputName } = htmlConfig
  const existsAt = resolve(outputPath, childCompilationOutputName)
  const source = readHtmlFile(existsAt)
  const parseHtml = new ParseHtml(source)
  return parseHtml
}
