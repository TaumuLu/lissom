import findUp from 'find-up'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { ASSETS_MANIFEST, RUNTIME_NAME } from '../lib/constants'
import { printAndExit } from '../lib/utils'
import { fileterJsAssets } from './lib/utils'

export default (outputDir) => {
  const assetsManifestPath = findUp.sync(ASSETS_MANIFEST, {
    cwd: outputDir,
  })

  if (!assetsManifestPath || !assetsManifestPath.length) {
    printAndExit('> use ssr webpack config')
  }
  const assetsManifest = require(assetsManifestPath)
  const { entrypoints, HtmlWebpackPlugin, outputPath, modules, chunks } = assetsManifest
  const routers = getRouters(entrypoints, outputPath)
  const htmlConfig = getHtmlConfig(HtmlWebpackPlugin, outputPath)

  return {
    routers,
    htmlConfig,
    outputPath,
    modules,
    chunks,
  }
}

const getRouters = (entrypoints, outputPath) => {
  return Object.keys(entrypoints).reduce((p, key, i) => {
    const { chunks, assets: originAssets } = entrypoints[key]
    const assets = fileterJsAssets(originAssets)

    const router = {
      name: key,
      chunks: chunks.filter(name => name !== RUNTIME_NAME),
      assets,
      existsAts: assets.map(path => resolve(outputPath, path)),
      size: assets.length,
    }
    if (i === 0) {
      p.default = router
    }
    const page = key.charAt(0) === '/' ? key : `/${key}`

    return {
      ...p,
      [page]: router,
    }
  }, { default: null })
}

const getHtmlConfig = (HtmlWebpackPlugin, outputPath) => {
  const [htmlConfig] = HtmlWebpackPlugin
  const { childCompilationOutputName } = htmlConfig
  const existsAt = resolve(outputPath, childCompilationOutputName)
  const html = readHtml(existsAt)

  return {
    ...htmlConfig,
    html,
    existsAt,
  }
}

const readHtml = (existsAt) => {
  if (!existsSync(existsAt)) {
    throw new Error(`Could not find a valid html file in the '${existsAt}' path!`)
  }
  const html = readFileSync(existsAt, 'utf8')
  return html
}