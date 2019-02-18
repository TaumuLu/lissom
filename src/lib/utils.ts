const checkServer = (): boolean =>
  Object.prototype.toString.call(global.process) === '[object process]';

function interopDefault(mod: any): any {
  return mod.default || mod;
}

const getType = value => {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
};

function isFunction(value) {
  return getType(value) === 'function';
}

export { checkServer, interopDefault, getType, isFunction };
