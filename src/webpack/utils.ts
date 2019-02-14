import { Configuration } from 'webpack'

export const getEntry = (entries: string[], initialEntry: any): any => {
  const prependEntry = (entry: any) => {
    if (typeof entry === 'function') {
      return () => Promise.resolve(entry()).then(prependEntry)
    }

    if (typeof entry === 'object' && !Array.isArray(entry)) {
      const clone = {}
      Object.keys(entry).forEach((key) => {
        clone[key] = entries.concat(entry[key])
      })
      return clone
    }
    return entries.concat(entry)
  }

  return prependEntry(initialEntry)
}

function handleExport(options) {
  const isES6DefaultExported = typeof options === 'object' && options !== null && typeof options.default !== 'undefined'

  return isES6DefaultExported ? options.default : options
}

function handleFunction(options, ...params) {
  if (typeof options === 'function') {
    options = options(...params)
  }
  return options
}

export function prepareOptions(options, ...params): Configuration {
  options = handleExport(options)
  const isArray = Array.isArray(options)
  if (isArray) {
    throw new Error('webpack config does not support array')
  }
  return isArray
    ? options.map(_options => handleFunction(_options, ...params))
    : handleFunction(options, ...params)
}
