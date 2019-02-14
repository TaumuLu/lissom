const checkServer = (): boolean => Object.prototype.toString.call(global.process) === '[object process]'

function interopDefault(mod: any): any {
  return mod.default || mod
}

export {
  checkServer,
  interopDefault
}
