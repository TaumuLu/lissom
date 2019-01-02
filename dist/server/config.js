"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = require("fs");
const path_1 = require("path");
const constants_1 = require("../lib/constants");
const utils_1 = require("../lib/utils");
const utils_2 = require("./lib/utils");
exports.default = (outputDir) => {
    const assetsManifestPath = find_up_1.default.sync(constants_1.ASSETS_MANIFEST, {
        cwd: outputDir,
    });
    if (!assetsManifestPath || !assetsManifestPath.length) {
        utils_1.printAndExit('> use ssr webpack config');
    }
    const assetsManifest = require(assetsManifestPath);
    const { entrypoints, HtmlWebpackPlugin, outputPath, modules, chunks } = assetsManifest;
    const routers = getRouters(entrypoints, outputPath);
    const htmlConfig = getHtmlConfig(HtmlWebpackPlugin, outputPath);
    return {
        routers,
        htmlConfig,
        outputPath,
        modules,
        chunks,
    };
};
const getRouters = (entrypoints, outputPath) => {
    return Object.keys(entrypoints).reduce((p, key, i) => {
        const { chunks, assets: originAssets } = entrypoints[key];
        const assets = utils_2.fileterJsAssets(originAssets);
        const router = {
            name: key,
            chunks: chunks.filter(name => name !== constants_1.RUNTIME_NAME),
            assets,
            existsAts: assets.map(path => path_1.resolve(outputPath, path)),
            size: assets.length,
        };
        if (i === 0) {
            p.default = router;
        }
        const page = key.charAt(0) === '/' ? key : `/${key}`;
        return Object.assign({}, p, { [page]: router });
    }, { default: null });
};
const getHtmlConfig = (HtmlWebpackPlugin, outputPath) => {
    const [htmlConfig] = HtmlWebpackPlugin;
    const { childCompilationOutputName } = htmlConfig;
    const existsAt = path_1.resolve(outputPath, childCompilationOutputName);
    const html = readHtml(existsAt);
    return Object.assign({}, htmlConfig, { html,
        existsAt });
};
const readHtml = (existsAt) => {
    if (!fs_1.existsSync(existsAt)) {
        throw new Error(`Could not find a valid html file in the '${existsAt}' path!`);
    }
    const html = fs_1.readFileSync(existsAt, 'utf8');
    return html;
};
//# sourceMappingURL=config.js.map