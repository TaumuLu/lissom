import generateETag from 'etag';
import fresh from 'fresh';
import config from './config';
import { isResSent } from './lib/utils';
import { renderErrorToHTML, renderToHTML } from './render';

export default class Server {
  public async render(req, res, pathname: string, query) {
    const { method } = req;
    const html = await this.renderToHTML(req, res, pathname, query);
    if (isResSent(res)) return null;

    return this.sendHTML(req, res, html, method);
  }

  public async renderToHTML(req, res, pathname: string, query) {
    const { quiet } = config.get();
    try {
      const out = await renderToHTML(req, res, pathname, query);
      return out;
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        return this.renderErrorToHTML(null, req, res, pathname, query);
      }
      if (!quiet) console.error(err);
      res.statusCode = 500;
      return this.renderErrorToHTML(err, req, res, pathname, query);
    }
  }

  public async renderErrorToHTML(err, req, res, pathname: string, query) {
    return renderErrorToHTML(err, req, res, pathname, query);
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
