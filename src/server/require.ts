import { deleteCache } from './lib/utils'
import { clearModuleCache } from './webpack-runtime'

const requirePage = (router, dev) => {
  const { existsAts, size } = router
  clearModuleCache(dev)

  return existsAts.reduce((p, assetPath, i) => {
    if (dev) {
      deleteCache(assetPath)
    }
    const executeModule = require(assetPath)
    if (i === size - 1) {
      return executeModule
    }
    return p
  }, null)
}

const getRouter = (page, routers) => {
  return routers[page] || routers.default
}

function purgeCache(moduleName, excludeModules) {
  const modPath = require.resolve(moduleName)
  searchCache(modPath, deleteCache, excludeModules)
  const mConstructor = module.constructor as any

  Object.keys(mConstructor._pathCache).forEach((cacheKey) => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete mConstructor._pathCache[cacheKey]
    }
  })
}

function searchCache(modPath, callback, excludeModules = []) {
  const mod = modPath && require.cache[modPath]

  if (mod !== undefined) {
    (function traverse(mod) {
      const id = mod.id
      const isExclude = excludeModules.some(exmod => id.includes(exmod))
      if (!isExclude) {
        mod.children.forEach((child) => {
          traverse(child)
        })
      }
      callback(mod.id)
    }(mod))
  }
}

export {
  getRouter,
  requirePage,
  purgeCache,
}