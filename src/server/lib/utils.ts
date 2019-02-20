import chalk from 'chalk';
import { posix } from 'path';
import { RUNTIME_NAME } from '../../lib/constants';
import { getDisplayName } from '../../lib/utils';
import config from '../config';

export function deleteCache(path: string) {
  delete require.cache[path];
}

export function purgeCache(moduleName: string, ignoreModules: string[]) {
  const modPath = require.resolve(moduleName);
  searchCache(modPath, deleteCache, ignoreModules);
  const mConstructor = module.constructor as any;

  Object.keys(mConstructor._pathCache).forEach(cacheKey => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete mConstructor._pathCache[cacheKey];
    }
  });
}

function searchCache(modPath, callback, ignoreModules = []) {
  const searchMod = modPath && require.cache[modPath];

  if (searchMod !== undefined) {
    (function traverse(mod) {
      const id = mod.id;
      const isExclude = ignoreModules.some(exmod => id.includes(exmod));
      if (!isExclude) {
        mod.children.forEach(child => {
          traverse(child);
        });
      }
      callback(mod.id);
    })(searchMod);
  }
}

export function normalizePagePath(page: string) {
  if (page === '/') {
    page = '/index';
  }

  if (page[0] !== '/') {
    page = `/${page}`;
  }

  const resolvedPage = posix.normalize(page);
  if (page !== resolvedPage) {
    const message = 'Requested and resolved page mismatch';
    printAndExit(message);
  }

  return page;
}

export const fileterJsAssets = (originAssets: string[]): string[] => {
  return originAssets.filter(path => {
    return /.js($|\?)/.test(path) && !path.includes(RUNTIME_NAME);
  });
};

export const fileterCssAssets = (originAssets: string[]): string[] => {
  return originAssets.filter(path => {
    return /.css($|\?)/.test(path) && !path.includes(RUNTIME_NAME);
  });
};

export function print(message: string) {
  const dev = config.get('dev');
  if (!dev) return;

  const signMessage = `${chalk.green('[lissom]')} ${message.trim()}`;
  console.log(signMessage);
}

export function log(action: string, message: string, sign: string = 'INFO') {
  let chalkColor;
  switch (sign.toUpperCase()) {
    case 'INFO':
      chalkColor = chalk.cyan;
      break;
    case 'ERROR':
      chalkColor = chalk.red;
      break;
    default:
      chalkColor = chalk.white;
      break;
  }
  print(`${chalk.gray(action)} ${chalkColor(message)}`);
}

export function printAndExit(message: string, code: number = 1) {
  log('exit', message, 'ERROR');

  process.exit(code);
}

export const suffixRegs = [/\.(html|php)/, /\/[^.]*/];

export function isResSent(res) {
  return res.finished || res.headersSent;
}

const loadGetInitial = (methodName: string, defaultValue: any = {}) =>
  async function(Component, ctx) {
    if (process.env.NODE_ENV !== 'production') {
      if (Component.prototype && Component.prototype[methodName]) {
        const compName = getDisplayName(Component);
        const message = `'${compName}.${methodName}()' is defined as an instance method`;
        printAndExit(message);
      }
    }

    if (!Component[methodName]) return defaultValue;

    const props = await Component[methodName](ctx);

    if (ctx.res && isResSent(ctx.res)) {
      return props;
    }

    if (!props) {
      const compName = getDisplayName(Component);
      const message = `'${compName}.${methodName}()' should resolve to an object. But found '${props}' instead.`;
      printAndExit(message);
    }

    return props;
  };

export const loadGetInitialProps = loadGetInitial('getInitialProps');

export const loadGetInitialStyles = loadGetInitial('getInitialStyles', null);

export * from '../../lib/utils';
