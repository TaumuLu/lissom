import { Base64 } from 'js-base64';
import { ISSRData, ReactComp } from './types';

export const getType = (value: any) => {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
};

const isTypeFactory = (type: string) => (value: any) => {
  return getType(value) === type;
};

export const isFunction = isTypeFactory('function');

export const isString = isTypeFactory('string');

export const isArray = isTypeFactory('array');

export const isRegExp = isTypeFactory('regexp');

export function isDef(v: any) {
  return v !== undefined && v !== null;
}

export const checkServer = (): boolean =>
  Object.prototype.toString.call(global.process) === '[object process]';

export function interopDefault(mod: any): any {
  return mod.default || mod;
}

export const getDisplayName = (Component: ReactComp) => {
  if (isString(Component)) return Component;

  return Component.displayName || Component.name || 'Unknown Component';
};

const getRegSourceStr = regs => {
  return regs
    .reduce((p, reg) => {
      if (reg) {
        if (isRegExp(reg)) {
          p.push(reg.source);
        } else {
          p.push(reg.toString());
        }
      }
      return p;
    }, [])
    .join('|');
};

export const createReg = (
  regs: Array<RegExp | string> = [],
  noMatch?: boolean
) => {
  const isEmpty = !(regs && regs.length > 0);
  const regTpl = isEmpty ? '' : getRegSourceStr(regs);
  let regStr = isEmpty && noMatch ? '^$' : '';
  if (regTpl) {
    regStr += `(${regTpl})`;
  }
  return new RegExp(regStr);
};

type Tpath = string | string[];

const baseGetSet = (path: Tpath): string[] => {
  const type = getType(path);
  switch (type) {
    case 'array':
      return path as string[];
    case 'string':
      return `${path}`.split('.');
    default:
      return [];
  }
};

export const get = (object: any, path: Tpath, defaultValue?: any) => {
  const pathArray = baseGetSet(path);

  return (
    pathArray.reduce((obj, key) => {
      return obj && obj[key] ? obj[key] : null;
    }, object) || defaultValue
  );
};

export const set = (object: any, path: Tpath, value: any) => {
  const pathArray = baseGetSet(path);
  const len = pathArray.length;

  return pathArray.reduce((obj, key, ind) => {
    if (obj && ind === len - 1) {
      obj[key] = value;
    }

    return obj ? obj[key] : null;
  }, object);
};

export function parseSSRData(): ISSRData {
  const ssrData = window.__SSR_DATA__;
  if (typeof ssrData === 'string') {
    const code = Base64.atob(ssrData);
    try {
      return JSON.parse(code);
    } catch (error) {
      throw error;
    }
  }
  return ssrData;
}
