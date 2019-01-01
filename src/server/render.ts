import createHtml from './create-html'
import { getRouter, requirePage } from './require'
import { loadGetInitialProps, normalizePagePath, isResSent } from './lib/utils'

export function renderToHTML(req, res, pathname, query, opts) {
  return doRender(req, res, pathname, query, opts)
}

export function renderErrorToHTML(err, req, res, pathname, query, opts = {}) {
  return doRender(req, res, pathname, query, { ...opts, err, page: '/_error' })
}

async function doRender(req, res, pathname, query, {
  err,
  page,
  dev = false,
  staticMarkup = false,
  routers,
  htmlConfig,
}: any) {
  page = normalizePagePath(page || pathname)
  const router = getRouter(page, routers)

  let [Component] = await Promise.all([
    requirePage(router, dev),
  ])

  Component = Component.default || Component
  const asPath = req.url
  // 保持兼容next
  const ctx = { err, req, res, pathname: page, query, asPath }
  const props = await loadGetInitialProps(Component, ctx)

  if (isResSent(res)) return null
  // if (!Component.prototype || !Component.prototype.isReactComponent) {
  //   throw new Error('Component is not exporting a React component')
  // }
  const html = await createHtml({ htmlConfig, props, router, Component, ctx, staticMarkup })
  return html
}
