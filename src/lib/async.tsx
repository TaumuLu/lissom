import qs from 'qs';
import React, { Component } from 'react';
import { checkServer, get, getDisplayName, isArray, isString } from './utils';

let defaultLoadingComponent = () => null;
let _ssrPathName;

class InitialProps {
  public static combine(paths, getInitialProps) {
    // 合并总是push进queue队列中，动态队列dynamicQueue由动态组件触发移动
    const indexMap = {};
    paths.forEach(path => {
      let index = 0;
      if (pathMap.has(path)) {
        index = pathMap.get(path).push(getInitialProps);
      } else {
        pathMap.set(path, new InitialProps(getInitialProps));
      }
      indexMap[path] = index;
    });
    return indexMap;
  }

  public queue: Function[];
  public dynamicQueue: Function[];
  public value: any[];
  public isLock: boolean;

  constructor(getInitialProps) {
    this.queue = [getInitialProps];
    this.dynamicQueue = [];
    this.value = [];
  }

  public moveQueue(fromIndex, toIndex) {
    const takeValue = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, ...takeValue);
  }

  public moveToDynamicQueue(index): number {
    const takeValue = this.queue.splice(index, 1);
    return this.dynamicQueue.push(...takeValue) - 1;
  }

  public size(): number {
    return this.queue.length;
  }

  public dynamicSize(): number {
    return this.dynamicQueue.length;
  }

  public push(getInitialProps): number {
    if (this.isLock) {
      if (this.value.length === this.queue.length) {
        // 不要在render时添加含有异步操作的动态组件，请把有异步操作的动态组件放在文件运行时执行
        throw new Error(
          "Don't introduce dynamic components with asynchronous operations when rendering, Please introduce dynamic components with asynchronous operations when the file is running"
        );
      }
    }

    return this.queue.push(getInitialProps) - 1;
  }

  public setValue(value): void {
    this.isLock = true;
    this.value = value;
  }

  // 合并队列
  public getFullQueue() {
    return [...this.queue, ...this.dynamicQueue];
  }

  // 服务端调用
  public async getValue(ctx, golbalProps, pathname) {
    // 保存服务端当前异步路由
    _ssrPathName = pathname;
    this.isLock = true;
    this.value = [];
    for (const item of this.getFullQueue()) {
      // 先同步执行并push进value中，并传入保存在value中之前组件的所有异步返回值
      // 用于依赖之前组件异步返回值的组件可以await去获取
      const resolve = item(ctx, golbalProps, this.value);
      this.value.push(resolve);
    }
    this.value = await Promise.all(this.value);
    return this.value;
  }

  // 渲染时调用
  public getProps(index, dynamicIndex, golbalProps) {
    let mIndex = index;
    // 获取合并后的索引
    if (dynamicIndex !== undefined) {
      mIndex = this.size() + dynamicIndex;
    }
    const existProps = this.value[mIndex];
    // 服务端渲染页面走到这步必定返回
    if (this.isLock) return existProps;

    const item = this.getFullQueue()[mIndex];
    const ctx = getClientCtx();
    // 和getValue里同理
    const resolve = item(ctx, golbalProps, this.value);
    this.value.push(resolve);
    return resolve.then(props => {
      this.value[mIndex] = props;
      return props;
    });
  }
}

const getClientCtx = () => {
  if (checkServer()) return {};

  const { location, navigator } =
    typeof window !== 'undefined' ? window : ({} as any);
  const { pathname, search } = location;
  const query = qs.parse(search, { ignoreQueryPrefix: true });
  const asPath = pathname + search;
  return {
    error: null,
    req: null,
    res: null,
    pathname,
    asPath,
    location,
    navigator,
    query,
  };
};

interface IState {
  isRender: boolean;
  asyncProps: any;
}

export const pathMap = new Map();

const handlePaths = (paths, AsyncComponent) => {
  if (isArray(paths)) return paths;
  if (isString(paths)) {
    return [paths];
  }
  const displayName = getDisplayName(AsyncComponent);
  throw new Error(
    `${displayName} component: async decorator path params can only be a string or an array`
  );
};

function Async(paths) {
  return AsyncComponent => {
    const {
      getInitialProps,
      LoadingComponent = defaultLoadingComponent,
    } = AsyncComponent;
    paths = handlePaths(paths, AsyncComponent);
    const indexMap = InitialProps.combine(paths, getInitialProps);
    // 动态队列索引
    let dynamicIndex: number;

    return class AsyncConnect extends Component<any, IState> {
      // 提供给动态加载模块的移动操作
      public static move() {
        // 动态模块的异步操作移至动态队列
        Object.keys(indexMap).forEach(path => {
          const index = indexMap[path];
          const instance = pathMap.get(path);
          dynamicIndex = instance.moveToDynamicQueue(index);
        });
      }

      public state: IState;
      public mounted: boolean;

      constructor(props) {
        super(props);
        this.state = {
          isRender: checkServer(),
          asyncProps: {},
        };
        this.load();
      }

      public componentDidMount() {
        this.mounted = true;
      }

      public componentWillUnmount() {
        this.mounted = false;
      }

      public getGlobalProps() {
        const { isRender } = this.state;
        if (isRender) {
          // 服务端不会走到这一步，不需要此值
          return {};
        }
        return window.__SSR_DATA__.props;
      }

      public setProps = asyncProps => {
        const isRender = true;
        if (this.mounted) {
          this.setState({ asyncProps, isRender });
        } else {
          this.state = { isRender, asyncProps };
        }
      };

      public load() {
        const { isRender } = this.state;
        const path = isRender ? _ssrPathName : get(window, 'location.pathname');
        const index = indexMap[path];
        if (index === undefined) {
          // 未匹配路由，当前异步组件传入的路径未包含此路由
          this.state.isRender = false;
          return;
        }
        const instance = pathMap.get(path);

        const resolveValue = instance.getProps(
          index,
          dynamicIndex,
          this.getGlobalProps()
        );

        if (resolveValue instanceof Promise) {
          resolveValue.then(this.setProps);
        } else {
          this.setProps(resolveValue);
        }
      }

      public render() {
        const { isRender, asyncProps } = this.state;
        if (isRender) {
          const props = {
            ...this.props,
            ...asyncProps,
          };
          return <AsyncComponent {...props} />;
        }

        return <LoadingComponent {...this.props} />;
      }
    };
  };
}

Async.setDefaultLoadingComponent = LoadingComponent => {
  defaultLoadingComponent = LoadingComponent;
};

export default Async;
