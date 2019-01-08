import { resolve } from 'path'
import { renderToHTML, renderErrorToHTML } from './render'
import sendHTML from "./send-html";
import loadConfig from './config'
import { isResSent } from './lib/utils'
import { setWebpackConfig } from './lib/webpack-runtime'

export default class Server {
  dir: string
  quiet: boolean
  config: any
  renderOpts: any

  constructor({ dir, dev, isSpa, quiet, output, requireModules, excludeModules, excludeModuleRegs, ...renderOpts }) {
    this.dir = resolve(dir)
    this.quiet = quiet
    this.config = loadConfig(output)
    setWebpackConfig(this.config, { dev, requireModules, excludeModules, excludeModuleRegs })

    this.renderOpts = {
      dev,
      ...renderOpts,
      ...this.config,
    }
  }

  async render(req, res, pathname, query) {
    const html = await this.renderToHTML(req, res, pathname, query)
    if (isResSent(res)) return null

    return sendHTML(req, res, html, req.method, this.renderOpts)
  }

  async renderToHTML(req, res, pathname, query) {
    try {
      const out = await renderToHTML(req, res, pathname, query, this.renderOpts)
      return out
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404
        return this.renderErrorToHTML(null, req, res, pathname, query)
      }
      if (!this.quiet) console.error(err)
      res.statusCode = 500
      return this.renderErrorToHTML(err, req, res, pathname, query)
    }
  }

  async renderErrorToHTML(err, req, res, pathname, query) {
    return renderErrorToHTML(err, req, res, pathname, query, this.renderOpts)
  }
}
