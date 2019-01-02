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
const react_1 = __importDefault(require("react"));
const htmlescape_1 = __importDefault(require("htmlescape"));
const server_1 = require("react-dom/server");
const utils_1 = require("./lib/utils");
const webpack_runtime_1 = require("./webpack-runtime");
const scriptType = 'text/javascript';
const cssRel = 'stylesheet';
function createHtml({ htmlConfig, props, router, Component, ctx, staticMarkup }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { html } = htmlConfig;
        const { name } = router;
        const data = { props };
        const render = staticMarkup ? server_1.renderToStaticMarkup : server_1.renderToString;
        const innerHTML = render(react_1.default.createElement(Component, Object.assign({}, props)));
        const { asyncJsChunks, asyncCssChunks } = webpack_runtime_1.getAsyncChunks();
        const jsDefinition = asyncJsChunks.map((src) => {
            return {
                attributes: { type: scriptType, src },
                tagName: 'script',
            };
        });
        const cssDefinition = asyncCssChunks.map((href) => {
            return {
                attributes: { href, rel: cssRel },
                tagName: 'link',
            };
        });
        const assetTags = {
            bodyStart: [{
                    attributes: { id: '__ssr__', style: 'height: 100%; display: flex' },
                    tagName: 'div',
                    innerHTML,
                }, {
                    attributes: { type: scriptType },
                    tagName: 'script',
                    innerHTML: `
        window.__SSR_DATA__ = ${htmlescape_1.default(data)}
        window.__SSR_LOADED_PAGES__ = ['${name}'];
        window.__SSR_REGISTER_PAGE__ = function(r,f){__SSR_LOADED_PAGES__.push([r, f()])};
      `,
                }, ...jsDefinition],
            headEnd: [...cssDefinition],
        };
        const Styles = yield utils_1.loadGetInitialStyles(Component, ctx);
        if (Styles) {
            assetTags.headEnd.push({
                innerHTML: render(Styles),
            });
        }
        const htmlTemplate = injectAssetsIntoHtml(html, assetTags);
        return htmlTemplate;
    });
}
exports.default = createHtml;
const getTagRegExp = (tag, isEnd = false, flags = 'i') => {
    let tagAfter = '\\s';
    if (tag === 'html') {
        tagAfter = '[^>]';
    }
    const regStr = `(<${isEnd ? '\\/' : ''}${tag}${tagAfter}*>)`;
    return new RegExp(regStr, flags);
};
const htmlReg = getTagRegExp('html');
const bodyRegStart = getTagRegExp('body');
const bodyRegEnd = getTagRegExp('body', true);
const headRegExpEnd = getTagRegExp('head', true);
// const scriptRegStart = getTagRegExp('script')
const injectAssetsIntoHtml = (html, assetTags) => {
    const { bodyStart = [], bodyEnd = [], headEnd = [] } = Object
        .keys(assetTags)
        .reduce((p, k) => {
        const tags = assetTags[k];
        return Object.assign({}, p, { [k]: tags.map(createHtmlTag) });
    }, {});
    if (bodyStart.length || bodyEnd.length) {
        if (bodyRegStart.test(html)) {
            html = html.replace(bodyRegStart, match => match + bodyStart.join(''));
        }
        else {
            html += bodyStart.join('');
        }
        if (bodyRegEnd.test(html)) {
            html = html.replace(bodyRegEnd, match => bodyEnd.join('') + match);
        }
        else {
            html += bodyEnd.join('');
        }
    }
    if (headEnd.length) {
        if (!headRegExpEnd.test(html)) {
            if (!htmlReg.test(html)) {
                html = `<head></head>${html}`;
            }
            else {
                html = html.replace(htmlReg, match => `${match}<head></head>`);
            }
        }
        html = html.replace(headRegExpEnd, match => headEnd.join('') + match);
    }
    // if (scriptStart.length) {
    //   if (scriptRegStart.test(html)) {
    //     html = html.replace(scriptRegStart, match => scriptStart.join('') + match)
    //   } else {
    //     html += scriptStart.join('')
    //   }
    // }
    return html;
};
const createHtmlTag = (tagDefinition) => {
    const { attributes, voidTag = false, closeTag = true, tagName, innerHTML, selfClosingTag = false } = tagDefinition;
    if (!tagName)
        return innerHTML;
    const attributeList = Object.keys(attributes || {})
        .filter(attributeName => attributes[attributeName] !== false)
        .map((attributeName) => {
        if (attributes[attributeName] === true) {
            return attributeName;
        }
        return `${attributeName}="${tagDefinition.attributes[attributeName]}"`;
    });
    const isVoidTag = voidTag !== undefined ? voidTag : !closeTag;
    const isSelfClosingTag = voidTag !== undefined ? voidTag : selfClosingTag;
    return `<${[tagName].concat(attributeList).join(' ')}${isSelfClosingTag ? '/' : ''}>${innerHTML || ''}${isVoidTag ? '' : `</${tagName}>`}`;
};
//# sourceMappingURL=create-html.js.map