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
  elementId?: string;
  entry?: string;
}

export interface IAssetsConfig {
  routers: IRouters;
  entryNames: string[];
  htmlConfig: IHtmlConfig;
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

export interface IHtmlConfig extends IHtmlWebpackPlugin {
  existsAt: string;
  html: string;
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
