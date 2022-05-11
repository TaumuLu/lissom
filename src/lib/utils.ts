import { ISSRData } from './types'

export const getType = (value: any) => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}

const isTypeFactory = (type: string) => (value: any) => {
  return getType(value) === type
}

export const isFunction = isTypeFactory('function')

export const isString = isTypeFactory('string')

export const isArray = isTypeFactory('array')

export const isRegExp = isTypeFactory('regexp')

export function isDef(v: any) {
  return v !== undefined && v !== null
}

export const hasWindow = typeof window !== 'undefined'

export const checkServer = () =>
  Object.prototype.toString.call(global.process) === '[object process]'

export const isSsrRender = () =>
  checkServer() ||
  (hasWindow && typeof window.__SSR_REGISTER_PAGE__ !== 'undefined')

export function interopDefault(mod: any): any {
  return mod.default || mod
}

export const getDisplayName = (Component: any) => {
  if (isString(Component)) return Component

  return Component.displayName || Component.name || 'Unknown Component'
}

const getRegSourceStr = (regs: Array<RegExp | string>) => {
  return regs
    .reduce((p, reg) => {
      if (reg) {
        if (typeof reg === 'string') {
          p.push(reg.toString())
        } else {
          p.push(reg.source)
        }
      }
      return p
    }, [] as string[])
    .join('|')
}

export const createReg = (
  regs: Array<RegExp | string> = [],
  noMatch?: boolean,
) => {
  const isEmpty = !(regs && regs.length > 0)
  const regTpl = isEmpty ? '' : getRegSourceStr(regs)
  let regStr = isEmpty && noMatch ? '^$' : ''
  if (regTpl) {
    regStr += `(${regTpl})`
  }
  return new RegExp(regStr)
}

type Tpath = string | string[]

const baseGetSet = (path: Tpath): string[] => {
  const type = getType(path)
  switch (type) {
    case 'array':
      return path as string[]
    case 'string':
      return `${path}`.split('.')
    default:
      return []
  }
}

export const get = (object: any, path: Tpath, defaultValue?: any) => {
  const pathArray = baseGetSet(path)

  return (
    pathArray.reduce((obj, key) => {
      return obj && obj[key] ? obj[key] : null
    }, object) || defaultValue
  )
}

export const set = (object: any, path: Tpath, value: any) => {
  const pathArray = baseGetSet(path)
  const len = pathArray.length

  return pathArray.reduce((obj, key, ind) => {
    if (obj && ind === len - 1) {
      obj[key] = value
    }

    return obj ? obj[key] : null
  }, object)
}

export function parseSSRData(): ISSRData {
  const ssrData = window.__SSR_DATA__
  if (typeof ssrData === 'string') {
    // 延迟到方法调用时再引用，避免服务端被执行
    // js-base64会引用全局对象导致开发模式下循环引用造成内存泄漏
    const { Base64 } = require('js-base64')
    const code = Base64.decode(ssrData)
    try {
      return JSON.parse(code)
    } catch (error) {
      throw error
    }
  }
  return ssrData
}
