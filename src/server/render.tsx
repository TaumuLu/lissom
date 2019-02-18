import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import config from './config';
import createHtml from './lib/create-html';
import {
  isResSent,
  loadGetInitialProps,
  loadGetInitialStyles,
  normalizePagePath,
} from './lib/utils';
import { clearAsyncChunks, getAsyncModule } from './lib/webpack-runtime';
import { getRouter, loadComponents } from './require';

export function renderToHTML(req, res, pathname, query) {
  const options = config.get();
  const assetsConfig = config.getAssetsConfig();
  return doRender(req, res, pathname, query, { ...options, ...assetsConfig });
}

export function renderErrorToHTML(err, req, res, pathname, query) {
  const options = config.get();
  const assetsConfig = config.getAssetsConfig();
  return doRender(req, res, pathname, query, {
    ...options,
    ...assetsConfig,
    err,
    page: '/_error',
  });
}

async function doRender(
  req,
  res,
  pathname,
  query,
  {
    err,
    page,
    dev,
    staticMarkup,
    routers,
    htmlConfig,
    clientRender,
    elementId,
  }: any
) {
  page = normalizePagePath(page || pathname);
  const router = getRouter({ page, routers });
  const { Component } = await loadComponents({ router, dev });
  // 保持兼容next
  const ctx = { err, req, res, pathname: page, query, asPath: req.url };

  if (isResSent(res)) return null;
  if (dev) {
    const { isValidElementType } = require('react-is');
    if (!isValidElementType(Component)) {
      throw new Error(
        `The default export is not a React Component in page: "${page}"`
      );
    }
  }

  const render = getRender({ staticMarkup });
  const props = await loadGetInitialProps(Component, ctx);
  // 查找获取所有异步组件的异步操作
  const asyncProps = await getAsyncProps({ ctx, props, pathname });
  // 清理异步操作中注册的异步chunks，这一步是必须的
  clearAsyncChunks();
  // render时注册的异步chunks才是真正需要加载的
  const pageHTML = render(<Component {...props} />);
  // 必须放在render组件之后获取
  const Styles = await loadGetInitialStyles(Component, ctx);
  const styleHTML = render(Styles);
  const ssrData = { props, asyncProps, pathname, clientRender, elementId };

  const html = await createHtml({
    pageHTML,
    styleHTML,
    htmlConfig,
    router,
    ssrData,
  });
  return html;
}

const getRender = ({ staticMarkup }) => reactElement => {
  const render = staticMarkup ? renderToStaticMarkup : renderToString;
  if (reactElement) {
    return render(reactElement);
  }
  return '';
};

async function getAsyncProps({ ctx, props, pathname }) {
  const asyncModule = getAsyncModule();
  if (asyncModule && asyncModule.pathMap) {
    const { pathMap } = asyncModule;
    const mathValue = pathMap.get(pathname);
    if (mathValue) {
      const asyncProps = await mathValue.getValue(ctx, props);
      return asyncProps;
    }
  }
  return [];
}
