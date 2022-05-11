import path from 'path'

import { JSONP_FUNCTION, RUNTIME_NAME } from '../../lib/constants'
import config from '../config'
import styleLoader from './style-loader'
import { deleteCache, filterCssAssets, filterJsAssets } from './utils'

declare global {
  namespace NodeJS {
    interface Global {
      [JSONP_FUNCTION]: any[]
      __SSR_REGISTER_PAGE__: Function
      window: undefined
    }
  }

  interface PromiseConstructor {
    _all: any
  }
}

const modules = []
// let parentJsonpFunction;
// install a JSONP callback for chunk loading
function webpackJsonpCallback(data) {
  const chunkIds = data[0]
  const moreModules = data[1]
  const executeModules = data[2]

  // add "moreModules" to the modules object,
  // then flag all "chunkIds" as loaded and fire callback
  let moduleId
  let chunkId
  let i = 0
  const resolves = []
  for (; i < chunkIds.length; i++) {
    chunkId = chunkIds[i]
    if (installedChunks[chunkId]) {
      resolves.push(installedChunks[chunkId][0])
    }
    installedChunks[chunkId] = 0
  }
  for (moduleId in moreModules) {
    if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
      modules[moduleId] = moreModules[moduleId]
    }
  }
  // if (parentJsonpFunction) parentJsonpFunction(data);

  while (resolves.length) {
    resolves.shift()()
  }

  // add entry modules from loaded chunk to deferred list
  deferredModules.push(...(executeModules || []))

  // run deferred modules when all chunks ready
  return checkDeferredModules()
}

function checkDeferredModules() {
  let result
  const { chunks } = config.getAssetsConfig()
  for (let i = 0; i < deferredModules.length; i++) {
    const deferredModule = deferredModules[i]
    let fulfilled = true
    for (let j = 1; j < deferredModule.length; j++) {
      const depId = deferredModule[j]
      const { names = [] } = chunks[depId] || {}
      // webpack runtime chunks
      if (!names.includes(RUNTIME_NAME)) {
        if (installedChunks[depId] !== 0) fulfilled = false
      }
    }
    if (fulfilled) {
      deferredModules.splice(i--, 1)
      result = __webpack_require__((__webpack_require__.s = deferredModule[0]))
    }
  }
  return result
}

// The module cache
const installedModules = {}

// 服务端不考虑css按需加载
// // object to store loaded CSS chunks
// const installedCssChunks = {
//   [RUNTIME_NAME]: 0,
// }

// object to store loaded and loading chunks
// undefined = chunk not loaded, null = chunk preloaded/prefetched
// Promise = chunk loading, 0 = chunk loaded
const installedChunks = {
  [RUNTIME_NAME]: 0,
}

const deferredModules = []

let asyncModuleId = null
let dynamicModuleId = null
let asyncJsChunks = []
let asyncCssChunks = []
const getAsyncChunks = () => {
  return {
    asyncJsChunks,
    asyncCssChunks,
  }
}

const clearAsyncChunks = () => {
  // asyncModuleId = null; 不应该清除，这个值是不变的
  asyncJsChunks = []
  asyncCssChunks = []
}

// script path function
function requireChunk(chunkId) {
  const { dev } = config.get()
  const { chunks } = config.getAssetsConfig()
  const installedChunkData = installedChunks[chunkId]
  const isRequire = installedChunkData !== 0
  const { files } = chunks[chunkId]
  const jsChunkAssets = filterJsAssets(files)
  const cssChunkAssets = filterCssAssets(files)
  jsChunkAssets.forEach(asset => {
    const absPath = path.join(__webpack_require__.p, asset)
    if (dev) {
      deleteCache(absPath)
    }
    asyncJsChunks.push(getAbsPath(asset))
    if (isRequire) {
      require(absPath)
    }
  })
  cssChunkAssets.forEach(asset => {
    asyncCssChunks.push(getAbsPath(asset))
  })
}

// requireModules 服务单需要从node_modules require的模块，解决一些提供服务端和客户端的包，如superagent
// ignoreModules 服务端排除执行模块

const getModuleName = modulePath => {
  const modulePathList = modulePath.split('/')
  if (modulePath.charAt(0) === '@') {
    return modulePathList.slice(0, 2).join('/')
  }

  return modulePathList.slice(0, 1).join('/')
}

const getName = moduleId => {
  const { modules: _modules } = config.getAssetsConfig()
  const { name } = _modules[moduleId] || ({} as any)
  if (name) {
    const [fetchName] = name.split('!').reverse()
    return fetchName
  }
  return name
}

const asyncModuleReg = /lissom\/dist\/lib\/async/
const dynamicModuleReg = /lissom\/dist\/lib\/dynamic/
const styleModuleReg = /node_modules\/style-loader/

const matchModule = moduleId => {
  const { ignoreModules, requireModules } = config.get()
  const name = getName(moduleId)
  // 处理webpack style-loader
  if (styleModuleReg.test(name)) {
    return styleLoader
  }
  // 记录异步模块id
  if (asyncModuleReg.test(name)) {
    asyncModuleId = moduleId
  }
  // 记录动态模块id
  if (dynamicModuleReg.test(name)) {
    dynamicModuleId = moduleId
  }
  if (name && /node_modules/.test(name)) {
    const modulePath = name.replace(/.*\/node_modules\//, '')
    const moduleName = getModuleName(modulePath)
    if (ignoreModules.includes(moduleName)) return {}

    if (requireModules.includes(moduleName)) {
      const absPath = require.resolve(moduleName)
      return require(absPath)
    }
  }
  return null
}

function _hackPromiseAll_() {
  const hasPromise = typeof Promise !== 'undefined'
  if (!hasPromise || Promise._all) return

  function getType(context) {
    return Object.prototype.toString.call(context).slice(8, -1).toLowerCase()
  }
  function checkValue(arr) {
    if (arr.length > 0) {
      let hasValue = false
      for (const i in arr) {
        const item = arr[i]
        if (!hasValue) {
          const type = getType(item)
          if (type === 'array') {
            hasValue = checkValue(item)
          } else if (type === 'object' && item._isSyncPromise) {
            hasValue = false
          } else {
            hasValue = true
          }
        }
      }
      return hasValue
    }
    return !arr._isSyncPromise
  }
  function SyncPromise(value?, error?) {
    this.value = value
    this.error = error
    this.finish = true
    this._isSyncPromise = true
  }
  SyncPromise.prototype.then = function (onFulfilled) {
    let error = null
    let value = null
    try {
      value = onFulfilled(this)
    } catch (e) {
      error = e
    }
    return new SyncPromise(value, error)
  }
  Promise._all = Promise.all
  Promise.all = function () {
    const value = arguments[0]
    if (typeof value === 'object') {
      const isSyncValue = !checkValue(value)
      if (isSyncValue) {
        return new SyncPromise() // 这里是给webpack用的
      }
    }
    return Promise._all.apply(Promise, arguments)
  }
}

// The require function
function __webpack_require__(moduleId) {
  _hackPromiseAll_()
  // Check if module is in cache
  if (installedModules[moduleId]) {
    return installedModules[moduleId].exports
  }

  // Create a new module (and put it into the cache)
  const _module = (installedModules[moduleId] = {
    i: moduleId,
    l: false,
    exports: {},
  })

  // 缓存进installedModules里，提高性能
  const result = matchModule(moduleId)
  if (result) {
    _module.exports = result
  } else {
    // Execute the module function
    modules[moduleId].call(
      _module.exports,
      _module,
      _module.exports,
      __webpack_require__,
    )
  }

  // Flag the module as loaded
  _module.l = true

  // Return the exports of the module
  return _module.exports
}
__webpack_require__.s = undefined

// This file contains only the entry chunk.
// The chunk loading function for additional chunks
// 当作普通包加载
__webpack_require__.e = function requireEnsure(chunkId) {
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
  requireChunk(chunkId)
  // }

  return Promise.all([])
}

// expose the modules object (__webpack_modules__)
__webpack_require__.m = modules

// expose the module cache
__webpack_require__.c = installedModules

// define getter function for harmony exports
__webpack_require__.d = function (exports, name, getter) {
  if (!__webpack_require__.o(exports, name)) {
    Object.defineProperty(exports, name, { enumerable: true, get: getter })
  }
}

// define __esModule on exports
__webpack_require__.r = function (exports) {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
  }
  Object.defineProperty(exports, '__esModule', { value: true })
}

// create a fake namespace object
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 8|1: behave like require
__webpack_require__.t = function (value, mode) {
  if (mode & 1) value = __webpack_require__(value)
  if (mode & 8) return value
  if (mode & 4 && typeof value === 'object' && value && value.__esModule)
    return value
  const ns = Object.create(null)
  __webpack_require__.r(ns)
  Object.defineProperty(ns, 'default', { enumerable: true, value })
  if (mode & 2 && typeof value !== 'string')
    for (const key in value)
      __webpack_require__.d(ns, key, (k => value[k]).bind(null, key))
  return ns
}

// getDefaultExport function for compatibility with non-harmony modules
__webpack_require__.n = function (module) {
  const getter =
    module && module.__esModule
      ? function getDefault() {
          return module.default
        }
      : function getModuleExports() {
          return module
        }
  __webpack_require__.d(getter, 'a', getter)
  return getter
}

// Object.prototype.hasOwnProperty.call
__webpack_require__.o = function (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property)
}

// __webpack_public_path__
__webpack_require__.p = '/'

// on error function for async loading
__webpack_require__.oe = function (err) {
  console.error(err)
  throw err
}

global[JSONP_FUNCTION] = []
let jsonpArray = global[JSONP_FUNCTION]
// const oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
jsonpArray.push = webpackJsonpCallback
jsonpArray = jsonpArray.slice()
for (let i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i])
// parentJsonpFunction = oldJsonpFunction;

// run deferred modules from other chunks
// checkDeferredModules()

// __SSR_REGISTER_PAGE__, client use
global.__SSR_REGISTER_PAGE__ = function (_route, fn) {
  const { page } = fn()
  return page
}
global.window = undefined

function getAbsPath(originPath, head = true) {
  const reg = new RegExp(`${head ? '^' : ''}\\/${head ? '' : '$'}`)
  const hasSlash = reg.test(originPath)
  const slash = hasSlash ? '' : '/'
  if (slash) {
    return `${head ? slash : ''}${originPath}${head ? '' : slash}`
  }
  return originPath
}

function getAsyncModule() {
  const asyncModule = installedModules[asyncModuleId]
  if (asyncModule) {
    return asyncModule.exports
  }
  return null
}

function getDynamicModule() {
  const dynamicModule = installedModules[dynamicModuleId]
  if (dynamicModule) {
    return dynamicModule.exports
  }
  return null
}

const setWebpackConfig = ({ outputPath }) => {
  __webpack_require__.p = getAbsPath(outputPath, false)
}

const excludeModuleReg = /node_modules/
// 提供清除webpack modules cache的方法
const clearModuleCache = dev => {
  if (dev) {
    const { purgeModuleReg } = config.getRegConfig()
    Object.keys(installedModules).forEach(moduleId => {
      const name = getName(moduleId)
      // 默认清理所有非node_modules包的缓存
      const purgeModule =
        !excludeModuleReg.test(name) || purgeModuleReg.test(name)
      if (purgeModule) {
        delete installedModules[moduleId]
      }
    })
  }
  clearAsyncChunks()
}

export {
  clearAsyncChunks,
  clearModuleCache,
  getAsyncChunks,
  getAsyncModule,
  getDynamicModule,
  setWebpackConfig,
}
