import { deleteCache } from './lib/utils'
import { clearModuleCache } from './lib/webpack-runtime'

// 优先匹配路由名，其次指定的默认名称，最后为默认的名称
const getRouter = (page, routers) => {
  return routers[page] || routers.default || routers._default
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
    interopDefault(requirePage(router, dev)),
  ])

  return { Component }
}

export {
  getRouter,
  requirePage,
  loadComponents
}
