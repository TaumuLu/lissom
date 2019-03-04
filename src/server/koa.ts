import Router from 'koa-router';
import { IOptions } from '../lib/types';
import config from './config';
import Server from './index';
import { createReg, log, suffixRegs } from './lib/utils';

export default (options: IOptions) => {
  const app = new Server(options);
  const router = new Router();

  router.get('*', async (ctx, next) => {
    const excludeRouteRegs = config.get('excludeRouteRegs');
    const ctxPath = ctx.path;
    const suffixMatch = createReg(suffixRegs).test(ctxPath);
    const excludeMatch = !createReg(excludeRouteRegs).test(ctxPath);

    if (suffixMatch && excludeMatch) {
      const { req, res, method } = ctx;
      ctx.res.statusCode = 200;
      log(`--> ${method}`, ctxPath);
      await app.render(req, res);
      ctx.respond = false;
      log(`<-- ${method}`, ctxPath);
    } else {
      log('skip', ctxPath, '');
      await next();
    }
  });

  return router.routes();
};
