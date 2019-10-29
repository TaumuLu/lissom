import htmlescape from 'htmlescape'
import { Base64 } from 'js-base64'
import { IRouter, ISSRData } from '../../lib/types'
import ParseHtml from './parse-html'
import { getStyleMap } from './style-loader'
import { getAsyncChunks } from './webpack-runtime'

interface ICreateAssetTags {
  pageHTML?: string
  styleHTML?: string
  router: IRouter
  ssrData: ISSRData
}
interface ICreateHtml extends ICreateAssetTags {
  parseHtml: ParseHtml
}

export default function createHtml({
  pageHTML,
  styleHTML,
  parseHtml,
  router,
  ssrData,
}: ICreateHtml): string {
  const { clientRender } = ssrData
  // 重置回初始的html
  parseHtml.reset()
  const assetTags = createAssetTags({
    pageHTML,
    styleHTML,
    router,
    ssrData,
  })
  parseHtml.injectTags(assetTags)
  // 删除script标签
  if (!clientRender) {
    parseHtml.deleteScriptTag()
  }

  return parseHtml.get()
}

const cssRel = 'stylesheet'
const scriptType = 'text/javascript'

const createAssetTags = ({
  pageHTML = '',
  styleHTML = '',
  router,
  ssrData,
}: ICreateAssetTags): any => {
  const { name } = router
  const { rootAttr, clientRender } = ssrData
  const { jsDefinition, cssDefinition, styleDefinition } = getDefinition(
    clientRender,
    styleHTML
  )

  return {
    headEnd: [...cssDefinition, ...styleDefinition],
    bodyStart: [
      {
        attributes: {
          id: '__ssr_root__',
          style: 'height: 100%; display: flex',
          ...rootAttr,
        },
        tagName: 'div',
        innerHTML: pageHTML,
      },
      {
        attributes: { type: scriptType },
        tagName: 'script',
        innerHTML: `
          window.__SSR_DATA__ = ${createSSRData(ssrData)}
          window.__SSR_LOADED_PAGES__ = ['${name}'];
          window.__SSR_REGISTER_PAGE__ = function(r,f) { __SSR_LOADED_PAGES__.push([r, f()]) };
        `,
      },
      ...jsDefinition,
    ],
  }
}

const createSSRData = (ssrData: ISSRData) => {
  const code = htmlescape(ssrData)
  const { isBase64 } = ssrData
  if (isBase64) {
    return `'${Base64.encode(code)}'`
  }
  return code
}

const getDefinition = (clientRender: boolean, styleHTML: string) => {
  let jsDefinition = []
  let cssDefinition = []
  let styleDefinition = []
  const { asyncJsChunks, asyncCssChunks } = getAsyncChunks()
  const styleMap = getStyleMap()

  if (clientRender) {
    jsDefinition = asyncJsChunks.map(src => {
      return {
        attributes: { type: scriptType, src },
        tagName: 'script',
      }
    })
  }
  cssDefinition = asyncCssChunks.map(href => {
    return {
      attributes: { href, rel: cssRel },
      tagName: 'link',
    }
  })
  styleDefinition = Object.keys(styleMap).reduce((p, key) => {
    const { parts } = styleMap[key]
    parts.forEach(value => {
      p.push(value)
    })
    return p
  }, [])

  if (styleHTML) {
    styleDefinition.push({
      innerHTML: styleHTML,
    })
  }

  return { jsDefinition, cssDefinition, styleDefinition }
}
