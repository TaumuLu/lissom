import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { IAssetsConfig, IConfig, ICtx, IQuery, ISSRData } from '../lib/types';
import config from './config';
import createHtml from './lib/create-html';
import {
  isResSent,
  loadGetInitialProps,
  loadGetInitialStyles,
  normalizePagePath,
  printAndExit,
} from './lib/utils';
import { clearAsyncChunks, getAsyncModule } from './lib/webpack-runtime';
import { getRouter, loadComponents } from './require';

export function renderToHTML(
  req: any,
  res: any,
  pathname: string,
  query: IQuery
) {
  const options = config.get();
  const assetsConfig = config.getAssetsConfig();
  return doRender(req, res, pathname, query, options, assetsConfig);
}

export function renderErrorToHTML(
  error: any,
  req: any,
  res: any,
  pathname: string,
  query: IQuery
) {
  const options = config.get();
  const assetsConfig = config.getAssetsConfig();
  return doRender(
    req,
    res,
    pathname,
    query,
    {
      ...options,
      error,
      page: '/_error',
    },
    assetsConfig
  );
}

interface IRenderConfig extends IConfig {
  error?: any;
  page?: string;
}

async function doRender(
  req: any,
  res: any,
  pathname: string,
  query: IQuery,
  { error, page, dev, staticMarkup, clientRender, rootAttr }: IRenderConfig,
  { routers, parseHtml }: IAssetsConfig
) {
  if (error) {
    clientRender = false;
  }
  page = normalizePagePath(page || pathname);
  const router = getRouter(page, routers);
  const { Component } = await loadComponents({ router, error, dev });
  if (isResSent(res)) return null;

  // 保持兼容next
  const ctx: ICtx = { error, req, res, pathname: page, query, asPath: req.url };
  if (dev) {
    const { isValidElementType } = require('react-is');
    if (!isValidElementType(Component)) {
      printAndExit(
        `The default export is not a React Component in webpack entry: "${
          router.name
        }"`
      );
    }
  }

  const render = getRender({ staticMarkup });
  const props = await loadGetInitialProps(Component, ctx);
  // 查找获取所有异步组件的异步操作
  const asyncProps = await getAsyncProps({ ctx, props, pathname, error });
  // 清理异步操作中注册的异步chunks，这一步是必须的
  clearAsyncChunks();
  // render时注册的异步chunks才是真正需要加载的
  const pageHTML = render(<Component error={error} {...props} />);
  // 必须放在render组件之后获取
  const Styles = await loadGetInitialStyles(Component, ctx);
  const styleHTML = render(Styles);
  const ssrData: ISSRData = {
    props,
    asyncProps,
    pathname,
    clientRender,
    rootAttr,
  };
  if (isResSent(res)) return null;

  const html = createHtml({
    pageHTML,
    styleHTML,
    parseHtml,
    router,
    ssrData,
    rootAttr,
  });
  return html;
}

const getRender = ({ staticMarkup }: { staticMarkup: boolean }): Function => (
  reactElement
): string => {
  const render = staticMarkup ? renderToStaticMarkup : renderToString;
  if (reactElement) {
    return render(reactElement);
  }
  return '';
};

async function getAsyncProps({
  ctx,
  props,
  pathname,
  error,
}: {
  ctx: ICtx;
  props: any;
  pathname: string;
  error: any;
}) {
  if (error) return [];
  const asyncModule = getAsyncModule();
  if (asyncModule && asyncModule.pathMap) {
    const { pathMap } = asyncModule;
    const mathValue = pathMap.get(pathname);
    if (mathValue) {
      const asyncProps = await mathValue.getValue(ctx, props, pathname);
      return asyncProps;
    }
  }
  return [];
}
