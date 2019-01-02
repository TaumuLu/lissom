"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./lib/utils");
const webpack_runtime_1 = require("./webpack-runtime");
const requirePage = (router, dev) => {
    const { existsAts, size } = router;
    webpack_runtime_1.clearModuleCache(dev);
    return existsAts.reduce((p, assetPath, i) => {
        if (dev) {
            utils_1.deleteCache(assetPath);
        }
        const executeModule = require(assetPath);
        if (i === size - 1) {
            return executeModule;
        }
        return p;
    }, null);
};
exports.requirePage = requirePage;
const getRouter = (page, routers) => {
    return routers[page] || routers.default;
};
exports.getRouter = getRouter;
function purgeCache(moduleName, excludeModules) {
    const modPath = require.resolve(moduleName);
    searchCache(modPath, utils_1.deleteCache, excludeModules);
    const mConstructor = module.constructor;
    Object.keys(mConstructor._pathCache).forEach((cacheKey) => {
        if (cacheKey.indexOf(moduleName) > 0) {
            delete mConstructor._pathCache[cacheKey];
        }
    });
}
exports.purgeCache = purgeCache;
function searchCache(modPath, callback, excludeModules = []) {
    const mod = modPath && require.cache[modPath];
    if (mod !== undefined) {
        (function traverse(mod) {
            const id = mod.id;
            const isExclude = excludeModules.some(exmod => id.includes(exmod));
            if (!isExclude) {
                mod.children.forEach((child) => {
                    traverse(child);
                });
            }
            callback(mod.id);
        }(mod));
    }
}
//# sourceMappingURL=require.js.map