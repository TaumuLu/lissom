const checkServer = () => Object.prototype.toString.call(global.process) === '[object process]'

function interopDefault(mod: any) {
  return mod.default || mod
}

export {
  checkServer,
  interopDefault
}
