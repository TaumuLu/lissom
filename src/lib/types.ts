export interface IOptions {
  // isSpa?: boolean
  output?: string
  excludeRouteRegs?: Array<RegExp | string>
  excludeStaticRegs?: Array<RegExp | string>
  purgeModuleRegs?: Array<RegExp | string>
  dir?: string
  dev?: boolean
  staticMarkup?: boolean
  generateEtags?: boolean
  quiet?: boolean
  requireModules?: string[]
  ignoreModules?: string[]
  clientRender?: boolean
  serverRender?: boolean
  // entry?: string
  defaultEntry?: string
  rootAttr?: { [attr: string]: string }
  errorHtml?: string
  isBase64?: boolean
}

export interface IConfig extends IOptions {
  outputDir?: string // auto generate
  errorHtmlPath?: string
}

export interface IRegConfig {
  excludeRouteReg: RegExp
  purgeModuleReg: RegExp
  excludeStaticReg: RegExp
}

export interface IRouter {
  assets: string[]
  chunks: string[]
  existsAts: string[]
  name: string
  size: number
}

export interface IRouters {
  [router: string]: IRouter
}

export interface IHtmlWebpackPlugin {
  assetJson: string[]
  filename: string
}

export interface IModules {
  [module: string]: {
    issuerId: string
    name: string
  }
}

export interface IChunks {
  [chunk: string]: {
    entry: boolean
    files: string[]
    hash: string
    initial: boolean
    names: string[]
  }
}

export interface IEntrypoints {
  [entry: string]: {
    chunks: string[]
    assets: string[]
    children: any
    childAssets: any
  }
}

export interface IQuery {
  [key: string]: string
}

export interface ICtx {
  error?: any
  req: any
  res: any
  pathname: string
  query: IQuery
  asPath: string
  location: ILocation
  navigator: INavigator
}

export interface IssRData {
  props: any
  asyncProps: any
  pathname: string
  clientRender?: boolean
  serverRender?: boolean
  rootAttr: IConfig['rootAttr']
  isBase64?: boolean
  publicPath?: string
}

export interface ILocation {
  hash: string
  href: string
  host: string
  hostname: string
  origin: string
  pathname: string
  port: string
  protocol: string
  search: string
}

export interface INavigator {
  userAgent: string
  language: string
}

export interface INode {
  tagName?: string
  attribs?: {
    [attr: string]: string
  }
  children?: any
}

export type INodes = INode[]
