import config from './config'
import Server, { serverWrap } from './index'
import { log } from './lib/utils'

export default serverWrap((app: Server) => {
  return (req, res, next) => {
    const { excludeRouteReg } = config.getRegsConfig()
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
