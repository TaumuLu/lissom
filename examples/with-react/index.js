import { isSsrRender } from 'lissom/utils'
import React from 'react'
import ReactDOM from 'react-dom'

import App from './src/App'

import './src/styles/index.scss'

if (!isSsrRender()) {
  ReactDOM.render(<App />, document.getElementById('root'))
}

export default App
