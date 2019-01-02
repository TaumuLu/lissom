"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const constants_1 = require("../../lib/constants");
function deleteCache(path) {
    delete require.cache[path];
}
exports.deleteCache = deleteCache;
function isResSent(res) {
    return res.finished || res.headersSent;
}
exports.isResSent = isResSent;
function getDisplayName(Component) {
    if (typeof Component === 'string') {
        return Component;
    }
    return Component.displayName || Component.name || 'Unknown';
}
exports.getDisplayName = getDisplayName;
const loadGetInitial = (methodName, defaultValue = {}) => function (Component, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV !== 'production') {
            if (Component.prototype && Component.prototype[methodName]) {
                const compName = getDisplayName(Component);
                const message = `"${compName}.${methodName}()" is defined as an instance method`;
                throw new Error(message);
            }
        }
        if (!Component[methodName])
            return defaultValue;
        const props = yield Component[methodName](ctx);
        if (ctx.res && isResSent(ctx.res)) {
            return props;
        }
        if (!props) {
            const compName = getDisplayName(Component);
            const message = `"${compName}.${methodName}()" should resolve to an object. But found "${props}" instead.`;
            throw new Error(message);
        }
        return props;
    });
};
const loadGetInitialProps = loadGetInitial('getInitialProps');
exports.loadGetInitialProps = loadGetInitialProps;
const loadGetInitialStyles = loadGetInitial('getInitialStyles', null);
exports.loadGetInitialStyles = loadGetInitialStyles;
function normalizePagePath(page) {
    if (page === '/') {
        page = '/index';
    }
    if (page[0] !== '/') {
        page = `/${page}`;
    }
    const resolvedPage = path_1.posix.normalize(page);
    if (page !== resolvedPage) {
        throw new Error('Requested and resolved page mismatch');
    }
    return page;
}
exports.normalizePagePath = normalizePagePath;
const fileterJsAssets = (originAssets) => {
    return originAssets.filter((path) => {
        return /.js($|\?)/.test(path) && !path.includes(constants_1.RUNTIME_NAME);
    });
};
exports.fileterJsAssets = fileterJsAssets;
const fileterCssAssets = (originAssets) => {
    return originAssets.filter((path) => {
        return /.css($|\?)/.test(path) && !path.includes(constants_1.RUNTIME_NAME);
    });
};
exports.fileterCssAssets = fileterCssAssets;
//# sourceMappingURL=utils.js.map