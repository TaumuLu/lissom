const path = require('path');
const Koa = require('koa');
const staticServe = require('koa-static');
const logger = require('koa-logger');
const lissom = require('lissom/koa');

const port = 9999;
const context = process.cwd();
const uri = `http://127.0.0.1:${port}`;

const config = {
  excludeRouteRegs: [/\/(api|public)\/.*/],
  output: './build',
  // dev: false,
  // serverRender: false,
  // clientRender: false,
  rootAttr: {
    id: 'root',
    class: 'test',
  },
};

const app = new Koa();
app.use(logger());

app.use(lissom(config));

app.use(staticServe(path.join(context, './build')));

app.listen(port, () => {
  console.log(`listening to port ${port}, open url ${uri}`);
});

// const { createServer } = require('http');
// const Lissom = require('lissom');

// const config = { output: './build' };
// const app = new Lissom(config);
// const port = 3000;

// createServer((req, res) => {
//   app.render(req, res);
// }).listen(port, err => {
//   if (err) throw err;
//   console.log(`> Ready on http://localhost:${port}`);
// });
