import React, { Component } from 'react'
import { ReactComp } from "./types"

let defaultLoadingComponent = () => null

interface IState {
  DynamicComponent: ReactComp<any>
}

function Dynamic(config) {
  const { component: resolveComponent, LoadingComponent = defaultLoadingComponent } = config
  // 提前执行，支持动态组件中的异步操作
  const resolveValue = resolveComponent()

  return class DynamicConnect extends Component<any, IState> {
    state: IState
    mounted: boolean

    constructor(props) {
      super(props)
      this.state = {
        DynamicComponent: null,
      }
      this.load()
    }

    componentDidMount() {
      this.mounted = true
    }

    componentWillUnmount() {
      this.mounted = false
    }

    setComponent = (mod) => {
      const DynamicComponent = mod.default || mod
      if (this.mounted) {
        this.setState({ DynamicComponent })
      } else {
        this.state = { DynamicComponent }
      }
    }

    load() {
      if (resolveValue._isSyncModule) {
        this.setComponent(resolveValue)
      } else {
        resolveValue.then(this.setComponent)
      }
    }

    render() {
      const { DynamicComponent } = this.state
      if (DynamicComponent) {
        return (
          <DynamicComponent {...this.props} />
        )
      }

      return (
        <LoadingComponent {...this.props} />
      )
    }
  }
}

Dynamic.setDefaultLoadingComponent = (LoadingComponent) => {
  defaultLoadingComponent = LoadingComponent
}

export default Dynamic