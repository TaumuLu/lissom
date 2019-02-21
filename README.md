# lissom
轻量级，低接入成本，使用简单  
使用基于webacpk打包的客户端js来完成服务端渲染  

## 安装
npm install lissom --save

## 说明
服务端和客户端共用同一套webpack打包的js来渲染  
提供服务端webpack配置，用户客户端的webpack不需要做任何改动  
和客户端开发一样启动webpack，但确保打包出真实的文件，以供服务端使用  
启动koa服务，koa中间件形式引入lissom服务，并传入配置参数  
服务端通过配置中的webpack输出目录找到打包好的文件  
通过服务端的webpack配置，更改了一些配置，引入了webpack插件，得以支持服务端引用、查找相关文件  
通过koa-router拦截页面级请求，返回渲染页面  
提供组件的动态加载、异步操作  

### 文档
- [介绍](./docs/介绍.md)
- [实现思路](./docs/实现思路.md)
- [动态加载](./docs/动态加载.md)
- [异步操作](./docs/异步操作.md)

## examples
[examples](./examples/README.md)

## 使用

### webpack配置
webpack配置文件中引入

```javascript
// 引入lissom提供的webpack配置
const ssrWebpack = require('lissom/webpack')

module.exports = ssrWebpack(() => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

### ssr服务
koa服务中引入，以中间件的形式

```javascript
const ssrRouter = require('lissom')
...
app.use(await ssrRouter())
...
```

### 配置参数
| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| dir | string | . | 项目根路径 |
| dev | boolean | process.env.NODE_ENV !== 'production' | 是否为开发模式 |
| output | string | ./public | 服务端读取webpack的打包目录，同webpack配置中的output |
| staticMarkup | boolean | false | 是否使用renderToStaticMarkup渲染，默认renderToString |
| generateEtags | boolean | true | 页面请求头是否添加ETag |
| quiet | boolean | false | 是否隐藏错误信息 |
| clientRender | boolean | true | 客户端是否渲染 |
| requireModules | array | ['superagent'] | 服务端不使用打包模块，直接require在node_modules中的模块 |
| ignoreModules | array | ['babel-polyfill'] | 服务端忽略执行的模块 |
| excludeRouteRegs | array | [/\\/api\\/.*/] | 正则数组，排除拦截的路由，可传字符串或正则表达式 |
| purgeModuleRegs | array | [] | 正则数组，开发模式下每次请求需要清除的模块，可传字符串或正则表达式，默认清除所有非/node_modules/里的模块 |
| defaultEntry | string | 索引为0的wepack入口配置 | webpack入口配置name，优选匹配与本次请求路由名相同的入口name，未匹配到则使用此值指定的入口name |
| rootAttr | { [attr: string]: string } | `{ id: '__ssr_root__', style: 'height: 100%; display: flex' }` | 设置挂载dom属性 |

## 约束
- koa
- react
- webpbak4

仅支持react服务端渲染，仅提供了koa中间件服务，且整体实现依赖于webpack4  
ssr没有银弹，我提供能力，你遵循约束  
ssr渲染并不是适用于所有情况，如何使用、最佳实践根据实际情况考虑选择  

## TODO
- [x] 服务端能够使用客户端打包的js去渲染
- [x] 提供简洁的api
- [x] 编写webpack插件，分析打包js路径，chunk及模块资源的分析
- [x] 支持单入口形式
- [x] 支持多入口形式
- [x] redux同构、dva处理
- [x] 其他细节处理，全局对象、平台判断，提供统一的数据格式
- [x] 动态加载处理，服务端客户端js支持同步模式取用
- [x] 服务端处理生成style标签的样式文件，提供服务端style-loader模块，客户端提供清除
- [x] 优化入口js配置取用
- [ ] 动态加载处理，客户端css返回promise处理，修改注入chunkjs依赖数组
- [x] 异常处理，服务端不阻断执行，客户端报错展示，呈现错误堆栈信息
- [x] 缓存webpack查找的模块
- [ ] 服务端支持引入dll
- [ ] 提供404等未匹配路由页面，是否需要?
- [x] 用户端路由切换执行getIninialProps方法
- [x] 分析react组件的getIninialProps的插件，可以再服务端调用嵌套组件的
- [x] 异步模块支持传入多个路由
- [ ] 考虑路由支持正则匹配，白黑名单机制，是否可行？是否在同构时有混乱
- [ ] 优化验证js、css排序问题bug
- [ ] 性能优化，是否有内存泄漏问题
- [ ] ssr缓存
- [ ] 多语言处理
- [ ] 完善文档
- [x] 翻新代码，引入ts，使用es6
- [x] 优化入口、配置代码，提出公共模式代码
- [x] 优化生成html的代码，提高性能render
- [x] 修复不规范的webpack配置，html插件、多入口、无关入口，抛错提示
- [x] 任意组件服务端异步操作
- [x] 动态加载组件支持服务端异步操作
- [x] 优化开发体验，更新打包代码及配置
- [x] 异步操作依赖关系分析，支持并行串行，客户端同理
- [ ] 记录开发过程
- [x] 更多的配置，规范命名
- [x] 维护动态加载异步操作队列，同步服务端和客户端的值
- [x] 提供demo项目，不同模式下的简单demo
- [ ] 提供性能指标，对比北斗和next的数据分析
- [ ] 提供vue服务端渲染
- [ ] 提供koa之外的服务端引入方式

## Changelog

### 1.*
- 一阶段开发，基础版本，实现想法
- 重构代码，整理结构，引入ts
- 优化开发体验，日志输出，同步更新代码及配置
- 满足部分场景，错误修复及提示
- 编写基础examples，跑通demo

### 1.2.0+
- 二阶段开发，准正式版本
- 二次重构，增加配置
- 异常处理，优化性能
