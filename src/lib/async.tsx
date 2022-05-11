import qs from 'qs'
import React, { Component, ReactElement } from 'react'

import {
  checkServer,
  get,
  getDisplayName,
  isString,
  parseSSRData,
} from './utils'

let defaultLoading: any = () => null
let _ssrPathName: string // 仅服务端使用

export class InitialProps {
  // 只有动态模块的情况下需要初始化操作
  public static init(paths: string | string[], getInitialProps?: any) {
    paths = handlePaths(paths)
    const indexMap = {}
    paths.forEach(path => {
      const index = 0
      pathMap.set(path, new InitialProps(getInitialProps))
      indexMap[path] = index
    })
    return indexMap
  }

  public static combine(paths: string[], getInitialProps?: any) {
    // 合并总是push进queue队列中，动态队列dynamicQueue由动态组件触发移动
    const indexMap = {}
    paths.forEach(path => {
      let index = 0
      if (pathMap.has(path)) {
        index = pathMap.get(path).push(getInitialProps)
      } else {
        pathMap.set(path, new InitialProps(getInitialProps))
      }
      indexMap[path] = index
    })
    return indexMap
  }

  public queue: Function[]
  public dynamicQueue: Function[]
  public value: any[]
  public isLock = false

  constructor(getInitialProps?: any) {
    this.queue = []
    this.dynamicQueue = []
    this.value = []
    if (getInitialProps) {
      this.queue.push(getInitialProps)
    }
  }

  public moveQueue(fromIndex: number, toIndex: number) {
    const takeValue = this.queue.splice(fromIndex, 1)
    this.queue.splice(toIndex, 0, ...takeValue)
  }

  // 移动动态加载的异步模块至其他队列，为何要如此做，原因在于在服务端同步客户端异步
  public moveToDynamicQueue(index: number) {
    const takeValue = this.queue.splice(index, 1)
    return this.dynamicQueue.push(...takeValue) - 1
  }

  public size(): number {
    return this.queue.length
  }

  public dynamicSize(): number {
    return this.dynamicQueue.length
  }

  public push(getInitialProps: any) {
    if (this.isLock) {
      if (this.value.length === this.queue.length) {
        // 不要在render时添加含有异步操作的动态组件，请把有异步操作的动态组件放在文件加载运行时执行
        throw new Error(
          "Don't introduce dynamic components with asynchronous operations when rendering, Please introduce dynamic components with asynchronous operations when the file is running",
        )
      }
    }

    return this.queue.push(getInitialProps) - 1
  }

  public setValue(value: any) {
    this.isLock = true
    this.value = value
  }

  // 合并队列
  public getFullQueue() {
    return [...this.queue, ...this.dynamicQueue]
  }

  public handleValue(value: any, index: number) {
    // 标记成功
    return (this.value[index] = { finish: true, error: null, value })
  }

  // 仅服务端调用
  public async getValue(ctx: any, globalProps: any, pathname: string) {
    // 保存服务端当前异步路由
    _ssrPathName = pathname
    this.isLock = true
    this.value = []
    for (const item of this.getFullQueue()) {
      // 先同步执行并push进value中，并传入保存在value中之前组件的所有异步返回值
      // 用于依赖之前组件异步返回值的组件可以await去获取
      const resolve = item(ctx, globalProps, this.value)
      this.value.push(resolve)
    }
    return Promise.all(this.value).then(values =>
      values.map((v, i) => this.handleValue(v, i)),
    )
  }

  public deleteValue(index: number, dIndex: number) {
    const cIndex = this.calcIndex(index, dIndex)
    this.value[cIndex] = null
  }

  public calcIndex(index: number, dIndex: number) {
    // 获取合并后的索引
    if (dIndex !== undefined) {
      return this.size() + dIndex
    }
    return index
  }

  // 渲染时调用
  public getProps(index: number, dIndex: number, globalProps: any) {
    const cIndex = this.calcIndex(index, dIndex)
    const existProps = this.value[cIndex] || {}
    // 服务端渲染页面走到这步必定返回
    if (existProps.finish) return existProps

    const item = this.getFullQueue()[cIndex]
    const ctx = getClientCtx()
    // 和 getValue 里同理
    const resolve = item(ctx, globalProps, this.value)
    this.value[cIndex] = resolve
    return resolve.then((props: any) => {
      return this.handleValue(props, cIndex)
    })
  }
}

const getClientCtx = () => {
  if (checkServer()) return {}

  const { location, navigator } =
    typeof window !== 'undefined' ? window : ({} as any)
  const { pathname, search } = location
  const query = qs.parse(search, { ignoreQueryPrefix: true })
  const asPath = pathname + search
  return {
    error: null,
    req: null,
    res: null,
    pathname,
    asPath,
    location,
    navigator,
    query,
  }
}

interface IState {
  isRender: boolean
  asyncProps: any
}

export const pathMap = new Map()

const handlePaths = (paths: string | string[], AsyncComponent?: any) => {
  if (Array.isArray(paths)) return paths
  if (isString(paths)) {
    return [paths]
  }
  const title = AsyncComponent
    ? `${getDisplayName(AsyncComponent)} component`
    : 'init'
  throw new Error(
    `${title}: async decorator path params can only be a string or an array`,
  )
}

function Async(paths: string | string[]) {
  return (AsyncComponent: any) => {
    const {
      getInitialProps,
      loading = defaultLoading,
      unmount = true,
    } = AsyncComponent
    paths = handlePaths(paths, AsyncComponent)
    const indexMap = InitialProps.combine(paths, getInitialProps)
    // 动态队列索引
    let dynamicIndex: number

    return class AsyncConnect extends Component<any, IState> {
      // 提供给动态加载模块的移动操作
      public static move() {
        // 动态模块的异步操作移至动态队列
        Object.keys(indexMap).forEach(path => {
          const index = indexMap[path]
          const instance = pathMap.get(path)
          dynamicIndex = instance.moveToDynamicQueue(index)
        })
      }

      public state: IState
      public mounted = false
      public readonly isServer: boolean
      public readonly matchPath: boolean
      public readonly _path: string
      public readonly _index: number

      constructor(props: any) {
        super(props)
        this.state = {
          isRender: false,
          asyncProps: {},
        }
        // 保存获取数据的信息
        this.isServer = checkServer()
        this._path = this.getPath()
        this._index = indexMap[this._path]
        this.matchPath = this._index !== undefined
        // 如果未命中路由，即当前异步组件传入的路径未包含此路由
        if (this.matchPath) {
          this.load()
        }
      }

      public componentDidMount() {
        this.mounted = true
      }

      public componentWillUnmount() {
        this.mounted = false
        const { isRender } = this.state
        if (isRender && unmount) {
          const instance = pathMap.get(this._path)
          instance.deleteValue(this._index, dynamicIndex)
        }
      }

      public getGlobalProps() {
        if (this.isServer) {
          // 服务端不会走到这一步，不需要此值
          return {}
        }
        const { props } = parseSSRData() || {}
        return props
      }

      public onFulfilled = (asyncProps: any) => {
        const isRender = true
        if (this.mounted) {
          this.setState({ asyncProps, isRender })
        } else {
          this.state = { isRender, asyncProps }
        }
      }

      public getPath() {
        return this.isServer ? _ssrPathName : get(window, 'location.pathname')
      }

      public load() {
        const instance = pathMap.get(this._path)
        const resolve = instance.getProps(
          this._index,
          dynamicIndex,
          this.getGlobalProps(),
        )

        if (resolve.finish) {
          this.onFulfilled(resolve)
        } else {
          resolve.then(this.onFulfilled)
        }
      }

      public render() {
        if (!this.matchPath) return null

        const { isRender, asyncProps } = this.state
        const { value, error } = asyncProps
        if (isRender) {
          const props = {
            ...this.props,
            ...value,
            error,
          }
          return <AsyncComponent {...props} />
        }

        const Loading = loading
        return <Loading {...this.props} />
      }
    }
  }
}

Async.setDefaultLoading = (loading: ReactElement) => {
  defaultLoading = loading
}

export default Async
