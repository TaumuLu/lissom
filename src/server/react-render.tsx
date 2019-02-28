import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import config from './config';
import { printAndExit } from './lib/utils';
import Render from './render';

export default class ReactRender extends Render {
  public validComponent(Component, router) {
    const { isValidElementType } = require('react-is');
    if (!isValidElementType(Component)) {
      printAndExit(
        `The default export is not a React Component in webpack entry: "${
          router.name
        }"`
      );
    }
  }

  public render(Component): string {
    const { staticMarkup } = config.get();
    const render = staticMarkup ? renderToStaticMarkup : renderToString;
    if (Component) {
      return render(<Component />);
    }
    return '';
  }
}
