import { deleteCache } from './lib/utils'
import { clearModuleCache } from './lib/webpack-runtime'

const getRouter = (page, routers) => {
  return routers[page] || routers.default
}

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

function interopDefault(mod: any) {
  return mod.default || mod
}

async function loadComponents({ router, dev }) {
  const [Component] = await Promise.all([
    interopDefault(requirePage(router, dev))
  ])

  return { Component }
}

export {
  getRouter,
  requirePage,
  loadComponents
}
