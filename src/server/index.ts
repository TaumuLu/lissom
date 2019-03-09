import generateETag from 'etag';
import fresh from 'fresh';
import { existsSync, statSync } from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import send from 'send';
import { IOptions } from '../lib/types';
import config from './config';
import { isResSent } from './lib/utils';
import ReactRender from './react-render';

send.mime.define({ 'application/wasm': ['wasm'] });

export default class Server {
  public renderOpts: any;

  constructor(options: IOptions) {
    // 初始化配置
    config.init(options);
  }

  public async render(req: IncomingMessage, res: ServerResponse) {
    // 执行不同模式下的配置操作
    config.mode();
    const { method, url } = req;
    // 处理静态资源文件
    if (this.isStaticFile(url)) {
      return this.sendFile(req, res, url);
    }
    const html = await this.renderToHTML(req, res);
    // 请求已结束
    if (html === null) return;

    return this.sendHTML(req, res, html, method);
  }

  public async renderToHTML(req: IncomingMessage, res: ServerResponse) {
    const { serverRender } = config.get();
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
      this.logError(error);

      res.statusCode = 500;
      return Render.renderError(error);
    }
  }

  public isStaticFile(path: string): boolean {
    const { outputDir } = config.get();
    const { excludeStaticReg } = config.getRegsConfig();
    const filePath = join(outputDir, path);

    if (!excludeStaticReg.test(filePath) && existsSync(filePath)) {
      return statSync(filePath).isFile();
    }
    return false;
  }

  public async sendFile(
    req: IncomingMessage,
    res: ServerResponse,
    path: string
  ) {
    const { outputDir } = config.get();
    return new Promise((resolve, reject) => {
      send(req, path, { index: false, root: outputDir })
        .on('directory', () => {
          // We don't allow directories to be read.
          const err: any = new Error('No directory access');
          err.code = 'ENOENT';
          reject(err);
        })
        .on('error', reject)
        .pipe(res)
        .on('finish', resolve);
    }).catch(error => {
      this.logError(error);
      res.statusCode = 500;
      res.end();
    });
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

  private logError(...args: any): void {
    const { quiet } = config.get();
    if (quiet) return;
    console.error(...args);
  }
}
