import React from 'react';
import async from 'lissom/async';

@async(['/', '/async'])
export default class Async extends React.Component {
  static async getInitialProps(...params) {
    const asyncValue = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 2,
        });
      }, 1000);
    });
    return { asyncValue };
  }

  render() {
    const { asyncValue } = this.props;
    console.log('async props: 2', asyncValue);

    return (
      <div style={{ height: 50, justifyContent: 'center' }}>
        <p style={{ color: 'red', fontSize: 24 }}>Async Module</p>
      </div>
    );
  }
}
