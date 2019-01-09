import React, { Component } from 'react'
import { checkServer } from "./utils";

let defaultLoadingComponent = () => null

class InitialProps {
  public static combine(path, getInitialProps) {
    let index = 0
    if (pathMap.has(path)) {
      index = pathMap.get(path).push(getInitialProps)
    } else {
      pathMap.set(path, new InitialProps(getInitialProps))
    }
    return index
  }

  public queue: Function[]
  public value: any[]
  public isLock: boolean

  constructor(getInitialProps) {
    this.queue = [getInitialProps]
    this.value = []
  }

  public push(getInitialProps) {
    if (this.isLock) {
      // 不要在render时添加含有异步操作的动态组件，请把有异步操作的动态组件放在文件运行时执行
      throw new Error("Don't introduce dynamic components with asynchronous operations when rendering, Please introduce dynamic components with asynchronous operations when the file is running")
    }

    return this.queue.push(getInitialProps) - 1
  }

  public setValue(value) {
    this.isLock = true
    this.value = value
  }

  public async getValue(ctx, golbalProps) {
    this.isLock = true
    this.value = []
    for (const item of this.queue) {
      const resolve = item(ctx, golbalProps, ...this.value)
      this.value.push(resolve);
    }
    this.value = await Promise.all(this.value)
    return this.value
  }

  public getProps(index, golbalProps) {
    if (this.value.length === this.queue.length) {
      return this.value[index]
    }
    const item = this.queue[index]
    const resolve = item(null, golbalProps, ...this.value)
    this.value.push(resolve)
    return resolve.then((props) => {
      this.value[index] = props
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

    return class AsyncConnect extends Component<any, IState> {
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
          // 服务端肯定能找到值
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
          .getProps(index, this.getGlobalProps())

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
