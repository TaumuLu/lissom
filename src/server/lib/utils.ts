import chalk from 'chalk';
// import { posix } from 'path';
import { RUNTIME_NAME } from '../../lib/constants';
import { ICtx } from '../../lib/types';
import { getDisplayName } from '../../lib/utils';
import config from '../config';

export function deleteCache(path: string) {
  const cacheModule = require.cache[path];
  if (cacheModule) {
    // 同时清除父模块的引用，避免开发模式下内存泄漏
    const { parent = {} } = cacheModule;
    const { children = [] } = parent;
    parent.children = children.filter(child => child.id !== path);
    delete require.cache[path];
  }
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

export const getPathName = (name: string): string => {
  return name.charAt(0) === '/' ? name : `/${name}`;
};

export function normalizePagePath(page: string): string {
  if (page === '/') {
    page = '/index';
  }
  page = getPathName(page);
  // 路由不在我这没必要校验路径
  // const resolvedPage = posix.normalize(page);
  // if (page !== resolvedPage) {
  //   const message = 'Requested and resolved page mismatch';
  //   printAndExit(message);
  // }

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

export function isResSent(res) {
  return res.finished || res.headersSent;
}

const loadGetInitial = (methodName: string, defaultValue: any = {}): Function =>
  async function(Component: any, ctx: ICtx) {
    if (process.env.NODE_ENV !== 'production') {
      if (Component.prototype && Component.prototype[methodName]) {
        const compName = getDisplayName(Component);
        const message = `'${compName}.${methodName}()' is defined as an instance method`;
        printAndExit(message);
      }
    }
    const { error } = ctx;
    if (error) {
      return {
        error,
      };
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
