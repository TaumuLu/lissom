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
