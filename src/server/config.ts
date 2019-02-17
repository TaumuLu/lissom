import findUp from 'find-up';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { defaultConfig } from '../lib/config';
import { ASSETS_MANIFEST, RUNTIME_NAME } from '../lib/constants';
import { fileterJsAssets, log, printAndExit } from './lib/utils';
import { setWebpackConfig } from './lib/webpack-runtime';

class Config {
  private _isCheck: boolean;
  private _config: any;
  private _assetsConfig: any;
  constructor() {
    this._config = { ...defaultConfig };
  }

  public setAssetsConfig() {
    this._assetsConfig = parseAssetsManifest(this._config);
    setWebpackConfig(this._assetsConfig);
  }

  public getAssetsConfig() {
    return this._assetsConfig;
  }

  public check() {
    this._isCheck = true;
    const { dev, outputDir } = this._config;
    if (!existsSync(outputDir)) {
      printAndExit(
        `> No such directory exists as the project root: ${outputDir}`
      );
    }
    // dev模式下解析资源文件延迟执行
    if (dev) {
      this.setAssetsConfig();
    }
  }

  public init(options) {
    const { dev, dir, output } = this.set(options);
    if (!output) {
      printAndExit('> "output" config is required');
    }
    const outputDir = resolve(output);
    this.set({ outputDir, dir: resolve(dir) });
    if (!dev) {
      this.check();
      this.setAssetsConfig();
    }
    log('init config', JSON.stringify(this._config));

    return this._config;
  }

  public get() {
    if (!this._isCheck) this.check();

    return this._config;
  }

  public set(options) {
    this._config = { ...this._config, ...options };
    return this._config;
  }
}

export default new Config();

const parseAssetsManifest = config => {
  const { entry, outputDir } = config;
  const assetsManifestPath = findUp.sync(ASSETS_MANIFEST, { cwd: outputDir });
  if (!assetsManifestPath || !assetsManifestPath.length) {
    printAndExit('> Your webpack config does not use lissom/webpack wrapping');
  }
  const assetsManifest = require(assetsManifestPath);
  const {
    entrypoints,
    HtmlWebpackPlugin,
    outputPath,
    modules,
    chunks,
  } = assetsManifest;
  const routers = getRouters(entrypoints, outputPath, entry);
  const htmlConfig = getHtmlConfig(HtmlWebpackPlugin, outputPath);

  return {
    routers,
    htmlConfig,
    outputPath,
    modules,
    chunks,
  };
};

const getRouters = (entrypoints, outputPath, entry) => {
  return Object.keys(entrypoints).reduce(
    (p, key, i) => {
      const { chunks, assets: originAssets } = entrypoints[key];
      const assets = fileterJsAssets(originAssets);

      const router = {
        name: key,
        chunks: chunks.filter(name => name !== RUNTIME_NAME),
        assets,
        existsAts: assets.map(path => resolve(outputPath, path)),
        size: assets.length,
      };
      if (i === 0) {
        p._default = router;
      }
      if (key === entry) {
        p.default = router;
      }
      const page = key.charAt(0) === '/' ? key : `/${key}`;

      return {
        ...p,
        [page]: router,
      };
    },
    { default: null, _default: null }
  );
};

const readHtml = existsAt => {
  if (!existsSync(existsAt)) {
    const message = `Could not find a valid html file in the '${existsAt}' path!`;
    printAndExit(message);
  }
  const html = readFileSync(existsAt, 'utf8');
  return html;
};

const getHtmlConfig = (HtmlWebpackPlugin, outputPath) => {
  const [htmlConfig] = HtmlWebpackPlugin;
  const { childCompilationOutputName } = htmlConfig;
  const existsAt = resolve(outputPath, childCompilationOutputName);
  const html = readHtml(existsAt);

  return {
    ...htmlConfig,
    html,
    existsAt,
  };
};
