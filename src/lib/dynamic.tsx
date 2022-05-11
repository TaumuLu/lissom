import React, { Component, ReactElement } from 'react'

import { checkServer, interopDefault } from './utils'
interface IState {
  DynamicComponent: any
}

export const moduleLoader = new Set()

let component: ReactElement

let defaultLoading: any = () => null

interface Config {
  loader: () => Promise<any>
  loading?: ReactElement
}

function Dynamic(config: Config | Config['loader']) {
  if (typeof config === 'function') {
    config = { loader: config }
  }
  const { loader, loading = defaultLoading } = config

  // 服务端提前执行，支持动态组件中的异步操作，用于注册
  if (!component) {
    const resolve = loader()
    moduleLoader.add(resolve)

    resolve.then(result => {
      moduleLoader.delete(resolve)
      component = interopDefault(result)

      // 动态组件执行队列移动操作
      if (checkServer()) {
        const asyncComponent = component as any
        if (asyncComponent.move) {
          asyncComponent.move()
        }
      }
    })
  }

  return class DynamicConnect extends Component<any, IState> {
    public state: IState
    public mounted = false

    constructor(props: any) {
      super(props)
      this.state = {
        DynamicComponent: null,
      }
      this.load()
    }

    public componentDidMount() {
      this.mounted = true
    }

    public componentWillUnmount() {
      this.mounted = false
    }

    public onFulfilled = (result: any) => {
      const { value } = result
      const DynamicComponent = interopDefault(value)
      if (this.mounted) {
        this.setState({ DynamicComponent })
      } else {
        this.state = { DynamicComponent }
      }
    }

    public createResult = (value: any, error: any = null) => {
      this.onFulfilled({
        // _isSyncPromise: false,
        finish: true,
        error,
        value,
      })
    }

    public load() {
      // 两端再次执行注册
      if (component) {
        this.createResult(component)
      } else {
        loader()
          .then(this.createResult)
          .catch(error => this.createResult(null, error))
      }
    }

    public render() {
      const { DynamicComponent } = this.state
      if (DynamicComponent) {
        return <DynamicComponent {...this.props} />
      }

      const Loading = loading
      return <Loading {...this.props} />
    }
  }
}

Dynamic.setDefaultLoading = (loading: ReactElement) => {
  defaultLoading = loading
}

export default Dynamic
