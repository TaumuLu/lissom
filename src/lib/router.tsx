import React from 'react'
import {
  BrowserRouter,
  BrowserRouterProps,
  MemoryRouter,
} from 'react-router-dom'

import { ILocation } from './types'
import { checkServer } from './utils'

let location: ILocation

// 服务端调用
export const setLocation = (value: ILocation) => {
  location = value
}

export const Router = (props: BrowserRouterProps) => {
  let Router = BrowserRouter
  let routeProps = {}
  if (checkServer()) {
    Router = MemoryRouter

    if (location) {
      const { pathname, search } = location || {}

      routeProps = {
        initialEntries: [{ pathname, search }],
      }
    }
  }
  return <Router {...props} {...routeProps} />
}
