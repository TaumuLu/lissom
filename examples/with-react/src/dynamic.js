import React from 'react';
import async from 'lissom/async';

@async('/')
export default class Dynamic extends React.Component {
  static async getInitialProps(...params) {
    const value = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 3,
        });
      }, 1000);
    });
    return value;
  }

  render() {
    console.log('dynamic props', this.props);

    return (
      <div style={{ height: 50, justifyContent: 'center' }}>
        <p style={{ color: 'red', fontSize: 24 }}>dynamic module</p>
      </div>
    );
  }
}
