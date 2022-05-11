import config from './config'
import Server, { createServer } from './index'
import { log } from './lib/utils'

export default createServer((app: Server) => {
  return (req: any, res: any, next: any) => {
    const { excludeRouteReg } = config.getRegConfig()
    const { path, method } = req

    if (method === 'GET') {
      if (!excludeRouteReg.test(path)) {
        log(`--> ${method}`, path)
        app.render(req, res)
        log(`<-- ${method}`, path)
      } else {
        log('skip', path, '')
        next()
      }
    }
  }
})
