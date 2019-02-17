import React from 'react';
import async from 'lissom/async';

@async('/')
export default class Async extends React.Component {
  static async getInitialProps(...params) {
    const value = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 2,
        });
      }, 1000);
    });
    return value;
  }

  render() {
    console.log('async props', this.props);

    return (
      <div style={{ height: 50, justifyContent: 'center' }}>
        <p style={{ color: 'red', fontSize: 24 }}>Test module</p>
      </div>
    );
  }
}
