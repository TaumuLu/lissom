"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const render_1 = require("./render");
const send_html_1 = __importDefault(require("./send-html"));
const config_1 = __importDefault(require("./config"));
const utils_1 = require("./lib/utils");
const webpack_runtime_1 = require("./webpack-runtime");
class Server {
    constructor(_a) {
        var { dir, dev, isSpa, quiet, output, requireModules, excludeModules, excludeModuleRegs } = _a, renderOpts = __rest(_a, ["dir", "dev", "isSpa", "quiet", "output", "requireModules", "excludeModules", "excludeModuleRegs"]);
        this.dir = path_1.resolve(dir);
        this.quiet = quiet;
        this.config = config_1.default(output);
        webpack_runtime_1.setWebpackConfig(this.config, { dev, requireModules, excludeModules, excludeModuleRegs });
        this.renderOpts = Object.assign({ dev }, renderOpts, this.config);
    }
    render(req, res, pathname, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = yield this.renderToHTML(req, res, pathname, query);
            if (utils_1.isResSent(res))
                return null;
            return send_html_1.default(req, res, html, req.method, this.renderOpts);
        });
    }
    renderToHTML(req, res, pathname, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const out = yield render_1.renderToHTML(req, res, pathname, query, this.renderOpts);
                return out;
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    res.statusCode = 404;
                    return this.renderErrorToHTML(null, req, res, pathname, query);
                }
                if (!this.quiet)
                    console.error(err);
                res.statusCode = 500;
                return this.renderErrorToHTML(err, req, res, pathname, query);
            }
        });
    }
    renderErrorToHTML(err, req, res, pathname, query) {
        return __awaiter(this, void 0, void 0, function* () {
            return render_1.renderErrorToHTML(err, req, res, pathname, query, this.renderOpts);
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map