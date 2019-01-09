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

    public setComponent = (mod) => {
      const DynamicComponent = mod.default || mod
      if (this.mounted) {
        this.setState({ DynamicComponent })
      } else {
        this.state = { DynamicComponent }
      }
    }

    public load() {
      if (resolveValue._isSyncModule) {
        this.setComponent(resolveValue)
      } else {
        resolveValue.then(this.setComponent)
      }
    }

    public render() {
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
