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
      const { req, res, method } = ctx;
      ctx.res.statusCode = 200;
      log(`--> ${method}`, ctxPath);
      await app.render(req, res, ctxPath);
      ctx.respond = false;
      log(`<-- ${method}`, ctxPath);
    } else {
      log('skip', ctxPath, '');
      await next();
    }
  });

  return router.routes();
};
