// const path = require('path');
const Koa = require('koa');
// const staticServe = require('koa-static');
const logger = require('koa-logger');
const lissomKoa = require('lissom/koa');
// const { createServer } = require('http');
// const Lissom = require('lissom');

const port = 9999;
// const context = process.cwd();
const uri = `http://127.0.0.1:${port}`;

const config = {
  excludeRouteRegs: [/\/(api|public)\/.*/],
  output: './build',
  errorHtml: './error.html',
  // isBase64: true,
  // errorEntry: '/error',
  // dev: false,
  // serverRender: false,
  // clientRender: false,
  // excludeStaticRegs: [/main/],
  rootAttr: {
    id: 'root',
    class: 'test',
  },
};

const app = new Koa();
app.use(logger());

app.use(lissomKoa(config));

// app.use(staticServe(path.join(context, './build')));

app.listen(port, () => {
  console.log(`listening to port ${port}, open url ${uri}`);
});

// const lissomApp = new Lissom(config);
// const port2 = 3000;

// createServer((req, res) => {
//   lissomApp.render(req, res);
// }).listen(port2, err => {
//   if (err) throw err;
//   console.log(`> Ready on http://localhost:${port2}`);
// });
