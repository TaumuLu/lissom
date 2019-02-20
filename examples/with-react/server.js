const path = require('path');
const Koa = require('koa');
const staticServe = require('koa-static');
const logger = require('koa-logger');
const ssrRouter = require('lissom');

const port = 9999;
const context = process.cwd();
const uri = `http://127.0.0.1:${port}`;

const ssrConfig = {
  excludeRouteRegs: [/\/(api|public)\/.*/],
  output: './build',
  rootAttr: {
    id: 'root',
    class: 'test',
  },
};

async function startServer() {
  const app = new Koa();
  app.use(logger());

  app.use(ssrRouter(ssrConfig));

  app.use(staticServe(path.join(context, './build')));

  app.listen(port, () => {
    console.log(`listening to port ${port}, open url ${uri}`);
  });
}

startServer();
