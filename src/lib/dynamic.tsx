import React, { Component } from 'react'
import { ReactComp } from "./types"

let defaultLoadingComponent = () => null

interface IState {
  AsyncComponent: ReactComp<any>
}

function asyncComponent(config) {
  const { resolve, LoadingComponent = defaultLoadingComponent } = config

  return class DynamicComponent extends Component<any, IState> {
    mounted: boolean
    state: IState

    constructor(props) {
      super(props)
      this.state = {
        AsyncComponent: null,
      }
      this.load()
    }

    componentDidMount() {
      this.mounted = true
    }

    componentWillUnmount() {
      this.mounted = false
    }

    setComponent = (module) => {
      const AsyncComponent = module.default || module
      if (this.mounted) {
        this.setState({ AsyncComponent })
      } else {
        this.state.AsyncComponent = AsyncComponent
      }
    }

    load() {
      const value = resolve()

      if (value._isSyncModule) {
        this.setComponent(value)
      } else {
        value.then(this.setComponent)
      }
    }

    render() {
      const { AsyncComponent } = this.state
      if (AsyncComponent) {
        return (
          <AsyncComponent {...this.props} />
        )
      }

      return (
        <LoadingComponent {...this.props} />
      )
    }
  }
}

function dynamic(config) {
  const { component: resolveComponent } = config
  return asyncComponent({
    resolve() {
      return resolveComponent()
    },
    ...config,
  })
}

dynamic.setDefaultLoadingComponent = (LoadingComponent) => {
  defaultLoadingComponent = LoadingComponent
}

export default dynamic