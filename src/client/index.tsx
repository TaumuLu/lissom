import React from 'react';
import ReactDOM from 'react-dom';
import { InitialProps, pathMap } from '../lib/async';
import { get } from '../lib/utils';

declare global {
  interface Window {
    __SSR_DATA__: {
      props: any;
      pathname: string;
      asyncProps: any[];
      clientRender: boolean;
      serverRender: boolean;
      rootAttr: { [attr: string]: string };
    };
    __SSR_LOADED_PAGES__: any[];
    __SSR_REGISTER_PAGE__: Function;
  }
}

// 客户端挂载dom节点，webpack入口处注入
if (
  typeof window !== 'undefined' &&
  typeof window.__SSR_REGISTER_PAGE__ !== 'undefined' // 兼容非ssr使用该chunk
) {
  // 异步延迟至当前入口模块导出后再执行，入口模块为导出的react组件，一定会是同步执行
  Promise.resolve().then(() => {
    const {
      props,
      pathname,
      asyncProps,
      clientRender = true,
      serverRender = true,
      rootAttr = {},
    } = window.__SSR_DATA__;
    if (!clientRender) return void 0;

    let isInitialRender = true;
    function renderReactElement(reactEl, domEl) {
      // The check for `.hydrate` is there to support React alternatives like preact
      if (
        serverRender &&
        isInitialRender &&
        typeof ReactDOM.hydrate === 'function'
      ) {
        ReactDOM.hydrate(reactEl, domEl);
        isInitialRender = false;
      } else {
        ReactDOM.render(reactEl, domEl);
      }
    }

    // 设置回服务端获取的异步值
    if (asyncProps && asyncProps.length > 0) {
      let mathValue = pathMap.get(pathname);
      // 只有异步模块的路径时需要提前初始化好
      if (!mathValue) {
        InitialProps.init(pathname);
        mathValue = pathMap.get(pathname);
      }
      mathValue.setValue(asyncProps);
    }

    const routers = {};
    const initialRoute = window.__SSR_LOADED_PAGES__.shift();
    const registerPage = (route, { page: Component }) => {
      routers[route] = Component;

      if (isInitialRender && route === initialRoute) {
        const id = get(rootAttr, 'id', '__ssr_root__');
        const appContainer = document.getElementById(id);
        renderReactElement(<Component {...props} />, appContainer);
        // 避免重复，删除服务端渲染的style元素，客户端渲染时会再生成一份
        const headElement = document.head;
        const ssrStyles = document.getElementsByClassName('__ssr_style__');
        Array.from(ssrStyles).forEach(style => {
          headElement.removeChild(style);
        });
      }
    };

    window.__SSR_LOADED_PAGES__.forEach(([r, m]) => {
      registerPage(r, m);
    });
    delete window.__SSR_LOADED_PAGES__;
    window.__SSR_REGISTER_PAGE__ = (r, f) => registerPage(r, f());
  });
}
