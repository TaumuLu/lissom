export type ReactComp<P = {}> = React.ComponentClass<P> | React.SFC<P>;

export interface IConfig {
  isSpa?: boolean;
  output?: string;
  outputDir?: string;
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
  routers: any;
  entryNames: string[];
  htmlConfig: any;
  outputPath: string;
  modules: any;
  chunks: any;
}
