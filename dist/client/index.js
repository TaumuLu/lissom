"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_dom_1 = __importDefault(require("react-dom"));
if (typeof window !== 'undefined') {
    // 异步延迟至当前入口模块导出后再执行，入口模块为导出的react组件，一定会是同步执行
    Promise.resolve().then(() => {
        let isInitialRender = true;
        function renderReactElement(reactEl, domEl) {
            // The check for `.hydrate` is there to support React alternatives like preact
            if (isInitialRender && typeof react_dom_1.default.hydrate === 'function') {
                react_dom_1.default.hydrate(reactEl, domEl);
                isInitialRender = false;
            }
            else {
                react_dom_1.default.render(reactEl, domEl);
            }
        }
        const initialRoute = window.__SSR_LOADED_PAGES__.shift();
        const { __SSR_DATA__: { props } } = window;
        const routers = {};
        const registerPage = (route, { page }) => {
            routers[route] = page;
            if (isInitialRender && route === initialRoute) {
                const appContainer = document.getElementById('__ssr__');
                const reactEl = react_1.default.createElement(page, props);
                renderReactElement(reactEl, appContainer);
            }
        };
        window.__SSR_LOADED_PAGES__.forEach(([r, f]) => {
            registerPage(r, f);
        });
        delete window.__SSR_LOADED_PAGES__;
        window.__SSR_REGISTER_PAGE__ = registerPage;
    });
}
//# sourceMappingURL=index.js.map