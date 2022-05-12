import React from 'react'
import ReactDOM from 'react-dom'

import { InitialProps, pathMap } from '../lib/async'
import {
  SSR_LOADED_PAGES,
  SSR_LOADER_FUNCTIONS,
  SSR_REGISTER_PAGE,
} from '../lib/constants'
import { loaderFunctions, moduleLoader } from '../lib/dynamic'
import { IssRData } from '../lib/types'
import { get, parseSSRData } from '../lib/utils'

declare global {
  interface Window {
    __SSR_DATA__: string | IssRData
    __SSR_LOADED_PAGES__: any[]
    __SSR_REGISTER_PAGE__: Function
    __SSR_LOADER_FUNCTIONS__: string[]
  }
}

// 客户端挂载dom节点，webpack入口处注入
if (
  typeof window !== 'undefined' &&
  typeof window[SSR_REGISTER_PAGE] !== 'undefined' // 兼容非ssr使用该chunk
) {
  // 添加动态加载函数 id
  window[SSR_LOADER_FUNCTIONS].forEach(fun => {
    loaderFunctions.add(fun)
  })
  // 异步延迟至当前入口模块导出后再执行，入口模块为导出的react组件，一定会是同步执行
  Promise.resolve()
    // 等待动态加载模块完成
    .then(() => Promise.all(moduleLoader))
    .then(() => {
      const {
        props,
        pathname,
        asyncProps,
        clientRender = true,
        serverRender = true,
        rootAttr = {},
      } = parseSSRData()
      if (!clientRender) return void 0

      let isInitialRender = true
      function renderReactElement(reactEl: any, domEl: any) {
        // The check for `.hydrate` is there to support React alternatives like preact
        if (
          serverRender &&
          isInitialRender &&
          typeof ReactDOM.hydrate === 'function'
        ) {
          ReactDOM.hydrate(reactEl, domEl)
          isInitialRender = false
        } else {
          ReactDOM.render(reactEl, domEl)
        }
      }

      // 设置回服务端获取的异步值
      if (asyncProps && asyncProps.length > 0) {
        let mathValue = pathMap.get(pathname)
        // 只有异步模块的路径时需要提前初始化好
        if (!mathValue) {
          InitialProps.init(pathname)
          mathValue = pathMap.get(pathname)
        }
        mathValue.setValue(asyncProps)
      }

      const routers = {}
      const initialRoute = window[SSR_LOADED_PAGES].shift()
      const registerPage = (route: string, { page: Component }: any) => {
        routers[route] = Component

        if (isInitialRender && route === initialRoute) {
          const id = get(rootAttr, 'id', '__ssr_root__')
          const appContainer = document.getElementById(id)
          renderReactElement(<Component {...props} />, appContainer)
          // 避免重复，删除服务端渲染的style元素，客户端渲染时会再生成一份
          const headElement = document.head
          const ssrStyles = document.getElementsByClassName('__ssr_style__')
          Array.from(ssrStyles).forEach(style => {
            headElement.removeChild(style)
          })
        }
      }

      window[SSR_LOADED_PAGES].forEach(([r, m]) => {
        registerPage(r, m)
      })
      window[SSR_LOADED_PAGES] = []
      window[SSR_REGISTER_PAGE] = (r: string, f: any) => registerPage(r, f())
      return
    })
}
