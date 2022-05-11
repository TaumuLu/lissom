import React, { Component } from 'react'

import { ReactComp } from './types'
import { checkServer, interopDefault, isFunction } from './utils'

let defaultLoading = () => null

interface IState {
  DynamicComponent: ReactComp<any>
}

export const moduleLoader = new Set()

let component

function Dynamic(config) {
  if (isFunction(config)) {
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
        if (component.move) {
          component.move()
        }
      }
    })
  }

  return class DynamicConnect extends Component<any, IState> {
    public state: IState
    public mounted: boolean

    constructor(props) {
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

    public onFulfilled = result => {
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
        _isSyncPromise: false,
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

Dynamic.setDefaultLoading = loading => {
  defaultLoading = loading
}

export default Dynamic
