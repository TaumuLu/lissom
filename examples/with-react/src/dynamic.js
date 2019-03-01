import React from 'react';
import async from 'lissom/async';

@async(['/', '/dynamic'])
export default class Dynamic extends React.Component {
  static async getInitialProps(...params) {
    const asyncValue = await new Promise(resolve => {
      setTimeout(() => {
        resolve({
          async_value: 3,
        });
      }, 1000);
    });
    return { asyncValue };
  }

  render() {
    const { asyncValue } = this.props;
    console.log('dynamic props: 3', asyncValue);

    return (
      <div style={{ height: 50, justifyContent: 'center' }}>
        <p style={{ color: 'red', fontSize: 24 }}>Dynamic Module</p>
      </div>
    );
  }
}
