import React, { Component } from 'react';
import logo from './files/logo.svg';

import './styles/app.less';

export default class App extends Component {
  onClick = e => {
    e.preventDefault();
    console.log(111111);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <div onClick={this.onClick} className="App-link">
            Learn React
          </div>
        </header>
      </div>
    );
  }
}
