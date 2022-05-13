# lissom

轻量级，低接入成本，使用简单  
使用基于 webacpk 打包的客户端 js 来完成服务端渲染  
快速渲染、快速开发、快速迁移

## 安装

npm install lissom --save

## 说明

服务端和客户端共用同一套 webpack 打包的 js 来渲染  
提供服务端 webpack 配置，用户客户端的 webpack 不需要做任何改动  
和客户端开发一样启动 webpack，但确保打包出真实的文件，以供服务端使用  
可自定义服务使用，同时提供 koa 中间件模块  
服务端通过配置中的 webpack 输出目录找到打包好的文件  
通过服务端的 webpack 配置，更改了一些配置，引入了 webpack 插件，得以支持服务端引用、查找相关文件  
拦截页面级请求，返回渲染页面  
提供组件的动态加载、异步操作

### 文档

- [介绍](./docs/介绍.md)
- [实现思路](./docs/实现思路.md)
- [动态加载](./docs/动态加载.md)
- [异步操作](./docs/异步操作.md)
- [开发总结](./docs/开发总结.md)

## 使用

### webpack

#### webpack 配置

webpack 配置文件中引入 lissom/webpack 使用

```javascript
// 引入lissom提供的webpack配置
const lissomWebpack = require('lissom/webpack')

// 需要webpack入口模块改为导出一个组件
module.exports = lissomWebpack(() => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

#### webpack 入口文件改动

导出 react 组件

```javascript
import App from './src/App';
...
// before
// ReactDOM.render(<App />, document.getElementById('root'));

// after
export default App;
```

#### 注意事项

**lissom 生成返回的 html 依赖于 webpack 的插件 html-webpack-plugin 来提供**  
**如果你的 webpack 配置中没有使用此插件来输出 html，lissom 会自动引入此插件来提供 html**  
**如果你的 webpack 配置中引入多个 html-webpack-plugin 插件引入，lissom 默认只会取第一个插件生成的 html，所以有多个时顺序很重要**

### server

默认导出 lissom 类，可自定义使用，new 创建时传入配置，调用 render 异步方法传入 req，res 完成服务端渲染

```javascript
import Lissom from 'lissom';

const app = new Lissom(options);
...
await app.render(req, res);
...
```

#### node-server

简单的一个示例，lissom 拥有处理静态资源的能力

```javascript
const { createServer } = require('http')
const Lissom = require('lissom')

const config = { output: './build' }
const app = new Lissom(config)
const port = 3000

createServer((req, res) => {
  app.render(req, res)
}).listen(port, err => {
  if (err) throw err
  console.log(`> Ready on http://localhost:${port}`)
})
```

#### koa

提供 koa 中间件，引入 lissom/koa 模块

```javascript
const lissom = require('lissom/koa')

const config = { output: './build' } // config
const app = new Koa()

app.use(lissom(config)) // <- In this use
app.listen(3000)
```

#### Express

提供 Express 中间件，引入 lissom/express 模块

```javascript
const lissom = require('lissom/express')

const config = { output: './build' } // config
const app = new Express()

app.use(lissom(config)) // <- In this use
app.listen(3000)
```

### 配置参数

| Name              | Type                       | Default                                                        | Description                                                                                                                                |
| ----------------- | -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| dir               | string                     | .                                                              | 项目根路径                                                                                                                                 |
| dev               | boolean                    | process.env.NODE_ENV !== 'production'                          | 是否为开发模式                                                                                                                             |
| output            | string                     | ./public                                                       | webpack 打包输出目录，output 配置                                                                                                          |
| staticMarkup      | boolean                    | false                                                          | 是否使用 renderToStaticMarkup 渲染，默认 renderToString                                                                                    |
| generateEtags     | boolean                    | true                                                           | 页面请求头是否添加 ETag                                                                                                                    |
| quiet             | boolean                    | false                                                          | 是否不输出错误信息                                                                                                                         |
| clientRender      | boolean                    | true                                                           | 客户端是否渲染，可用来调试服务端渲染输出                                                                                                   |
| serverRender      | boolean                    | true                                                           | 服务端是否渲染，可以关闭服务端渲染                                                                                                         |
| requireModules    | array                      | ['superagent', 'react']                                        | 不使用的 webpack 打包的模块，需要服务端直接从 node_modules 中 require 的模块                                                               |
| ignoreModules     | array                      | ['babel-polyfill']                                             | 服务端忽略执行的模块                                                                                                                       |
| excludeRouteRegs  | array                      | [/\\/api\\/.*/]                                                | 正则数组，值为正则字符串或正则表达式；koa 排除拦截的路由，仅使用 koa 模块时传入                                                            |
| excludeStaticRegs | array                      | []                                                             | 正则数组，值为正则字符串或正则表达式；需要忽略处理的静态资源文件                                                                           |
| purgeModuleRegs   | array                      | []                                                             | 正则数组，值为正则字符串或正则表达式；开发模式下每次请求都需要清除的模块，可传字符串或正则表达式，默认每次清除所有非/node_modules/里的模块 |
| defaultEntry      | string                     | 索引为 0 的 wepack entry 配置                                  | entry 配置 key，优选匹配与本次请求路由名相同的 key，未匹配到则使用此值指定的 key                                                           |
| rootAttr          | { [attr: string]: string } | `{ id: '__ssr_root__', style: 'height: 100%; display: flex' }` | 设置挂载 dom 属性                                                                                                                          |
| errorHtml         | string                     | ''                                                             | html 文件路径，报错时需要展示的 html 页面                                                                                                  |
| isBase64          | boolean                    | false                                                          | 返回 html 中的数据是否使用 base64 编码                                                                                                     |

### 异步操作

同 next 一样，根组件提供静态函数 getInitialProps，非根组件有两选择

1. 根组件中的 getInitialProps 函数中串发执行子组件的 getInitialProps 函数

```javascript
import React from 'react'
import ChildComponent from './child-component'
...
export default class RootCompoent extends React.Component {
  static async getInitialProps(ctx) {
    const asyncData = await fetchData()
    const childData = await ChildComponent.getInitialProps()

    return { asyncData, childData }
  }

  render() {
    const { asyncData, childData } = this.props

    return (
      <ChildComponent asyncData={asyncData} {...childData} />
    )
  }
}
```

2. 使用 lissom 提供的 async 函数并发执行所有注册的 getInitialProps 函数

```javascript
// 引入异步操作高阶函数
import async from 'lissom/async'
...
// 传入渲染该组件的路由
// 必须写在外面，保证代码加载进来时就执行
// 可传入字符串路径或数组路径
@async('/path') // @async(['/path1', '/path2', ...])
export default class AsyncComponent extends React.Component {
  // 异步请求，参数为服务端ctx、根组件的异步函数返回值、顺序引入的组件同步返回值promise组成的数组
  static async getInitialProps(ctx, rootCompoentGetInitialProps, asyncPromiseList) {
    const asyncData = await fetchProps()
    return { asyncData }
  }
  // 执行异步操作时展示的加载组件，客户端需要
  static loading = () => {
    return (
      <div>Loading</div>
    )
  }
  // 生命周期componentWillUnmount时是否清除getInitialProps的返回值
  // 即下一次重新render组件时再次调用getInitialProps
  static unmount = true
  ...
  render() {
    // getInitialProps返回的值
    const { asyncData } = this.props

    return (
      <Component />
    )
  }
}
...
```

#### ctx 对象

| Name      | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| req       | object | request                      |
| res       | object | response                     |
| pathname  | string | 本次请求渲染的路径           |
| location  | object | 同 windwos 对象的 location   |
| navigator | object | 同 windwos 对象的 navigator  |
| query     | object | 请求的参数                   |
| asPath    | string | req.url 的值，真实的请求路径 |

#### async 函数配置参数

async 函数接收路由字符串或数组，用于匹配请求路径，只有完全匹配时才会调用及渲染

##### async 函数接收组件静态 api

静态方法/属性的形式传入配置，同 react-loadable 的 api，提供的能力相同

| Name            | Type             | Default        | Description                                       |
| --------------- | ---------------- | -------------- | ------------------------------------------------- |
| getInitialProps | async function   | null           | 异步操作的函数，返回的值会作为 props 传入当前组件 |
| loading         | function/element | defaultLoading | loading 组件                                      |
| unmount         | boolean          | true           | 是否同组件生命周期一样，创建销毁                  |

#### 设置全局默认的 loading 组件

```javascript
import async from 'lissom/async'
...
async.setDefaultLoading(<Loading />)
```

#### **注意事项**

当动态组件有异步操作使用 async 时，必须放在最外层执行 dynamic 函数，不能放在 render 函数中，渲染时能同步拿到组件，但已无法异步获取组件的值了，react 不支持异步渲染

### 动态加载

同 dva/dynamic 的使用方式，同 react-loadable 一致的 api

```javascript
// 引入动态加载高阶函数
import dynamic from 'lissom/dynamic'
...
const dynamicConfig = {
  loader: () => import('./dynamic'),
  loading: () => {
    return (
      <div>Loading</div>
    )
  }
}
// 可以写在任意位置，外部提前引用，在动态组件有异步操作时必须写在这里
// const Component = dynamic(dynamicConfig)

export default class DynamicComponent extends React.Component {
  ...
  render() {
    // 或者同步的render方法里
    const Component = dynamic(dynamicConfig)

    return (
      <Component />
    )
  }
}
```

#### 配置参数

同 react-loadable 的 api，提供的能力相同

| Name    | Type             | Default        | Description          |
| ------- | ---------------- | -------------- | -------------------- |
| loader  | function         | -              | 动态 import 组件函数 |
| loading | function/element | defaultLoading | loading 组件         |

#### 设置全局默认的 loading 组件

```javascript
import dynamic from 'lissom/dynamic'
...
dynamic.setDefaultLoading(<Loading />)
```

## 约束

- react
- webpbak4

仅支持 react 服务端渲染，仅提供了 koa 中间件服务，且整体实现依赖于 webpack4  
ssr 没有银弹，我提供能力，你遵循约束  
ssr 渲染并不是适用于所有情况，如何使用、最佳实践根据实际情况考虑选择

## TODO

- [x] 服务端能够使用客户端打包的 js 去渲染
- [x] 提供简洁的 api
- [x] 编写 webpack 插件，分析打包 js 路径，chunk 及模块资源的分析
- [x] 支持单入口形式
- [x] 支持多入口形式
- [x] redux 同构、dva 处理
- [x] 其他细节处理，全局对象、平台判断，提供统一的数据格式
- [x] 动态加载处理，服务端客户端 js 支持同步模式取用
- [x] 服务端处理生成 style 标签的样式文件，提供服务端 style-loader 模块，客户端提供清除
- [x] 优化入口 js 配置取用
- [ ] 动态加载处理，客户端 css 返回 promise 处理，修改注入 chunkjs 依赖数组
- [x] 异常处理，服务端不阻断执行，客户端报错展示，呈现错误堆栈信息
- [x] 缓存 webpack 查找的模块
- [ ] 服务端支持引入 dll
- [ ] 提供 404 等未匹配路由页面，是否需要？
- [x] 用户端路由切换执行 getIninialProps 方法
- [x] 分析 react 组件的 getIninialProps 的插件，可以再服务端调用嵌套组件的
- [x] 异步模块支持传入多个路由
- [ ] 考虑路由支持正则匹配，白黑名单机制，是否可行？是否在同构时有混乱
- [ ] 优化验证 js、css 排序问题 bug
- [ ] 性能优化，是否有内存泄漏问题
- [ ] ssr 缓存，怎样的缓存，是否需要由框架提供？
- [ ] 多语言处理，同样该由谁提供
- [x] 完善文档
- [ ] 提供英文文档
- [x] 翻新代码，引入 ts，使用 es6
- [x] 优化入口、配置代码，提出公共模式代码
- [x] 优化生成 html 的代码，提高性能 render
- [x] 修复不规范的 webpack 配置，html 插件、多入口、无关入口，抛错提示
- [x] 任意组件服务端异步操作
- [x] 动态加载组件支持服务端异步操作
- [x] 优化开发体验，更新打包代码及配置
- [x] 异步操作依赖关系分析，支持并行串行，客户端同理
- [x] 记录开发过程
- [x] 更多的配置，规范命名
- [x] 维护动态加载异步操作队列，同步服务端和客户端的值
- [x] 提供 demo 项目，不同模式下的简单 demo
- [x] 提供带路由的 demo
- [ ] 提供性能指标，对比北斗和 next 的数据分析
- [ ] 提供 vue 服务端渲染
- [x] 抽离 koa 中间件，提供 koa 之外的服务端引入方式
- [x] 服务端提供更丰富的 ctx，客户端也增加 ctx
- [x] 处理静态资源的能力，根据 output 目录
- [ ] 添加测试代码
- [ ] 整体流程图
- [x] 精简 api，拆分多种模式
- [ ] 普通 spa 迁移 ssr 对比文档
- [ ] 多路由非单页面模式，同时提供 demo
- [ ] 脚手架搭建工具
- [ ] async、dynamic 提供和 react-loadable 一致的 api 及能力
- [ ] 尝试改造 react 支持异步渲染，拦截 React 的渲染逻辑，开一个尝试版本实验
- [ ] 组件级缓存能力，react-dom-stream/react-ssr-optimization/electrode-react-ssr-cachin
- [ ] 存在多个 html-webpack-plugin 插件时，分析资源引入，找出匹配的插件而不是只会取第一个

## Changelog

### 1.\*

- 一阶段开发，基础版本，实现想法
- 重构代码，整理结构，引入 ts
- 优化开发体验，日志输出，同步更新代码及配置
- 满足部分场景，错误修复及提示
- 编写基础 examples，跑通 demo

### 1.2.0+

- 二阶段开发，准正式版本
- 二次重构，增加配置
- 异常处理，优化性能

### 1.2.2+

- 重构 location 数据及提供方式，改由 ctx 提供
- 异步方式提供客户端 ctx，保持两端一致
- 精简 api，仅仅提供 req 和 res，为 koa 之外的引入方式做准备
- 维护 todo，规划后期要做的事

### 1.2.4+

- 重构 render 代码，优化 server 代码，初步增加 react-render 类
- 拆分 rednerHTML，增加 renderComponent、renderError 方法
- 增加 serverRender 配置，用于控制是否服务端渲染
- 修复调用 async 方法报错客户端无法输出问题

### 1.2.6+

- 修复配置参数为空的报错
- 拆分 koa 中间件，提供 koa 模块，修改默认导出为 Lissom 类
- 更新文档

### 1.2.7+

- 增加静态资源处理能力，新增配置 excludeStaticRegs
- 修复传入为空的正则数组匹配失效问题

### 1.2.9+

- 修复 production 模式下，checkDeferredModules 方法没找到 webpack_runtime chunk
- 修复浏览器不支持 Promise 时替换 all 方法报错

### 1.2.14+

- 修复 development 模式下，webpackJsonp 重复缓存模块的问题

### 1.2.15+

- 修复 development 模式下，require.cache 父模块引用缓存未清除造成的内存泄漏问题
- 修复 development 模式下，js-base64 模块引用全局模块多次加载循环引用造成的内存泄漏问题

### 1.2.16+

- 修复服务端下 react 和 react-dom 不在同一环境下，导致使用 react hooks 报错的问题

### 1.3.0+

- 移除 koa-router 依赖，升级所有 package.json 依赖，支持 express 中间件

### 1.3.1+

- 修复 style-loader1.1+版本参数变导致服务端运行时 style 样式获取错误的 bug

### 1.4.0+
- 重构动态加载异步处理方式
- 增加 isSsrRender 函数判断兼容同时可以走客户端渲染
- 添加 htmlparser2 依赖，重构 html 解析生成代码
- 添加 ssg 模块，支持 ssg 生成
- 修复 HtmlWebpackPlugin 导出配置
