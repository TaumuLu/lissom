"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
let defaultLoadingComponent = () => null;
function asyncComponent(config) {
    const { resolve, LoadingComponent = defaultLoadingComponent } = config;
    return class DynamicComponent extends react_1.Component {
        constructor(props) {
            super(props);
            this.setComponent = (module) => {
                const AsyncComponent = module.default || module;
                if (this.mounted) {
                    this.setState({ AsyncComponent });
                }
                else {
                    this.state.AsyncComponent = AsyncComponent;
                }
            };
            this.state = {
                AsyncComponent: null,
            };
            this.load();
        }
        componentDidMount() {
            this.mounted = true;
        }
        componentWillUnmount() {
            this.mounted = false;
        }
        load() {
            const value = resolve();
            if (value._isSyncModule) {
                this.setComponent(value);
            }
            else {
                value.then(this.setComponent);
            }
        }
        render() {
            const { AsyncComponent } = this.state;
            if (AsyncComponent) {
                return (react_1.default.createElement(AsyncComponent, Object.assign({}, this.props)));
            }
            return (react_1.default.createElement(LoadingComponent, Object.assign({}, this.props)));
        }
    };
}
function dynamic(config) {
    const { component: resolveComponent } = config;
    return asyncComponent(Object.assign({ resolve() {
            return resolveComponent();
        } }, config));
}
dynamic.setDefaultLoadingComponent = (LoadingComponent) => {
    defaultLoadingComponent = LoadingComponent;
};
exports.default = dynamic;
//# sourceMappingURL=dynamic.js.map