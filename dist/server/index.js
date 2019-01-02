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
const fs_1 = require("fs");
const koa_router_1 = __importDefault(require("koa-router"));
const config_1 = require("../lib/config");
const utils_1 = require("../lib/utils");
const server_1 = __importDefault(require("./server"));
exports.default = (config) => __awaiter(this, void 0, void 0, function* () {
    const _a = Object.assign({}, config_1.defaultConfig, config), { excludePathRegs, output } = _a, otherConfig = __rest(_a, ["excludePathRegs", "output"]);
    if (!output) {
        utils_1.printAndExit('> output configuration is required');
    }
    const outputDir = path_1.resolve(output);
    if (!fs_1.existsSync(outputDir)) {
        utils_1.printAndExit(`> No such directory exists as the project root: ${outputDir}`);
    }
    const ssrConfig = Object.assign({}, otherConfig, { output: outputDir });
    let app = new server_1.default(ssrConfig);
    const pathRouter = new koa_router_1.default();
    pathRouter.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
        ctx.res.statusCode = 200;
        yield next();
    }));
    pathRouter.get('*', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        const ctxPath = ctx.path;
        const suffixMatch = utils_1.getReg(utils_1.suffixRegs).test(ctxPath);
        const excludeMatch = !utils_1.getReg(excludePathRegs).test(ctxPath);
        if (suffixMatch && excludeMatch) {
            const { req, res, query } = ctx;
            // 保持和浏览器相同的location对象数据格式
            const nodeReqest = req;
            nodeReqest.location = getLocation(ctx);
            yield app.render(nodeReqest, res, ctxPath, query);
            ctx.respond = false;
        }
        else {
            yield next();
        }
    }));
    return pathRouter.routes();
});
function getLocation(ctx) {
    const { path, href, host, origin, protocol, querystring } = ctx;
    const pathname = path;
    const search = `?${querystring || ''}`;
    const [hostname, port] = host.split(':');
    return {
        href, host, hostname, origin, pathname, port, protocol, search,
    };
}
//# sourceMappingURL=index.js.map