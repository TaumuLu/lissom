export const checkServer = (): boolean =>
  Object.prototype.toString.call(global.process) === '[object process]';

export function interopDefault(mod: any): any {
  return mod.default || mod;
}

export const getDisplayName = Component =>
  Component.displayName || Component.name || 'Component';

export const getType = value => {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
};

const isTypeFactory = type => value => {
  return getType(value) === type;
};

export const isFunction = isTypeFactory('function');

export const isString = isTypeFactory('string');

export const isArray = isTypeFactory('array');

const baseGetSet = path => {
  const type = getType(path);
  switch (type) {
    case 'array':
      return path;
    case 'string':
      return `${path}`.split('.');
    default:
      return [];
  }
};

export const get = (object, path, defaultValue?) => {
  const pathArray = baseGetSet(path);

  return (
    pathArray.reduce((obj, key) => {
      return obj && obj[key] ? obj[key] : null;
    }, object) || defaultValue
  );
};

export const set = (object, path, value) => {
  const pathArray = baseGetSet(path);
  const len = pathArray.length;

  return pathArray.reduce((obj, key, ind) => {
    if (obj && ind === len - 1) {
      obj[key] = value;
    }

    return obj ? obj[key] : null;
  }, object);
};
