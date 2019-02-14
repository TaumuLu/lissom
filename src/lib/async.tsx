import React, { Component } from 'react'
import { checkServer } from './utils'

let defaultLoadingComponent = () => null

class InitialProps {
  public static combine(path, getInitialProps) {
    // 合并总是push进queue队列中，动态队列dynamicQueue由动态组件触发移动
    let index = 0
    if (pathMap.has(path)) {
      index = pathMap.get(path).push(getInitialProps)
    } else {
      pathMap.set(path, new InitialProps(getInitialProps))
    }
    return index
  }

  public queue: Function[]
  public dynamicQueue: Function[]
  public value: any[]
  public isLock: boolean

  constructor(getInitialProps) {
    this.queue = [getInitialProps]
    this.dynamicQueue = []
    this.value = []
  }

  public moveQueue(fromIndex, toIndex) {
    const takeValue = this.queue.splice(fromIndex, 1)
    this.queue.splice(toIndex, 0, ...takeValue)
  }

  public moveToDynamicQueue(index): number {
    const takeValue = this.queue.splice(index, 1)
    return this.dynamicQueue.push(...takeValue) - 1
  }

  public size(): number {
    return this.queue.length
  }

  public dynamicSize(): number {
    return this.dynamicQueue.length
  }

  public push(getInitialProps): number {
    if (this.isLock) {
      if (this.value.length === this.queue.length) {
        // 不要在render时添加含有异步操作的动态组件，请把有异步操作的动态组件放在文件运行时执行
        throw new Error("Don't introduce dynamic components with asynchronous operations when rendering, Please introduce dynamic components with asynchronous operations when the file is running")
      }
    }

    return this.queue.push(getInitialProps) - 1
  }

  public setValue(value): void {
    this.isLock = true
    this.value = value
  }

  // 合并队列
  public getFullQueue() {
    return [...this.queue, ...this.dynamicQueue]
  }

  // 服务端调用
  public async getValue(ctx, golbalProps) {
    this.isLock = true
    this.value = []
    for (const item of this.getFullQueue()) {
      // 先同步执行并push进value中，并传入保存在value中之前组件的所有异步返回值
      // 用于依赖之前组件异步返回值的组件可以await去获取
      const resolve = item(ctx, golbalProps, ...this.value)
      this.value.push(resolve);
    }
    this.value = await Promise.all(this.value)
    return this.value
  }

  // 渲染时调用
  public getProps(index, dynamicIndex, golbalProps) {
    let mIndex = index
    // 获取合并后的索引
    if (dynamicIndex !== undefined) {
      mIndex = this.size() + dynamicIndex
    }
    const existProps = this.value[mIndex]
    // 服务端渲染页面走到这步必定返回
    if (existProps) return existProps

    const item = this.getFullQueue()[mIndex]
    // 和getValue里同理
    const resolve = item(null, golbalProps, ...this.value)
    this.value.push(resolve)
    return resolve.then((props) => {
      this.value[mIndex] = props
      return props
    })
  }
}

interface IState {
  isRender: boolean,
  asyncProps: any,
}

export const pathMap = new Map()

function Async(path) {
  return (AsyncComponent) => {
    const { getInitialProps, LoadingComponent = defaultLoadingComponent } = AsyncComponent
    const index = InitialProps.combine(path, getInitialProps)
    // 动态队列索引
    let dynamicIndex: number

    return class AsyncConnect extends Component<any, IState> {
      public static move() {
        // 动态模块的异步操作移至动态队列
        const instance = pathMap.get(path)
        dynamicIndex = instance.moveToDynamicQueue(index)
      }

      public state: IState
      public mounted: boolean

      constructor(props) {
        super(props)
        this.state = {
          isRender: checkServer(),
          asyncProps: {}
        }
        this.load()
      }

      public componentDidMount() {
        this.mounted = true
      }

      public componentWillUnmount() {
        this.mounted = false
      }

      public getGlobalProps() {
        const { isRender } = this.state
        if (isRender) {
          // 服务端不会走到这一步，不需要此值
          return null
        }
        return window.__SSR_DATA__.props
      }

      public setProps = (asyncProps) => {
        const isRender = true
        if (this.mounted) {
          this.setState({ asyncProps, isRender })
        } else {
          this.state = { isRender, asyncProps }
        }
      }

      public load() {
        const resolveValue = pathMap
          .get(path)
          .getProps(index, dynamicIndex, this.getGlobalProps())

        if (resolveValue instanceof Promise) {
          resolveValue.then(this.setProps)
        } else {
          this.setProps(resolveValue)
        }
      }

      public render() {
        const { isRender, asyncProps } = this.state
        if (isRender) {
          const props = {
            ...this.props,
            ...asyncProps
          }
          return (
            <AsyncComponent {...props}/>
          )
        }

        return (
          <LoadingComponent {...this.props} />
        )
      }
    }
  }
}

Async.setDefaultLoadingComponent = (LoadingComponent) => {
  defaultLoadingComponent = LoadingComponent
}

export default Async
