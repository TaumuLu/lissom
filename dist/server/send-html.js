"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fresh_1 = __importDefault(require("fresh"));
const etag_1 = __importDefault(require("etag"));
const utils_1 = require("./lib/utils");
function sendHTML(req, res, html, method, { dev, generateEtags }) {
    if (utils_1.isResSent(res))
        return;
    const etag = generateEtags && etag_1.default(html);
    if (fresh_1.default(req.headers, { etag })) {
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
exports.default = sendHTML;
//# sourceMappingURL=send-html.js.map