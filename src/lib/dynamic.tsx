import React, { Component } from 'react';
import { ReactComp } from './types';
import { checkServer, interopDefault, isFunction } from './utils';

let defaultLoadingComponent = () => null;

// 服务端判断，只会走一次用于注册动态组件路径
let isRegister = false;

interface IState {
  DynamicComponent: ReactComp<any>;
}

function Dynamic(config) {
  if (isFunction(config)) {
    config = { component: config };
  }
  const {
    component: resolveComponent,
    LoadingComponent = defaultLoadingComponent,
  } = config;
  // 服务端提前执行，支持动态组件中的异步操作，用于注册
  if (!isRegister && checkServer()) {
    isRegister = true;
    const component = interopDefault(resolveComponent());
    // 动态组件执行队列移动操作
    component.move();
  }

  return class DynamicConnect extends Component<any, IState> {
    public state: IState;
    public mounted: boolean;

    constructor(props) {
      super(props);
      this.state = {
        DynamicComponent: null,
      };
      this.load();
    }

    public componentDidMount() {
      this.mounted = true;
    }

    public componentWillUnmount() {
      this.mounted = false;
    }

    public setComponent = mod => {
      const DynamicComponent = interopDefault(mod);
      if (this.mounted) {
        this.setState({ DynamicComponent });
      } else {
        this.state = { DynamicComponent };
      }
    };

    public load() {
      // 两端再次执行注册
      const resolveValue = resolveComponent();
      if (resolveValue._isSyncModule) {
        this.setComponent(resolveValue);
      } else {
        resolveValue.then(this.setComponent);
      }
    }

    public render() {
      const { DynamicComponent } = this.state;
      if (DynamicComponent) {
        return <DynamicComponent {...this.props} />;
      }

      return <LoadingComponent {...this.props} />;
    }
  };
}

Dynamic.setDefaultLoadingComponent = LoadingComponent => {
  defaultLoadingComponent = LoadingComponent;
};

export default Dynamic;
