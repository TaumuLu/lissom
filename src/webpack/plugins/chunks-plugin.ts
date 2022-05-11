import { Compiler } from 'webpack'
import { ConcatSource } from 'webpack-sources'

import { GLOBAl_VARIABLE } from '../../lib/constants'

// const replacePromiseReg = /Promise\.all\(([^()]*)\)/g
// const replaceRequireReg = /(.*)function __webpack_require__\(.*/g
// const hackFunctionName = '_hackPromiseAll_'

export default class ChunksPlugin {
  public apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('ChunksPlugin', (compilation: any) => {
      compilation.chunkTemplate.hooks.render.tap(
        'ChunksPluginRenderHack',
        (modules: any) => {
          const source = new ConcatSource()
          // 支持服务端运行和导出
          source.add(chunkHackCode)
          const replaceStr = modules.children[0].replace(
            /window/g,
            GLOBAl_VARIABLE,
          )
          modules.children[0] = replaceStr
          source.add(modules)
          source.add('\n})()')

          return source
        },
      )
      // compilation.mainTemplate.hooks.render.tap(
      //   'ChunksPluginMainRenderHack',
      //   (modules, chunk) => {
      //     if (chunk.name === RUNTIME_NAME) {
      //       const source = new ConcatSource()
      //       // 替换webpack中的Promise.all参数用于辨别
      //       const moduleSource = modules
      //         .source()
      //         .replace(replacePromiseReg, (_match: string, value: string) => {
      //           return `Promise.all(${value} && ${value}.length === 0 && typeof window === "undefined" ? { _isSyncPromise: true } : ${value})`
      //         })
      //         .replace(replaceRequireReg, (match: string, value: string) => {
      //           return `${runTimeHackPromise}\n${match}\n${callHackFun(value)}`
      //         })
      //       source.add(moduleSource)
      //       return source
      //     }
      //     return modules
      //   },
      // )
    })
  }
}

// const callHackFun = (value: string) => `${value}${hackFunctionName}()`

// const runTimeHackPromise = `// hack promise all function
// function ${hackFunctionName}() {
//   var hasPromise = typeof Promise !== "undefined"
//   if (!hasPromise || Promise._all) return

//   function getType(context) {
//     return Object.prototype.toString.call(context).slice(8, -1).toLowerCase()
//   }

//   function checkValue(arr) {
//     if (arr.length > 0) {
//       var hasValue = false
//       for (var i in arr) {
//         var item = arr[i]
//         if (!hasValue) {
//           var type = getType(item)
//           if (type === 'array') {
//             hasValue = checkValue(item)
//           } else if(type === 'object' && item._isSyncPromise) {
//             hasValue = false
//           } else {
//             hasValue = true
//           }
//         }
//       }
//       return hasValue
//     }
//     return !arr._isSyncPromise
//   }
//   function SyncPromise(value, error) {
//     this.value = value
//     this.error = error
//     this.finish = true
//     this._isSyncPromise = true
//   }
//   SyncPromise.prototype.then = function(onFulfilled) {
//     var error = null
//     var value = null
//     try {
//       value = onFulfilled(this)
//     } catch(e) {
//       error = e
//     }
//     return new SyncPromise(value, error)
//   }
//   Promise._all = Promise.all
//   Promise.all = function () {
//     var value = arguments[0]
//     var type = getType(value)
//     if (type === 'object') {
//       var isSyncValue = !checkValue(value)
//       if (isSyncValue) {
//         return new SyncPromise() // 这里是给webpack用的
//       }
//     }
//     // else if (type === 'array') {
//     //   var filterArgs = []
//     //   for (var i in value) {
//     //     var item = value[i]
//     //     if (!item instanceof SyncPromise) {
//     //       filterArgs.push(item)
//     //     }
//     //   }
//     //   arguments[0] = filterArgs
//     // }
//     return Promise._all.apply(Promise, arguments)
//   }
// }`

const chunkHackCode = `(function() {
  var ${GLOBAl_VARIABLE} = typeof window === "undefined" ? global : window
  return `
// var _module = typeof module === "undefined" ? {} : module
// var ${GLOBAl_VARIABLE} = typeof window === "undefined" ? global : window
// _module.exports =
