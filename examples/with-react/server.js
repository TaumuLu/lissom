const path = require('path');
const Koa = require('koa');
const send = require('koa-send');
const logger = require('koa-logger');
const ssrRouter = require('lissom');

const port = 9999;
const context = process.cwd();
const uri = `http://127.0.0.1:${port}`;

const ssrConfig = {
  isSpa: true,
  excludeRouteRegs: [/\/(api|public)\/.*/],
  output: './build',
};

async function startServer() {
  const app = new Koa();
  app.use(logger());

  app.use(async (ctx, next) => {
    const resPath = await send(ctx, ctx.path, {
      root: path.join(context, './build'),
    });
    if (resPath) return;
    await next();
  });

  app.use(await ssrRouter(ssrConfig));

  app.listen(port, () => {
    console.log(`listening to port ${port}, open url ${uri}`);
  });
}

startServer();
