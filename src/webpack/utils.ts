export const getEntry = (entries, initialEntry) => {
  const prependEntry = (entry) => {
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

export function prepareOptions(options, ...params) {
  options = handleExport(options)

  return Array.isArray(options)
    ? options.map(_options => handleFunction(_options, ...params))
    : handleFunction(options, ...params)
}
