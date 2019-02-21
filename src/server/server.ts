import generateETag from 'etag';
import fresh from 'fresh';
import config from './config';
import { isResSent } from './lib/utils';
import renderHTML from './render';

export default class Server {
  public async render(req: any, res: any, pathname: string) {
    const { method } = req;
    const html = await this.renderToHTML(req, res, pathname);
    if (isResSent(res)) return null;

    return this.sendHTML(req, res, html, method);
  }

  public async renderToHTML(req: any, res: any, pathname: string) {
    const { quiet } = config.get();
    try {
      const html = await renderHTML(req, res, pathname);
      return html;
    } catch (error) {
      if (!quiet) console.error(error);
      res.statusCode = 500;
      const html = await renderHTML(req, res, pathname, error);
      return html;
    }
  }

  public sendHTML(req, res, html: string, method: string) {
    const { dev, generateEtags } = config.get();
    if (isResSent(res)) return null;

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
