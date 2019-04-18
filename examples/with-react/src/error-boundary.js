import React from 'react';

export default class ErrorComponent extends React.Component {
  state = {
    error: null,
    info: null,
  };

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    const { children } = this.props;
    const { error, info } = this.state;
    if (error || info) {
      const { message, stack } = error;
      return (
        <div>
          <p>{message}</p>
          <pre>{stack}</pre>
        </div>
      );
    }
    return children;
  }
}
