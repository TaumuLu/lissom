import { posix } from 'path'
import { RUNTIME_NAME } from '../../lib/constants'

function deleteCache(path) {
  delete require.cache[path]
}

function purgeCache(moduleName, excludeModules) {
  const modPath = require.resolve(moduleName)
  searchCache(modPath, deleteCache, excludeModules)
  const mConstructor = module.constructor as any

  Object.keys(mConstructor._pathCache).forEach((cacheKey) => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete mConstructor._pathCache[cacheKey]
    }
  })
}

function searchCache(modPath, callback, excludeModules = []) {
  const searchMod = modPath && require.cache[modPath]

  if (searchMod !== undefined) {
    (function traverse(mod) {
      const id = mod.id
      const isExclude = excludeModules.some(exmod => id.includes(exmod))
      if (!isExclude) {
        mod.children.forEach((child) => {
          traverse(child)
        })
      }
      callback(mod.id)
    }(searchMod))
  }
}

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

export function printAndExit(message, code = 1) {
  if (code === 0) {
    console.log(message)
  } else {
    console.error(message)
  }

  process.exit(code)
}

function getType(value, nameStr) {
  const typeName = Object.prototype.toString.call(value).slice(8, -1)
  if (nameStr) {
    return typeName.toLowerCase() === nameStr.toLowerCase()
  }
  return typeName
}

export const suffixRegs = [/\.(html|php)/, /\/[^.]*/]

const getRegSourceStr = (regs) => {
  return regs.reduce((p, reg) => {
    if (reg) {
      const type = Object.prototype.toString.call(reg).slice(8, -1)
      if (type === 'RegExp') {
        p.push(reg.source)
      } else {
        p.push(reg.toString())
      }
    }
    return p
  }, []).join('|')
}

const getReg = (regs = [], matchEnd = true) => {
  const regTpl = getRegSourceStr(regs)
  let regStr = ''
  if (regTpl) {
    regStr += `(${regTpl})${matchEnd ? '$' : ''}`
  }
  return new RegExp(regStr)
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

export {
  deleteCache,
  purgeCache,
  normalizePagePath,
  fileterJsAssets,
  fileterCssAssets,
  getType,
  getRegSourceStr,
  getReg,
  isResSent,
  getDisplayName,
  loadGetInitialProps,
  loadGetInitialStyles,
}
