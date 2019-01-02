"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_html_1 = __importDefault(require("./create-html"));
const require_1 = require("./require");
const utils_1 = require("./lib/utils");
function renderToHTML(req, res, pathname, query, opts) {
    return doRender(req, res, pathname, query, opts);
}
exports.renderToHTML = renderToHTML;
function renderErrorToHTML(err, req, res, pathname, query, opts = {}) {
    return doRender(req, res, pathname, query, Object.assign({}, opts, { err, page: '/_error' }));
}
exports.renderErrorToHTML = renderErrorToHTML;
function doRender(req, res, pathname, query, { err, page, dev = false, staticMarkup = false, routers, htmlConfig, }) {
    return __awaiter(this, void 0, void 0, function* () {
        page = utils_1.normalizePagePath(page || pathname);
        const router = require_1.getRouter(page, routers);
        let [Component] = yield Promise.all([
            require_1.requirePage(router, dev),
        ]);
        Component = Component.default || Component;
        const asPath = req.url;
        // 保持兼容next
        const ctx = { err, req, res, pathname: page, query, asPath };
        const props = yield utils_1.loadGetInitialProps(Component, ctx);
        if (utils_1.isResSent(res))
            return null;
        // if (!Component.prototype || !Component.prototype.isReactComponent) {
        //   throw new Error('Component is not exporting a React component')
        // }
        const html = yield create_html_1.default({ htmlConfig, props, router, Component, ctx, staticMarkup });
        return html;
    });
}
//# sourceMappingURL=render.js.map