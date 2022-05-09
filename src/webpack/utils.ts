import { Configuration } from 'webpack'

export const getEntry = (entries: string[], initialEntry: any): any => {
  const prependEntry = (entry: any) => {
    if (typeof entry === 'function') {
      return () => Promise.resolve(entry()).then(prependEntry)
    }

    if (typeof entry === 'object' && !Array.isArray(entry)) {
      const clone = {}
      Object.keys(entry).forEach(key => {
        clone[key] = entries.concat(entry[key])
      })
      return clone
    }
    return entries.concat(entry)
  }

  return prependEntry(initialEntry)
}

function handleExport(options) {
  const isES6DefaultExported =
    typeof options === 'object' &&
    options !== null &&
    typeof options.default !== 'undefined'

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
    throw new Error('[lissom] > webpack config does not support array')
  }
  return isArray
    ? options.map(_options => handleFunction(_options, ...params))
    : handleFunction(options, ...params)
}

const constructorName = 'HtmlWebpackPlugin'

export const isMissHtmlPlugin = plugins => {
  return !plugins.some(instance => {
    const { name } = instance.constructor
    return name === constructorName
  })
}

const styles = {
  bold: ['\x1B[1m', '\x1B[22m'],
  italic: ['\x1B[3m', '\x1B[23m'],
  underline: ['\x1B[4m', '\x1B[24m'],
  inverse: ['\x1B[7m', '\x1B[27m'],
  strikethrough: ['\x1B[9m', '\x1B[29m'],
  white: ['\x1B[37m', '\x1B[39m'],
  grey: ['\x1B[90m', '\x1B[39m'],
  black: ['\x1B[30m', '\x1B[39m'],
  blue: ['\x1B[34m', '\x1B[39m'],
  cyan: ['\x1B[36m', '\x1B[39m'],
  green: ['\x1B[32m', '\x1B[39m'],
  magenta: ['\x1B[35m', '\x1B[39m'],
  red: ['\x1B[31m', '\x1B[39m'],
  yellow: ['\x1B[33m', '\x1B[39m'],
  whiteBG: ['\x1B[47m', '\x1B[49m'],
  greyBG: ['\x1B[49;5;8m', '\x1B[49m'],
  blackBG: ['\x1B[40m', '\x1B[49m'],
  blueBG: ['\x1B[44m', '\x1B[49m'],
  cyanBG: ['\x1B[46m', '\x1B[49m'],
  greenBG: ['\x1B[42m', '\x1B[49m'],
  magentaBG: ['\x1B[45m', '\x1B[49m'],
  redBG: ['\x1B[41m', '\x1B[49m'],
  yellowBG: ['\x1B[43m', '\x1B[49m'],
}

export let log: any

log = function (style, message = '') {
  console.log(style, message)
}

Object.keys(styles).forEach(key => {
  log[key] = log.bind(null, styles[key].join('%s'))
})
