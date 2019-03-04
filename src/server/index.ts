import generateETag from 'etag';
import fresh from 'fresh';
import { IncomingMessage, ServerResponse } from 'http';
import { IOptions } from '../lib/types';
import config from './config';
import { isResSent } from './lib/utils';
import ReactRender from './react-render';

export default class Server {
  public renderOpts: any;

  constructor(options: IOptions) {
    // 初始化配置
    config.init(options);
  }

  public async render(req: IncomingMessage, res: ServerResponse) {
    // 执行不同模式下的配置操作
    config.mode();
    const { method } = req;
    const html = await this.renderToHTML(req, res);
    // 请求已结束
    if (html === null) return;

    return this.sendHTML(req, res, html, method);
  }

  public async renderToHTML(req: IncomingMessage, res: ServerResponse) {
    const { quiet, serverRender } = config.get();
    const Render = new ReactRender(req, res);

    try {
      let html;
      if (serverRender) {
        html = await Render.renderComponent();
      } else {
        html = Render.renderHTML();
      }
      return html;
    } catch (error) {
      if (!quiet) console.error(error);

      res.statusCode = 500;
      return Render.renderError(error);
    }
  }

  public sendHTML(
    req: IncomingMessage,
    res: ServerResponse,
    html: string,
    method: string
  ) {
    if (isResSent(res)) return;

    const { dev, generateEtags } = config.get();
    const etag = generateEtags && generateETag(html);
    if (fresh(req.headers, { etag })) {
      res.statusCode = 304;
      res.end();
      return;
    }

    if (dev) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }
    if (etag) {
      res.setHeader('ETag', etag);
    }
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    res.setHeader('Content-Length', Buffer.byteLength(html));
    res.end(method === 'HEAD' ? null : html);
  }
}
