import React, { Component } from 'react';
import dynamic from 'lissom/dynamic';
import async from 'lissom/async';
import logo from './files/logo.svg';
import AsyncCompoent from './async';

import './styles/app.less';

const DynamicComponent = dynamic({ component: () => import('./dynamic') });

@async('/')
export default class App extends Component {
  static async getInitialProps(...params) {
    const value = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 1,
        });
      }, 1000);
    });
    return value;
  }

  static loadComponent() {
    return <h1>loading</h1>;
  }

  onClick = e => {
    e.preventDefault();
    console.log(111111);
  };

  render() {
    console.log('example props', this.props);

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <AsyncCompoent />
          <DynamicComponent />
          <div onClick={this.onClick} className="App-link">
            lissom ssr
          </div>
        </header>
      </div>
    );
  }
}
