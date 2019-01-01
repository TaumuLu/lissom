# fassr

## 安装
npm i fassr

## 说明
服务端使用客户端js来渲染  
用户可以编写自己任意的webpack配置，使用ssr提供的webpack包装一下即可  
用户启动webpack(开发模式使用watch方式)，确保打出真实的文件，以供服务端使用  
启动koa服务，koa中间件形式引入ssr包，并传入初始配置  
服务端通过初始配置中的webpack输出目录查找到文件  
通过之前包装过的webpack，加入服务端需要的webpack插件，得以支持服务端引用、查找、读取相关文件  
通过koa-router拦截页面级请求，渲染出页面  

## 使用

### 包装webpack配置
在客户端打包的webpack配置里使用

```javascript
// 引入ssr的包装webpack
const ssrWebpack = require('fassr/webpack')

module.exports = ssrWebpack((env, argv) => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

### 中间件形式引入

```javascript
const ssrRouter = require('fassr/trnw-ssr')
...
app.use(await ssrRouter({ isSpa: true }))
...
```

### 配置参数
| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| isSpa | boolean | true | 是否为单页面模式，映射webpack的entry配置 |
| output | string | ./public | 服务端读取webpack的打包目录，同webpack配置中的output |
| excludeRegs | array | [/\/api\/.*/] | 正则数组，匹配排除的拦截路由，可传字符串或正则表达式 |
| dir | string | '.' | 项目路径 |
| dev | boolean | process.env.NODE_ENV !== 'production' | 是否为开发模式 |
| staticMarkup | boolean | false | 是否使用renderToStaticMarkup渲染，默认renderToString |
| generateEtags | boolean | true | 页面请求头是否添加ETag |
| quiet | boolean | false | 是否隐藏错误信息 |
| requireModules | array | ['superagent'] | 服务端不使用打包模块，在node_modules里require的模块 |
| excludeModules | array | ['babel-polyfill'] | 服务端排除执行的打包模块 |
| clientRender | boolean | true | 客户端是否渲染 |
