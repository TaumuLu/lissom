import config from './config'
import Server, { serverWrap } from './index'
import { log } from './lib/utils'

export default serverWrap((app: Server) => {
  return async (ctx, next) => {
    const { excludeRouteReg } = config.getRegsConfig()
    const { path, method } = ctx

    if (method === 'GET') {
      if (!excludeRouteReg.test(path)) {
        const { req, res } = ctx
        ctx.res.statusCode = 200
        log(`--> ${method}`, path)
        await app.render(req, res)
        ctx.respond = false
        log(`<-- ${method}`, path)
      } else {
        log('skip', path, '')
        await next()
      }
    }
  }
})
