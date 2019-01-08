const checkServer = () => Object.prototype.toString.call(global.process) === '[object process]'

export {
  checkServer,
}