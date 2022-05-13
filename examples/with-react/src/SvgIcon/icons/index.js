export const requireAll = requireContext =>
  requireContext.keys().map(requireContext)

const svg = require.context('./svg', false, /\.svg$/)

requireAll(svg)
