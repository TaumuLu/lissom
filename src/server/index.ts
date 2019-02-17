import Router from 'koa-router';
import config from './config';
import { getReg, log, suffixRegs } from './lib/utils';
import Server from './server';

export default async options => {
  config.init(options);
  const app = new Server();
  const pathRouter = new Router();

  pathRouter.use(async (ctx, next) => {
    ctx.res.statusCode = 200;
    await next();
  });
  pathRouter.get('*', async (ctx, next) => {
    // 这里执行get方法是必须的，dev模式下延迟到此时解析
    const { excludeRouteRegs } = config.get();
    const ctxPath = ctx.path;
    const suffixMatch = getReg(suffixRegs).test(ctxPath);
    const excludeMatch = !getReg(excludeRouteRegs).test(ctxPath);

    if (suffixMatch && excludeMatch) {
      const { req, res, query, method } = ctx;
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

  return pathRouter.routes();
};

function getLocation(ctx) {
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
