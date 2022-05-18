import { IncomingMessage, ServerResponse } from 'http'

import { ICtx, ILocation, IRouter, IssRData } from '../lib/types'
import config from './config'
import createHtml, { HTMLs } from './lib/create-html'
import ErrorDebug from './lib/error-debug'
import Request from './lib/request'
import {
  isResSent,
  loadGetInitialHead,
  loadGetInitialProps,
  loadGetInitialStyle,
  normalizePagePath,
} from './lib/utils'
import {
  getAsyncModule,
  getDynamicModule,
  getRouterModule,
} from './lib/webpack-runtime'
import { getRouter, loadComponent } from './require'

export interface IRenderOpts {
  ctx: ICtx
  page: string
  pathname: string
  router: IRouter
  request: Request
  ssrData: IssRData
}

export default abstract class Render {
  public renderOpts: IRenderOpts

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.renderOpts = this.getRenderOpts(req, res)
  }

  public abstract validComponent(Component: any, router: IRouter): void
  public abstract render(Component: any, props?: any): string

  public getRenderOpts(req: IncomingMessage, res: ServerResponse): IRenderOpts {
    const { clientRender, serverRender, rootAttr, isBase64 } = config.get()
    const request = new Request(req)
    const { location, navigator, pathname, query } = request
    const { routers, publicPath } = config.getAssetsConfig()
    const page = normalizePagePath(pathname)
    const router = getRouter(page, routers)
    // 保持兼容next
    const ctx: ICtx = {
      req,
      res,
      pathname: page,
      location,
      navigator,
      query,
      asPath: request.url,
    }
    const ssrData: IssRData = {
      props: {},
      asyncProps: [],
      pathname,
      clientRender,
      serverRender,
      rootAttr,
      isBase64,
      publicPath,
    }

    return {
      ctx,
      page,
      pathname,
      router,
      request,
      ssrData,
    }
  }

  public updateSsrData(data: any) {
    const { ssrData } = this.renderOpts
    this.renderOpts.ssrData = {
      ...ssrData,
      ...data,
    }
  }

  public async renderComponent() {
    const { ctx, router, pathname } = this.renderOpts
    const { dev } = config.get()
    const Component = loadComponent({ router, dev })
    if (dev) {
      this.validComponent(Component, router)
    }

    const props = await loadGetInitialProps(Component, ctx)
    // 查找获取所有异步组件的异步操作
    const asyncProps = await getAsyncProps({ ctx, props, pathname })

    await Promise.all(getDynamicLoader())

    // 清理异步操作中注册的异步chunks，这一步是必须的
    clearDynamicLoader()
    // 设置 router location 对象
    setRouterModuleLocation(ctx.location)

    // render时注册的异步chunks才是真正需要加载的
    const pageHTML = this.render(Component, props)
    // 必须放在render组件之后获取
    const Style = await loadGetInitialStyle(Component, ctx)
    const styleHTML = this.render(Style, props)

    const Head = await loadGetInitialHead(Component, ctx)
    const headHTML = this.render(Head, props)

    this.updateSsrData({ props, asyncProps })

    return this.renderHTML({ pageHTML, styleHTML, headHTML })
  }

  public renderError(error: any): string {
    const { dev } = config.get()
    const { errorHtml } = config.getAssetsConfig()
    if (errorHtml) return errorHtml

    // 停止客户端渲染
    this.updateSsrData({ clientRender: false })
    const pageHTML = ErrorDebug({ error, dev })
    return this.renderHTML({ pageHTML })
  }

  public renderHTML({ pageHTML, styleHTML, headHTML }: HTMLs = {}) {
    const { res } = this.renderOpts.ctx
    if (isResSent(res)) return ''

    const { router, ssrData } = this.renderOpts
    const { parseHtml } = config.getAssetsConfig()

    const html = createHtml({
      pageHTML,
      styleHTML,
      headHTML,
      parseHtml,
      router,
      ssrData,
    })
    return html
  }
}

async function getAsyncProps({
  ctx,
  props,
  pathname,
}: {
  ctx: ICtx
  props: any
  pathname: string
}) {
  const asyncModule = getAsyncModule()
  if (asyncModule && asyncModule.pathMap) {
    const { pathMap } = asyncModule
    const mathValue = pathMap.get(pathname)
    if (mathValue) {
      const asyncProps = await mathValue.getValue(ctx, props, pathname)
      return asyncProps
    }
  }
  return []
}

function getDynamicLoader() {
  const dynamicModule = getDynamicModule()
  if (dynamicModule && dynamicModule.moduleLoader) {
    return [...dynamicModule.moduleLoader]
  }
  return []
}

function setRouterModuleLocation(location: ILocation) {
  const routerModule = getRouterModule()
  if (routerModule && routerModule.setLocation) {
    routerModule.setLocation(location)
  }
}

function clearDynamicLoader() {
  const dynamicModule = getDynamicModule()
  if (dynamicModule && dynamicModule.clearLoader) {
    dynamicModule.clearLoader()
  }
}
