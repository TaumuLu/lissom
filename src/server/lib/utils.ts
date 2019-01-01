import { posix } from 'path'
import { RUNTIME_NAME } from '../../lib/constants'

function deleteCache(path) {
  delete require.cache[path]
}

function isResSent(res) {
  return res.finished || res.headersSent
}

function getDisplayName(Component) {
  if (typeof Component === 'string') {
    return Component
  }

  return Component.displayName || Component.name || 'Unknown'
}

const loadGetInitial = (methodName, defaultValue = {}) => async function (Component, ctx) {
  if (process.env.NODE_ENV !== 'production') {
    if (Component.prototype && Component.prototype[methodName]) {
      const compName = getDisplayName(Component)
      const message = `"${compName}.${methodName}()" is defined as an instance method`
      throw new Error(message)
    }
  }

  if (!Component[methodName]) return defaultValue

  const props = await Component[methodName](ctx)

  if (ctx.res && isResSent(ctx.res)) {
    return props
  }

  if (!props) {
    const compName = getDisplayName(Component)
    const message = `"${compName}.${methodName}()" should resolve to an object. But found "${props}" instead.`
    throw new Error(message)
  }

  return props
}

const loadGetInitialProps = loadGetInitial('getInitialProps')

const loadGetInitialStyles = loadGetInitial('getInitialStyles', null)

function normalizePagePath(page) {
  if (page === '/') {
    page = '/index'
  }

  if (page[0] !== '/') {
    page = `/${page}`
  }

  const resolvedPage = posix.normalize(page)
  if (page !== resolvedPage) {
    throw new Error('Requested and resolved page mismatch')
  }

  return page
}

const fileterJsAssets = (originAssets) => {
  return originAssets.filter((path) => {
    return /.js($|\?)/.test(path) && !path.includes(RUNTIME_NAME)
  })
}

const fileterCssAssets = (originAssets) => {
  return originAssets.filter((path) => {
    return /.css($|\?)/.test(path) && !path.includes(RUNTIME_NAME)
  })
}

export {
  deleteCache,
  isResSent,
  getDisplayName,
  loadGetInitialProps,
  loadGetInitialStyles,
  normalizePagePath,
  fileterJsAssets,
  fileterCssAssets,
}
