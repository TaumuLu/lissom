import generateETag from 'etag';
import fresh from 'fresh';
import config from './config';
import { isResSent } from './lib/utils';

export default function sendHTML(req, res, html, method) {
  const { dev, generateEtags } = config.get();
  if (isResSent(res)) return;
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
