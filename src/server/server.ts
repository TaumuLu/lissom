import config from './config';
import { isResSent } from './lib/utils';
import { renderErrorToHTML, renderToHTML } from './render';
import sendHTML from './send-html';

export default class Server {
  public async render(req, res, pathname: string, query) {
    const html = await this.renderToHTML(req, res, pathname, query);
    if (isResSent(res)) return null;

    return sendHTML(req, res, html, req.method);
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
}
