# lissom
轻量级，低接入成本，使用简单  
使用基于webacpk打包的客户端js来完成服务端渲染  
快速渲染、快速开发、快速迁移  

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
const lissomWebpack = require('lissom/webpack')

// 需要webpack入口模块改为导出一个组件
module.exports = lissomWebpack(() => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

### server
koa服务中引入，以中间件的形式

```javascript
const lissom = require('lissom')

const app = new Koa();

app.use(lissom()) // <- In this use

app.use(staticServe(path.join(context, './build')));

app.listen(3000);
```

### 配置参数
| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| dir | string | . | 项目根路径 |
| dev | boolean | process.env.NODE_ENV !== 'production' | 是否为开发模式 |
| output | string | ./public | webpack打包输出目录，output配置 |
| staticMarkup | boolean | false | 是否使用renderToStaticMarkup渲染，默认renderToString |
| generateEtags | boolean | true | 页面请求头是否添加ETag |
| quiet | boolean | false | 是否不输出错误信息 |
| clientRender | boolean | true | 客户端是否渲染，可用来调试服务端渲染输出 |
| serverRender | boolean | true | 服务端是否渲染，可以关闭服务端渲染 |
| requireModules | array | ['superagent'] | 不使用的webpack打包的模块，需要服务端直接从node_modules中require的模块 |
| ignoreModules | array | ['babel-polyfill'] | 服务端忽略执行的模块 |
| excludeRouteRegs | array | [/\\/api\\/.*/] | 正则数组，值为正则字符串或正则表达式；koa排除拦截的路由 |
| purgeModuleRegs | array | [] | 正则数组，值为正则字符串或正则表达式；开发模式下每次请求都需要清除的模块，可传字符串或正则表达式，默认每次清除所有非/node_modules/里的模块 |
| defaultEntry | string | 索引为0的wepack entry配置 | entry配置key，优选匹配与本次请求路由名相同的key，未匹配到则使用此值指定的key |
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
- [ ] 提供404等未匹配路由页面，是否需要？
- [x] 用户端路由切换执行getIninialProps方法
- [x] 分析react组件的getIninialProps的插件，可以再服务端调用嵌套组件的
- [x] 异步模块支持传入多个路由
- [ ] 考虑路由支持正则匹配，白黑名单机制，是否可行？是否在同构时有混乱
- [ ] 优化验证js、css排序问题bug
- [ ] 性能优化，是否有内存泄漏问题
- [ ] ssr缓存，怎样的缓存，是否需要由框架提供？
- [ ] 多语言处理，同样该由谁提供
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
- [ ] 提供带路由的demo
- [ ] 提供性能指标，对比北斗和next的数据分析
- [ ] 提供vue服务端渲染
- [ ] 提供koa之外的服务端引入方式
- [x] 服务端提供更丰富的ctx，客户端也增加ctx
- [ ] 添加测试代码
- [ ] 整体流程图
- [ ] 精简api，拆分多种模式
- [ ] 普通spa迁移ssr对比文档
- [ ] 多路由非但单页面模式，同时提供demo
- [ ] 脚手架搭建工具
- [ ] async、dynamic提供和react-loadable一致的api及能力
- [ ] 尝试改造react支持异步渲染，拦截React的渲染逻辑，开一个尝试版本实验
- [ ] 组件级缓存能力，react-dom-stream/react-ssr-optimization/electrode-react-ssr-cachin

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

### 1.2.2+
- 重构location数据及提供方式，改由ctx提供
- 异步方式提供客户端ctx，保持两端一致
- 精简api，仅仅提供req和res，为koa之外的引入方式做准备
- 维护todo，规划后期要做的事

### 1.2.4+
- 重构render代码，优化server代码，初步增加react-render类
- 拆分rednerHTML，增加renderComponent、renderError方法
- 增加serverRender配置，用于控制是否服务端渲染
- 修复调用async方法报错客户端无法输出问题
