import ParseHtml from '../server/lib/parse-html';

export type ReactComp<P = {}> = React.ComponentClass<P> | React.SFC<P>;

export interface IConfig {
  isSpa?: boolean;
  output?: string;
  outputDir?: string; // auto generate
  excludeRouteRegs?: Array<RegExp | string>;
  purgeModuleRegs?: Array<RegExp | string>;
  dir?: string;
  dev?: boolean;
  staticMarkup?: boolean;
  generateEtags?: boolean;
  quiet?: boolean;
  requireModules?: string[];
  ignoreModules?: string[];
  clientRender?: boolean;
  rootAttr?: { [attr: string]: string };
  entry?: string;
}

export interface IAssetsConfig {
  routers: IRouters;
  parseHtml: ParseHtml;
  outputPath: string;
  modules: IModules;
  chunks: IChunks;
}

export interface IRouters {
  [router: string]: {
    assets: string[];
    chunks: string[];
    existsAts: string[];
    name: string;
    size: number;
  };
}

export interface IHtmlWebpackPlugin {
  assetJson: string[];
  childCompilationOutputName: string;
}

export interface IModules {
  [module: string]: {
    issuerId: string;
    name: string;
  };
}

export interface IChunks {
  [chunk: string]: {
    entry: boolean;
    files: string[];
    hash: string;
    initial: boolean;
    names: string[];
  };
}

export interface IEntrypoints {
  [entry: string]: {
    chunks: string[];
    assets: string[];
    children: any;
    childAssets: any;
  };
}
