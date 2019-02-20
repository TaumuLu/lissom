import Router from 'koa-router';
import { IConfig } from '../lib/types';
import config from './config';
import { createReg, log, suffixRegs } from './lib/utils';
import Server from './server';

export default (options: IConfig) => {
  config.init(options);
  const app = new Server();
  const router = new Router();

  router.get('*', async (ctx, next) => {
    const excludeRouteRegs = config.get('excludeRouteRegs');
    const ctxPath = ctx.path;
    const suffixMatch = createReg(suffixRegs).test(ctxPath);
    const excludeMatch = !createReg(excludeRouteRegs).test(ctxPath);

    if (suffixMatch && excludeMatch) {
      // 执行不同模式下的配置操作
      config.mode();
      const { req, res, query, method } = ctx;
      ctx.res.statusCode = 200;
      log(`--> ${method}`, ctxPath);
      // 保持和浏览器相同的location对象数据格式
      const nodeReqest = req as any;
      nodeReqest.location = getLocation(ctx);
      await app.render(nodeReqest, res, ctxPath, query);
      ctx.respond = false;
      log(`<-- ${method}`, ctxPath);
    } else {
      log('skip', ctxPath, '');
      await next();
    }
  });

  return router.routes();
};

function getLocation(ctx: any) {
  const { path, href, host, origin, protocol, querystring } = ctx;
  const pathname = path;
  const search = querystring ? `?${querystring}` : '';
  const [hostname, port] = host.split(':');

  return {
    href,
    host,
    hostname,
    origin,
    pathname,
    port,
    protocol,
    search,
  };
}
