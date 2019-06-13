import { IncomingMessage, ServerResponse } from 'http';
import { ICtx, IRenderOpts, IRouter, ISSRData } from '../lib/types';
import config from './config';
import createHtml from './lib/create-html';
import ErrorDebug from './lib/error-debug';
import Request from './lib/request';
import {
  isResSent,
  loadGetInitialProps,
  loadGetInitialStyles,
  normalizePagePath,
} from './lib/utils';
import { clearAsyncChunks, getAsyncModule } from './lib/webpack-runtime';
import { getRouter, loadComponent } from './require';

export default abstract class Render {
  public renderOpts: IRenderOpts;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.renderOpts = this.getRenderOpts(req, res);
  }

  public abstract validComponent(Component: any, router: IRouter): void;
  public abstract render(Component: any, props?: any): string;

  public getRenderOpts(req: IncomingMessage, res: ServerResponse): IRenderOpts {
    const { clientRender, serverRender, rootAttr, isBase64 } = config.get();
    const request = new Request(req);
    const { location, navigator, pathname, query } = request;
    const { routers } = config.getAssetsConfig();
    const page = normalizePagePath(pathname);
    const router = getRouter(page, routers);
    // 保持兼容next
    const ctx: ICtx = {
      req,
      res,
      pathname: page,
      location,
      navigator,
      query,
      asPath: req.url,
    };
    const ssrData: ISSRData = {
      props: {},
      asyncProps: [],
      pathname,
      clientRender,
      serverRender,
      rootAttr,
      isBase64,
    };

    return {
      ctx,
      page,
      pathname,
      router,
      request,
      ssrData,
    };
  }

  public updateSsrData(data: any) {
    const { ssrData } = this.renderOpts;
    this.renderOpts.ssrData = {
      ...ssrData,
      ...data,
    };
  }

  public async renderComponent() {
    const { ctx, router, pathname } = this.renderOpts;
    const { dev } = config.get();
    const Component = loadComponent({ router, dev });
    if (dev) {
      this.validComponent(Component, router);
    }

    const props = await loadGetInitialProps(Component, ctx);
    // 查找获取所有异步组件的异步操作
    const asyncProps = await getAsyncProps({ ctx, props, pathname });
    // 清理异步操作中注册的异步chunks，这一步是必须的
    clearAsyncChunks();
    // render时注册的异步chunks才是真正需要加载的
    const pageHTML = this.render(Component, props);
    // 必须放在render组件之后获取
    const Styles = await loadGetInitialStyles(Component, ctx);
    const styleHTML = this.render(Styles);
    this.updateSsrData({ props, asyncProps });

    return this.renderHTML(pageHTML, styleHTML);
  }

  public renderError(error: any): string {
    const { dev } = config.get();
    const { errorHtml } = config.getAssetsConfig();
    if (errorHtml) return errorHtml;

    // 停止客户端渲染
    this.updateSsrData({ clientRender: false });
    const pageHTML = ErrorDebug({ error, dev });
    return this.renderHTML(pageHTML);
  }

  public renderHTML(pageHTML?: string, styleHTML?: string): string {
    const { res } = this.renderOpts.ctx;
    if (isResSent(res)) return null;

    const { router, ssrData } = this.renderOpts;
    const { parseHtml } = config.getAssetsConfig();

    const html = createHtml({
      pageHTML,
      styleHTML,
      parseHtml,
      router,
      ssrData,
    });
    return html;
  }
}

async function getAsyncProps({
  ctx,
  props,
  pathname,
}: {
  ctx: ICtx;
  props: any;
  pathname: string;
}) {
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
