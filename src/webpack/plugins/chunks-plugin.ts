import { ConcatSource } from 'webpack-sources'

export default class ChunksPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ChunksPlugin', (compilation) => {
      compilation.chunkTemplate.hooks.render.tap('ChunksPluginRenderHack', (modules) => {
        const source = new ConcatSource()
        // 支持服务端运行和导出
        source.add(`${hackCode}`)
        const replaceStr = modules.children[0].replace(/window/g, 'globalVar')
        modules.children[0] = replaceStr
        source.add(modules)
        source.add('\n})()')

        return source
      })
    })
  }
}

const hackCode = `(function() {
  if (!Promise._all) {
    Promise._all = Promise.all
    Promise.all = function () {
      function getType(context) {
        return Object.prototype.toString.call(context).slice(8, -1).toLowerCase()
      }
      function checkValue(arr) {
        let hasValue = false
        for (var i in arr) {
          var item = arr[i]
          if (!hasValue) {
            var type = getType(item)
            if (type === 'array') {
              hasValue = checkValue(item)
            } else if(type === 'object' && item._isSyncThen) {
              hasValue = false
            } else {
              hasValue = !!item
            }
          }
        }
        return hasValue
      }
      var value = arguments[0]
      if (getType(value) === 'array') {
        var isEmpty = !checkValue(value)
        if(isEmpty) {
          return {
            _isSyncThen: true,
            then: function(onFulfilled, onRejected) {
              try {
                var module = onFulfilled() || {}
                module.then = Promise.resolve(module)
                module._isSyncModule = true
                return module
              } catch(e) {
                return Promise.reject(onRejected ? onRejected(e) : e)
              }
            }
          }
        }
      }
      return Promise._all.apply(Promise, arguments)
    }
  }
  var _module = typeof module === "undefined" ? {} : module
  var globalVar = typeof window === "undefined" ? global : window
  _module.exports = `