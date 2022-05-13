import async from 'lissom/async'
import dynamic from 'lissom/dynamic'
import { nanoid } from 'nanoid'
import React, { Component } from 'react'
import {
  BrowserRouter,
  Link,
  MemoryRouter,
  Route,
  Switch,
} from 'react-router-dom'

import AsyncComponent from './async'
import ErrorBoundary from './error-boundary'
import logo from './files/logo.svg'
import HooksComponent from './hooks'

import './styles/app.less'

const DynamicComponent = dynamic(() => import('./dynamic'))

export default class App extends Component {
  static async getInitialProps(ctx) {
    // throw new Error('test');
    const { location } = ctx

    // throw new Error('test');
    return { location }
  }

  id = nanoid()

  onClick = e => {
    e.preventDefault()
    console.log('click')
  }

  render() {
    let Router = BrowserRouter
    let routeProps = {}
    if (checkServer()) {
      Router = MemoryRouter
      const { location } = this.props
      const { pathname, search } = location
      routeProps = {
        initialEntries: [{ pathname, search }],
      }
    }

    return (
      <ErrorBoundary>
        <Router {...routeProps}>
          <div className="App">
            <header className="App-header">
              <div className="App-logo">
                <img src={logo} className="App-logo-img" alt="logo" />
              </div>
              <ul className="link-ul">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/dynamic">dynamic</Link>
                </li>
                <li>
                  <Link to="/async">async</Link>
                </li>
                <li>
                  <Link to="/hooks">hooks</Link>
                </li>
              </ul>
              <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/dynamic" component={DynamicComponent} />
                <Route path="/async" component={AsyncComponent} />
                <Route path="/hooks" component={HooksComponent} />
              </Switch>
            </header>
          </div>
        </Router>
      </ErrorBoundary>
    )
  }
}

@async(['/'])
class Home extends Component {
  static async getInitialProps(ctx) {
    const asyncValue = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 1,
        })
      }, 1000)
    })
    return { asyncValue }
  }

  static loadComponent() {
    return <h1>loading</h1>
  }

  constructor(props) {
    super(props)
    console.log('willMount')
  }

  // componentDidMount() {
  //   throw new Error('test');
  // }

  // componentWillMount() {
  //   console.log('willMount')
  // }

  componentWillUnmount() {
    console.log('willUnmount')
  }

  render() {
    const { onClick, asyncValue } = this.props
    console.log('home props: 1', asyncValue)

    return (
      <div
        onClick={onClick}
        style={{
          height: 50,
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: 'red',
            fontSize: 24,
          }}
        >
          Lissom
        </p>
      </div>
    )
  }
}

export const checkServer = () =>
  Object.prototype.toString.call(global.process) === '[object process]'
