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
可自定义服务使用，同时提供koa中间件模块  
服务端通过配置中的webpack输出目录找到打包好的文件  
通过服务端的webpack配置，更改了一些配置，引入了webpack插件，得以支持服务端引用、查找相关文件  
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

#### webpack配置
webpack配置文件中引入lissom/webpack使用  

```javascript
// 引入lissom提供的webpack配置
const lissomWebpack = require('lissom/webpack')

// 需要webpack入口模块改为导出一个组件
module.exports = lissomWebpack(() => {
    ... // 自己的webpack配置，传入函数和对象都可以
})
```

#### webpack入口文件改动
导出react组件  

```javascript
import App from './src/App';
...
// before
// ReactDOM.render(<App />, document.getElementById('root'));

// after
export default App;
```

#### 注意事项
**lissom生成返回的html依赖于webpack的插件html-webpack-plugin来提供**  
**如果你的webpack配置中没有使用此插件来输出html，lissom会自动引入此插件来提供html**  
**如果你的webpack配置中引入多个html-webpack-plugin插件引入，lissom默认只会取第一个插件生成的html，所以有多个时顺序很重要**  

### server
默认导出lissom类，可自定义使用，new创建时传入配置，调用render异步方法传入req，res完成服务端渲染  

```javascript
import Lissom from 'lissom';

const app = new Lissom(options);
...
await app.render(req, res);
...
```

#### node-server
简单的一个示例，lissom拥有处理静态资源的能力  

```javascript
const { createServer } = require('http');
const Lissom = require('lissom');

const config = { output: './build' }
const app = new Lissom(config);
const port = 3000;

createServer((req, res) => {
  app.render(req, res);
}).listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
```

#### koa
提供koa中间件，引入lissom/koa模块  

```javascript
const lissom = require('lissom/koa')

const config = { output: './build' } // config
const app = new Koa();

app.use(lissom(config)) // <- In this use
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
| excludeRouteRegs | array | [/\\/api\\/.*/] | 正则数组，值为正则字符串或正则表达式；koa排除拦截的路由，仅使用koa模块时传入 |
| excludeStaticRegs | array | [] | 正则数组，值为正则字符串或正则表达式；需要忽略处理的静态资源文件 |
| purgeModuleRegs | array | [] | 正则数组，值为正则字符串或正则表达式；开发模式下每次请求都需要清除的模块，可传字符串或正则表达式，默认每次清除所有非/node_modules/里的模块 |
| defaultEntry | string | 索引为0的wepack entry配置 | entry配置key，优选匹配与本次请求路由名相同的key，未匹配到则使用此值指定的key |
| rootAttr | { [attr: string]: string } | `{ id: '__ssr_root__', style: 'height: 100%; display: flex' }` | 设置挂载dom属性 |
| errorHtml | string | '' | html文件路径，报错时需要展示的html页面 |
| isBase64 | boolean | false | 返回html中的数据是否使用base64编码 |

### 异步操作
同next一样，根组件提供静态函数getInitialProps，非根组件有两选择  

1. 根组件中的getInitialProps函数中串发执行子组件的getInitialProps函数
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

2. 使用lissom提供的async函数并发执行所有注册的getInitialProps函数
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

#### ctx对象
| Name | Type | Description |
| ---- | ---- | ----------- |
| req | object | request |
| res | object | response |
| pathname | string | 本次请求渲染的路径 |
| location | object | 同windwos对象的location |
| navigator | object | 同windwos对象的navigator |
| query | object | 请求的参数 |
| asPath | string | req.url的值，真实的请求路径 |

#### async函数配置参数
async函数接收路由字符串或数组，用于匹配请求路径，只有完全匹配时才会调用及渲染  

##### async函数接收组件静态api
静态方法/属性的形式传入配置，同react-loadable的api，提供的能力相同  

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| getInitialProps | async function | null | 异步操作的函数，返回的值会作为props传入当前组件 |
| loading | function/element | defaultLoading | loading组件 |
| unmount | boolean | true | 是否同组件生命周期一样，创建销毁 |

#### 设置全局默认的loading组件
```javascript
import async from 'lissom/async'
...
async.setDefaultLoading(<Loading />)
```

#### **注意事项**
当动态组件有异步操作使用async时，必须放在最外层执行dynamic函数，不能放在render函数中，渲染时能同步拿到组件，但已无法异步获取组件的值了，react不支持异步渲染  

### 动态加载
同dva/dynamic的使用方式，同react-loadable一致的api  

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
同react-loadable的api，提供的能力相同

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| loader | function | - | 动态import组件函数 |
| loading | function/element | defaultLoading | loading组件 |

#### 设置全局默认的loading组件
```javascript
import dynamic from 'lissom/dynamic'
...
dynamic.setDefaultLoading(<Loading />)
```

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
- [x] 完善文档
- [ ] 提供英文文档
- [x] 翻新代码，引入ts，使用es6
- [x] 优化入口、配置代码，提出公共模式代码
- [x] 优化生成html的代码，提高性能render
- [x] 修复不规范的webpack配置，html插件、多入口、无关入口，抛错提示
- [x] 任意组件服务端异步操作
- [x] 动态加载组件支持服务端异步操作
- [x] 优化开发体验，更新打包代码及配置
- [x] 异步操作依赖关系分析，支持并行串行，客户端同理
- [x] 记录开发过程
- [x] 更多的配置，规范命名
- [x] 维护动态加载异步操作队列，同步服务端和客户端的值
- [x] 提供demo项目，不同模式下的简单demo
- [x] 提供带路由的demo
- [ ] 提供性能指标，对比北斗和next的数据分析
- [ ] 提供vue服务端渲染
- [x] 抽离koa中间件，提供koa之外的服务端引入方式
- [x] 服务端提供更丰富的ctx，客户端也增加ctx
- [x] 处理静态资源的能力，根据output目录
- [ ] 添加测试代码
- [ ] 整体流程图
- [x] 精简api，拆分多种模式
- [ ] 普通spa迁移ssr对比文档
- [ ] 多路由非单页面模式，同时提供demo
- [ ] 脚手架搭建工具
- [ ] async、dynamic提供和react-loadable一致的api及能力
- [ ] 尝试改造react支持异步渲染，拦截React的渲染逻辑，开一个尝试版本实验
- [ ] 组件级缓存能力，react-dom-stream/react-ssr-optimization/electrode-react-ssr-cachin
- [ ] 存在多个html-webpack-plugin插件时，分析资源引入，找出匹配的插件而不是只会取第一个

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

### 1.2.6+
- 修复配置参数为空的报错
- 拆分koa中间件，提供koa模块，修改默认导出为Lissom类
- 更新文档

### 1.2.7+
- 增加静态资源处理能力，新增配置excludeStaticRegs
- 修复传入为空的正则数组匹配失效问题

### 1.2.9+
- 修复production模式下，checkDeferredModules方法没找到webpack_runtime chunk
- 修复浏览器不支持Promise时替换all方法报错

### 1.2.14+
- 修复development模式下，webpackJsonp重复缓存模块的问题
