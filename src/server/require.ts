import { IRouter, IRouters } from '../lib/types'
import { deleteCache } from './lib/utils'
import { clearModuleCache } from './lib/webpack-runtime'

// 优先匹配路由名，其次指定的默认名称，最后为默认的名称
export const getRouter = (page: string, routers: IRouters): IRouter => {
  // if (dev) {
  // 清除所有入口模块require缓存，只清除入口模块某一个无法确认其他关联
  // }
  return routers[page] || routers.default
}

export const requirePage = (router: any, dev?: boolean) => {
  const { existsAts, size } = router
  clearModuleCache(dev)

  return existsAts.reduce((p: any, assetPath: string, i: number) => {
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

export function loadComponent({
  router,
  dev,
}: {
  router: IRouter
  dev?: boolean
}) {
  return interopDefault(requirePage(router, dev))
}
