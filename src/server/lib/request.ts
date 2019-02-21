import qs from 'qs';
import { parse } from 'url';
import { ILocation, INavigator, IQuery } from '../../lib/types';

const locationKeys = [
  'hash',
  'href',
  'host',
  'hostname',
  'origin',
  'pathname',
  'port',
  'protocol',
  'search',
];

export default class Request {
  get headers() {
    return this.req.headers;
  }

  get url() {
    return this.req.url;
  }

  get originalUrl() {
    return this.req.url;
  }

  get hash() {
    return '';
  }

  get host() {
    const proxy = this.app.proxy;
    let host = proxy && this.get('X-Forwarded-Host');
    if (!host) {
      if (this.req.httpVersionMajor >= 2) host = this.get(':authority');
      if (!host) host = this.get('Host');
    }
    if (!host) return '';
    return host.split(/\s*,\s*/, 1)[0];
  }

  get hostname() {
    const [hostname] = this.host.split(':');
    return hostname;
  }

  get port() {
    const [port] = this.host.split(':').reverse();
    return port;
  }

  get origin() {
    return `${this.protocol}://${this.host}`;
  }

  get href() {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.originalUrl)) return this.originalUrl;
    return this.origin + this.originalUrl;
  }

  get socket() {
    return this.req.socket;
  }

  get protocol() {
    if (this.socket.encrypted) return 'https';
    if (!this.app.proxy) return 'http';
    const proto = this.get('X-Forwarded-Proto');
    return proto ? proto.split(/\s*,\s*/, 1)[0] : 'http';
  }

  get query(): IQuery {
    const str = this.querystring;
    const c = (this._querycache = this._querycache || {});
    return c[str] || (c[str] = qs.parse(str));
  }

  get querystring() {
    return parse(this.url).query || '';
  }

  get path() {
    return parse(this.url).pathname;
  }

  get pathname() {
    return this.path;
  }

  get search() {
    const querystring = this.querystring;
    return querystring ? `?${querystring}` : '';
  }

  get location(): ILocation {
    return locationKeys.reduce(
      (p, k) => {
        return {
          ...p,
          [k]: this[k],
        };
      },
      {} as any
    );
  }

  get navigator(): INavigator {
    return {
      userAgent: this.get('user-agent'),
    };
  }

  private _querycache: any;
  private req: any;
  private app: any;

  constructor(req) {
    this.req = req;
    this.app = {};
  }

  public get(field) {
    const req = this.req;
    switch ((field = field.toLowerCase())) {
      case 'referer':
      case 'referrer':
        return req.headers.referrer || req.headers.referer || '';
      default:
        return req.headers[field] || '';
    }
  }
}
