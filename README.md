# lissom
使用基于webacpk打包的客户端js来完成react的服务端渲染  
轻量级，低接入成本，使用简单，最小的原有逻辑改动，可随时关闭  

## 安装
npm install lissom --save

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
const ssrWebpack = require('lissom/webpack')

module.exports = ssrWebpack(() => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

### 中间件形式引入

```javascript
const ssrRouter = require('lissom')
...
app.use(await ssrRouter({ isSpa: true }))
...
```

### 配置参数
| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| isSpa | boolean | true | 是否为单页面模式，映射webpack的entry配置 |
| output | string | ./public | 服务端读取webpack的打包目录，同webpack配置中的output |
| excludePathRegs | array | [/\\/api\\/.*/] | 正则数组，匹配排除的拦截路由，可传字符串或正则表达式 |
| dir | string | '.' | 项目路径 |
| dev | boolean | process.env.NODE_ENV !== 'production' | 是否为开发模式 |
| staticMarkup | boolean | false | 是否使用renderToStaticMarkup渲染，默认renderToString |
| generateEtags | boolean | true | 页面请求头是否添加ETag |
| quiet | boolean | false | 是否隐藏错误信息 |
| requireModules | array | ['superagent'] | 服务端不使用打包模块，在node_modules里require的模块 |
| excludeModules | array | ['babel-polyfill'] | 服务端排除执行的打包模块 |
| excludeModuleRegs | array | [/node_modules/] | 正则数组，匹配开发模式下排除清理的模块，可传字符串或正则表达式 |
| clientRender | boolean | true | 客户端是否渲染 |


## 约束
- react
- webpbak4
- Promise.all

ssr没有银弹，我提供能力，你遵循约束  
ssr渲染并不是适用于所有情况，如果使用、最佳实践根据实际情况选择  

## TODO
- [x] 服务端能够使用客户端打包的js去渲染
- [x] 提供简洁的api
- [x] 编写webpack插件，分析打包js路径，chunk及模块资源的分析
- [x] 支持单入口形式
- [x] 支持多入口形式
- [x] redux同构、dva处理
- [x] 其他细节处理，全局对象、平台判断，提供统一的数据格式
- [x] 动态加载处理，服务端客户端js支持同步模式取用
- [ ] 动态加载处理，客户端css返回promise处理，修改注入chunkjs依赖数组
- [ ] 异常处理，服务端不阻断执行，客户端报错展示，呈现错误堆栈信息
- [ ] 缓存webpack查找的模块
- [ ] 用户端路由切换执行getIninialProps方法
- [ ] 服务端支持引入dll
- [ ] 提供404等未匹配路由页面
- [ ] 分析react组件的getIninialProps的插件，可以再服务端调用嵌套组件的
- [ ] 性能优化，是否有内存泄漏问题
- [ ] ssr缓存
- [ ] 多语言处理
- [ ] 完善文档
- [x] 翻新代码，引入ts，使用es6
- [ ] 优化代码入口，提出公共模式代码
- [ ] 修复不规范的webpack配置
- [x] 任意组件服务端异步操作
- [x] 动态加载组件支持服务端异步操作
- [ ] 开发体验相关配置
