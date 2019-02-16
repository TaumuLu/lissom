import React from 'react';
import ReactDOM from 'react-dom';
import { pathMap } from '../lib/async';

declare global {
  interface Window {
    __SSR_DATA__: {
      props: any;
      pathname: string;
      asyncProps: any[];
      clientRender: boolean;
      elementId: string;
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
      elementId = '__ssr__',
    } = window.__SSR_DATA__;
    if (!clientRender) return void 0;

    let isInitialRender = true;
    function renderReactElement(reactEl, domEl) {
      // The check for `.hydrate` is there to support React alternatives like preact
      if (isInitialRender && typeof ReactDOM.hydrate === 'function') {
        ReactDOM.hydrate(reactEl, domEl);
        isInitialRender = false;
      } else {
        ReactDOM.render(reactEl, domEl);
      }
    }

    const initialRoute = window.__SSR_LOADED_PAGES__.shift();
    const mathValue = pathMap.get(pathname);
    // 设置回服务端获取的异步值
    if (mathValue) {
      mathValue.setValue(asyncProps);
    }

    const routers = {};
    const registerPage = (route, { page: Component }) => {
      routers[route] = Component;

      if (isInitialRender && route === initialRoute) {
        const appContainer = document.getElementById('__ssr__' || elementId);
        renderReactElement(<Component {...props} />, appContainer);
      }
    };

    window.__SSR_LOADED_PAGES__.forEach(([r, m]) => {
      registerPage(r, m);
    });
    delete window.__SSR_LOADED_PAGES__;
    window.__SSR_REGISTER_PAGE__ = (r, f) => registerPage(r, f());
  });
}
