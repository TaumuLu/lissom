"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = require("../lib/constants");
const utils_1 = require("./lib/utils");
const utils_2 = require("../lib/utils");
let _config = {
    dev: true,
    chunks: {},
    modules: {},
    requireModules: [],
    excludeModules: [],
    excludeModuleRegs: [],
};
const modules = [];
let parentJsonpFunction;
// install a JSONP callback for chunk loading
function webpackJsonpCallback(data) {
    const chunkIds = data[0];
    const moreModules = data[1];
    const executeModules = data[2];
    // add "moreModules" to the modules object,
    // then flag all "chunkIds" as loaded and fire callback
    let moduleId;
    let chunkId;
    let i = 0;
    const resolves = [];
    for (; i < chunkIds.length; i++) {
        chunkId = chunkIds[i];
        if (installedChunks[chunkId]) {
            resolves.push(installedChunks[chunkId][0]);
        }
        installedChunks[chunkId] = 0;
    }
    for (moduleId in moreModules) {
        if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
            modules[moduleId] = moreModules[moduleId];
        }
    }
    if (parentJsonpFunction)
        parentJsonpFunction(data);
    while (resolves.length) {
        resolves.shift()();
    }
    // add entry modules from loaded chunk to deferred list
    deferredModules.push(...executeModules || []);
    // run deferred modules when all chunks ready
    return checkDeferredModules();
}
function checkDeferredModules() {
    let result;
    for (let i = 0; i < deferredModules.length; i++) {
        const deferredModule = deferredModules[i];
        let fulfilled = true;
        for (let j = 1; j < deferredModule.length; j++) {
            const depId = deferredModule[j];
            if (installedChunks[depId] !== 0)
                fulfilled = false;
        }
        if (fulfilled) {
            deferredModules.splice(i--, 1);
            result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
        }
    }
    return result;
}
// The module cache
let installedModules = {};
// 服务端不考虑css按需加载
// // object to store loaded CSS chunks
// const installedCssChunks = {
//   [RUNTIME_NAME]: 0,
// }
// object to store loaded and loading chunks
// undefined = chunk not loaded, null = chunk preloaded/prefetched
// Promise = chunk loading, 0 = chunk loaded
const installedChunks = {
    [constants_1.RUNTIME_NAME]: 0,
};
const deferredModules = [];
let asyncJsChunks = [];
let asyncCssChunks = [];
const getAsyncChunks = () => {
    return {
        asyncJsChunks,
        asyncCssChunks,
    };
};
exports.getAsyncChunks = getAsyncChunks;
// script path function
function requireChunk(chunkId) {
    const installedChunkData = installedChunks[chunkId];
    const isRequire = installedChunkData !== 0;
    const { files } = _config.chunks[chunkId];
    const jsChunkAssets = utils_1.fileterJsAssets(files);
    const cssChunAsstes = utils_1.fileterCssAssets(files);
    jsChunkAssets.forEach((asset) => {
        const absPath = path_1.default.join(__webpack_require__.p, asset);
        if (_config.dev) {
            utils_1.deleteCache(absPath);
        }
        asyncJsChunks.push(getAbsPath(asset));
        if (isRequire) {
            require(absPath);
        }
    });
    cssChunAsstes.forEach((asset) => {
        asyncCssChunks.push(getAbsPath(asset));
    });
}
// requireModules 服务单需要从node_modules require的模块，解决一些提供服务端和客户端的包，如superagent
// excludeModules 服务端排除执行模块
const getModuleName = (modulePath) => {
    const modulePathList = modulePath.split('/');
    if (modulePath.charAt(0) === '@') {
        return modulePathList.slice(0, 2).join('/');
    }
    return modulePathList.slice(0, 1).join('/');
};
const handleModule = (moduleId) => {
    const { name } = _config.modules[moduleId] || {};
    if (name && /node_modules/.test(name)) {
        const modulePath = name.replace('./node_modules/', '');
        const moduleName = getModuleName(modulePath);
        if (_config.excludeModules.includes(moduleName))
            return {};
        if (_config.requireModules.includes(moduleName)) {
            const absPath = path_1.default.resolve('node_modules', moduleName);
            return require(absPath);
        }
    }
    return null;
};
// The require function
function __webpack_require__(moduleId) {
    const result = handleModule(moduleId);
    if (result)
        return result;
    // Check if module is in cache
    if (installedModules[moduleId]) {
        return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    const module = installedModules[moduleId] = {
        i: moduleId,
        l: false,
        exports: {},
    };
    // Execute the module function
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    // Flag the module as loaded
    module.l = true;
    // Return the exports of the module
    return module.exports;
}
__webpack_require__.s = undefined;
// This file contains only the entry chunk.
// The chunk loading function for additional chunks
// 当作普通包加载
__webpack_require__.e = function requireEnsure(chunkId) {
    const promises = [];
    promises._isSyncThen = true;
    // JSONP chunk loading for javascript
    // const installedChunkData = installedChunks[chunkId]
    // if (installedChunkData !== 0) { // 0 means "already installed".
    // // a Promise means "currently loading".
    // if (installedChunkData) {
    //   promises.push(installedChunkData[2])
    // } else {
    //   // setup Promise in chunk cache
    //   const promise = new Promise(((resolve, reject) => {
    //     installedChunkData = installedChunks[chunkId] = [resolve, reject]
    //   }))
    //   promises.push(installedChunkData[2] = promise)
    // }
    requireChunk(chunkId);
    // }
    return Promise.all(promises);
};
// expose the modules object (__webpack_modules__)
__webpack_require__.m = modules;
// expose the module cache
__webpack_require__.c = installedModules;
// define getter function for harmony exports
__webpack_require__.d = function (exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
        Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
};
// define __esModule on exports
__webpack_require__.r = function (exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
};
// create a fake namespace object
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 8|1: behave like require
__webpack_require__.t = function (value, mode) {
    if (mode & 1)
        value = __webpack_require__(value);
    if (mode & 8)
        return value;
    if ((mode & 4) && typeof value === 'object' && value && value.__esModule)
        return value;
    const ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value });
    if (mode & 2 && typeof value !== 'string')
        for (const key in value)
            __webpack_require__.d(ns, key, ((key) => { return value[key]; }).bind(null, key));
    return ns;
};
// getDefaultExport function for compatibility with non-harmony modules
__webpack_require__.n = function (module) {
    const getter = module && module.__esModule
        ? function getDefault() { return module.default; }
        : function getModuleExports() { return module; };
    __webpack_require__.d(getter, 'a', getter);
    return getter;
};
// Object.prototype.hasOwnProperty.call
__webpack_require__.o = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
// __webpack_public_path__
__webpack_require__.p = '/';
// on error function for async loading
__webpack_require__.oe = function (err) { console.error(err); throw err; };
global[constants_1.JSONP_FUNCTION] = [];
let jsonpArray = global[constants_1.JSONP_FUNCTION];
const oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
jsonpArray.push = webpackJsonpCallback;
jsonpArray = jsonpArray.slice();
for (let i = 0; i < jsonpArray.length; i++)
    webpackJsonpCallback(jsonpArray[i]);
parentJsonpFunction = oldJsonpFunction;
// run deferred modules from other chunks
// checkDeferredModules()
// __SSR_REGISTER_PAGE__, client use
global.__SSR_REGISTER_PAGE__ = function (_route, fn) {
    const { page } = fn();
    return page;
};
global.window = undefined;
function getAbsPath(originPath, head = true) {
    const reg = new RegExp(`${head ? '^' : ''}\\/${head ? '' : '$'}`);
    const hasSlash = reg.test(originPath);
    const slash = hasSlash ? '' : '/';
    if (slash) {
        return `${head ? slash : ''}${originPath}${head ? '' : slash}`;
    }
    return originPath;
}
const setWebpackConfig = (config, { dev, requireModules, excludeModules, excludeModuleRegs }) => {
    const { outputPath } = config;
    __webpack_require__.p = getAbsPath(outputPath, false);
    _config = Object.assign({}, config, { dev,
        requireModules,
        excludeModules,
        excludeModuleRegs });
};
exports.setWebpackConfig = setWebpackConfig;
// 提供清除webpack modules cache的方法
const clearModuleCache = (dev) => {
    if (dev) {
        Object.keys(installedModules).forEach((moduleId) => {
            const { name } = _config.modules[moduleId] || {};
            const excludeMatch = !utils_2.getReg(_config.excludeModuleRegs, false).test(name);
            if (excludeMatch) {
                delete installedModules[moduleId];
            }
        });
    }
    asyncJsChunks = [];
    asyncCssChunks = [];
};
exports.clearModuleCache = clearModuleCache;
//# sourceMappingURL=webpack-runtime.js.map