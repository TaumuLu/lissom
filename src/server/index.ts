import { existsSync } from 'fs'
import Router from 'koa-router'
import { resolve } from 'path'
import { defaultConfig } from '../lib/config'
import { getReg, printAndExit, suffixRegs } from './lib/utils'
import SSRServer from './server'

export default async (config) => {
  const { excludeRouteRegs, output, ...otherConfig } = {...defaultConfig, ...config} as any
  if (!output) {
    printAndExit('> output configuration is required')
  }
  const outputDir = resolve(output)
  if (!existsSync(outputDir)) {
    printAndExit(`> No such directory exists as the project root: ${outputDir}`)
  }
  const ssrConfig = { ...otherConfig, output: outputDir }
  const app = new SSRServer(ssrConfig)

  const pathRouter = new Router()
  pathRouter.use(async (ctx, next) => {
    ctx.res.statusCode = 200
    await next()
  })
  pathRouter.get('*', async (ctx, next) => {
    const ctxPath = ctx.path
    const suffixMatch = getReg(suffixRegs).test(ctxPath)
    const excludeMatch = !getReg(excludeRouteRegs).test(ctxPath)

    if (suffixMatch && excludeMatch) {
      const { req, res, query } = ctx
      // 保持和浏览器相同的location对象数据格式
      const nodeReqest = req as any
      nodeReqest.location = getLocation(ctx)
      await app.render(nodeReqest, res, ctxPath, query)
      ctx.respond = false
    } else {
      await next()
    }
  })

  return pathRouter.routes()
}

function getLocation(ctx) {
  const { path, href, host, origin, protocol, querystring } = ctx
  const pathname = path
  const search = `?${querystring || ''}`
  const [hostname, port] = host.split(':')

  return {
    href, host, hostname, origin, pathname, port, protocol, search,
  }
}
