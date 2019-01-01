## 为什么要做ssr
- 有利于seo  
- 秒开首屏  
- 提高用户体验  
- 降低代码复杂度？  

## 理解
webapck配置、路由、项目目录结构、动态加载以及更细化的babel、postcss配置等，这类东西用户定制化程度高，应该将权利给予用户去做，框架不应该承担这种多样化的东西，无论是使用next还是北斗等，都对以上有侵入性的改变企且使用过重，对于大型项目，这些东西不应该被限制，如果你不是一开始就使用它们  
其实我们想要的只是核心渲染，路由、结构、配置你可以提供但不能限制我的发挥  

### next issue统计
| 关键词 | Open | Closed |
| ----- | ---- | ------ |
| - | 290 | 3084 |
| webpack | 95 | 1030 |
| babel | 60 | 870 |

## 整体思路
我的初衷是用最小代价的引入ssr，让使用者无感切入，不用改webpbak配置，客户端能跑，服务端也能跑，即使不开启ssr  
做出基于react和webpack的项目做服务端渲染时提供支持  

### 想法
为什么要自己撸一套ssr，写逻辑哪有造轮子好玩？  
我就只是想访问页面时服务器端返回一下渲染好的页面，之后正常走客户端逻辑，为何要我作出这么多改变  
这个问题是什么原因啊，只有看了源码后才知道，文档竟然也没说明  
为何开发体验这么差，开发模式打包速度如此的慢  

### 用户端操作
用户使用我提供的webpack函数包一层自己的webpack  
用户通过中间的形式引入ssr中件间  
用户自由开启webpack和koa服务，自身不提供运行命令  

### 资源引用
返回的html模版利用html-webpack-plugin插件生成html文件  
js、css资源通过分析webpack插件打出的资源清单分析出依赖文件，同时供服务端和客户端使用  
编写node端webpack运行时，处理webpack打包的文件chunk和模块加载，收集当前页面需要的资源，服务端require导入，客户端通过在生成html时将chunk注入到html中  

## 服务端使用客户端代码
目前主流的ssr做法都是打两套js，但其实分析一些两套js的代码其中百分之99的代码都是重复的？  
打两套包复杂度也高了，原来只用判断开发和生产模式现在多了客户端和服务端的判断  
所以为何不能通过webpack赋予的能力注入差异的代码，让一套客户端的代码同时跑在服务器和客户端  

### 代码注入
```javascript
(function() {
  var _module = typeof module === "undefined" ? {} : module
  var globalVar = typeof window === "undefined" ? global : window
  _module.exports = (globalVar["webpackJsonp"] = globalVar["webpackJsonp"] || []).push(
    [
      ['chunk'],
      { module: (function(module, __webpack_exports__, __webpack_require__) {}) },
      ['entry', ...'dependencies']
    )
})()
// const replaceStr = modules.children[0].replace(/window/g, 'globalVar')
```
用匿名函数包一层，隔离作用域，避免写入全局变量  
判断module变量是否存在，node端不允许声明module的同名变量  
通过webpack插件修改window为globalVar，避免正常的typeof window === 'undefined'判断失效  

## page入口注册执行
```javascript
// 包装入口模块注册函数，供客户端查找调用
const source = new ConcatSource(
  `__SSR_REGISTER_PAGE__('${chunk.name}', function() {\n`,
  moduleSourcePostModule,
  '\nreturn { page: module.exports.default }',
  '});'
)
// node端注册
global.__SSR_REGISTER_PAGE__ = function (route, fn) {
  const { page } = fn()
  return page
}
// 客户端注册
window.__SSR_LOADED_PAGES__ = ['${name}'];
window.__SSR_REGISTER_PAGE__ = function(r,f){__SSR_LOADED_PAGES__.push([r, f()])};

// 客户端挂载dom节点，webpack做为入口处注入
if (typeof window !== 'undefined') {
  // 异步延迟至当前入口模块导出后再执行，入口模块为导出的react组件，一定会是同步执行
  Promise.resolve().then(() => {
    let isInitialRender = true
    function renderReactElement(reactEl, domEl) {
      // The check for `.hydrate` is there to support React alternatives like preact
      if (isInitialRender && typeof ReactDOM.hydrate === 'function') {
        ReactDOM.hydrate(reactEl, domEl)
        isInitialRender = false
      } else {
        ReactDOM.render(reactEl, domEl)
      }
    }
    // 取出当前页面在服务端渲染的路由
    const initialRoute = window.__SSR_LOADED_PAGES__.shift()
    const { __SSR_DATA__: { props } } = window
    const routers = {}
    const registerPage = (route, { page }) => {
      routers[route] = page

      // 和服务端是同一个路由时才去渲染挂载到dom节点上
      if (isInitialRender && route === initialRoute) {
        const appContainer = document.getElementById('__ssr__')
        const reactEl = React.createElement(page, props)
        renderReactElement(reactEl, appContainer)
      }
    }

    window.__SSR_LOADED_PAGES__.forEach(([r, f]) => {
      registerPage(r, f)
    })
    delete window.__SSR_LOADED_PAGES__
    window.__SSR_REGISTER_PAGE__ = registerPage
  })
}
```

## 动态加载模块
使用import用于拆包，webpack4会自己处理import语法，将其转化为__webpack_require__.e以处理动态加载的模块

### webpack处理方式
如果import的包依赖其他包，webpack会使用Promise.all包一层，否者只使用__webpack_require__.e来处理

```javascript
// 无依赖
__webpack_require__.e(0).then(__webpack_require__.bind(null, "./dynamic_module_path"))
// 有依赖
Promise.all([
  __webpack_require__.e(0),
  __webpack_require__.e(1),
  __webpack_require__.e(2),
]).then(__webpack_require__.bind(null, "./dynamic_module_path"))
```

#### 客户端__webpack_require__.e函数
```javascript
__webpack_require__.e = function requireEnsure(chunkId) {
  var promises = []
  ... // css chunk
  var installedChunkData = installedChunks[chunkId]
  if(installedChunkData !== 0) { // 0 means "already installed".
    // a Promise means "currently loading".
    if(installedChunkData) {
      promises.push(installedChunkData[2])
    } else {
      // setup Promise in chunk cache
      var promise = new Promise(function(resolve, reject) {
        ...
      })
      promises.push(installedChunkData[2] = promise)
    }
  }
  return Promise.all(promises);
}
```

### ssr动态加载
需要处理服务端和客户端，服务端要每次都渲染出动态加载的模块，客户端只有页面出来第一次，之后走正常的客户端异步加载方式  
也就是说如果我想再render这个同步方法里就拿到返回值，按上面的结果看无论是否有依赖都会返回一个promise，结果自然是取不到要渲染的异步加载组件  

#### 服务端__webpack_require__.e函数
```javascript
// 当作普通包加载
__webpack_require__.e = function requireEnsure(chunkId) {
  const promises = []

  const installedChunkData = installedChunks[chunkId]
  if (installedChunkData !== 0) {
    requireChunk(chunkId) // 找到chunkId对的真是文件路径，直接require进来
  }

  // 是否含有installedChunks都返回空数组，因为require chunk是个同步操作，已经调用webpackJsonpCallback将chunk和模块导入
  return Promise.all(promises)
}
```

#### Promise.all
分析以上代码，其实在服务端是能立即加载好chunks的，并且每次都返回一个promise.all，其值是一个空数组  
因此两种模式下的返回值应该是
```javascript
Promise.all([])
Promise.all([[], [], []])
```

因此我有一个大胆的想法，重写下promise.all方法，如果参数是空数组第一个then改成同步执行  
在重写之前我也思考了这里是否会对业务正常逻辑造成影响，这样会给Promise.all造成的影响是如果Promise.all传入一个空数组，第一次then会以同步的方式执行，但在考虑了其他所有方案的复杂度和对业务的侵入性之后，我还是觉得值得这样去做，算作一种约束  
代码越简单出错越少  

**实现方式**
```javascript
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
```
实际返回值
```javascript
Promise.all([])
Promise.all([[{ _isSyncModule: true }], [ _isSyncModule: true }], ...])
```

#### 动态加载使用
```javascript
import dynamic from '@terminus/trnw-ssr/dynamic'
...
// 可以写在任意位置，同步的render方法里
render() {
  const Component = dynamic({ component: () => import('./dynamic') })
  return (
    <Component />
  )
}
...
```
