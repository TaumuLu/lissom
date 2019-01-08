import React, { Component } from 'react'
import { checkServer } from "./utils";

let defaultLoadingComponent = () => null

class InitialProps {
  static combine(path, getInitialProps) {
    let index = 0
    if(pathMap.has(path)) {
      index = pathMap.get(path).push(getInitialProps)
    } else {
      pathMap.set(path, new InitialProps(getInitialProps))
    }
    return index
  }

  queue: Array<Function>
  value: Array<any>
  isLock: boolean

  constructor(getInitialProps) {
    this.queue = [getInitialProps]
    this.value = []
  }

  push(getInitialProps) {
    if (this.isLock) {
      // 不要在render时添加含有异步操作的动态组件，请把有异步操作的动态组件放在文件运行时执行
      throw new Error("Don't introduce dynamic components with asynchronous operations when rendering, Please introduce dynamic components with asynchronous operations when the file is running")
    }

    return this.queue.push(getInitialProps) - 1
  }

  setValue(value) {
    this.isLock = true
    this.value = value
  }

  async getValue(ctx, porps) {
    this.isLock = true
    this.value = []
    for (let resolve of this.queue) {
      const props = await resolve(ctx, porps, ...this.value)
      this.value.push(props);
    }
    return this.value
  }

  getProps(index, props) {
    if (this.value.length === this.queue.length) {
      return this.value[index]
    }
    const resolve = this.queue[index]
    return resolve(null, props, ...this.value).then((props) => {
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
      state: IState
      mounted: boolean

      constructor(props) {
        super(props)
        this.state = {
          isRender: checkServer(),
          asyncProps: {}
        }
        this.load()
      }

      componentDidMount() {
        this.mounted = true
      }

      componentWillUnmount() {
        this.mounted = false
      }

      getGlobalProps() {
        const { isRender } = this.state
        if (isRender) {
          // 服务单肯定能找到值
          return null
        }
        return window.__SSR_DATA__.props
      }

      setProps = (asyncProps) => {
        const isRender = true
        if (this.mounted) {
          this.setState({ asyncProps, isRender })
        } else {
          this.state = { isRender, asyncProps }
        }
      }

      load() {
        const resolveValue = pathMap
          .get(path)
          .getProps(index, this.getGlobalProps())

        if (resolveValue instanceof Promise) {
          resolveValue.then(this.setProps)
        } else {
          this.setProps(resolveValue)
        }
      }

      render() {
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