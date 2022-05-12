import htmlescape from 'htmlescape'
import { Base64 } from 'js-base64'

import { INode, IRouter, IssRData } from '../../lib/types'
import ParseHtml from './parse-html'
import { getStyleMap } from './style-loader'
import { getAsyncChunks } from './webpack-runtime'

interface ICreateNodes {
  pageHTML?: string
  styleHTML?: string
  router: IRouter
  ssrData: IssRData
}
interface ICreateHtml extends ICreateNodes {
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
  parseHtml.restoreDom()
  // 删除已存在的同 id dom
  const rootId = ssrData.rootAttr?.id
  if (rootId) {
    parseHtml.deleteById(rootId)
  }

  const assetTags = createNodes({
    pageHTML,
    styleHTML,
    router,
    ssrData,
  })
  const { head, body } = assetTags
  parseHtml.headAddTags(head)
  parseHtml.bodyAddTags(body, { isPrepend: true })
  // 删除 script 标签
  if (!clientRender) {
    parseHtml.deleteByTag('script')
  }

  return parseHtml.serializer()
}

const cssRel = 'stylesheet'
const scriptType = 'text/javascript'

const createNodes = ({
  pageHTML = '',
  styleHTML = '',
  router,
  ssrData,
}: ICreateNodes) => {
  const { name } = router
  const { rootAttr } = ssrData
  const { jsDefinition, cssDefinition, styleDefinition } = getDefinition()

  if (styleHTML) {
    styleDefinition.push({
      children: styleHTML,
    })
  }

  return {
    head: [...cssDefinition, ...styleDefinition] as INode[],
    body: [
      {
        attribs: {
          id: '__ssr_root__',
          style: 'height: 100%; display: flex',
          ...rootAttr,
        },
        tagName: 'div',
        children: pageHTML,
      },
      {
        attribs: { type: scriptType },
        tagName: 'script',
        children: `
          window.__SSR_DATA__ = ${createSSRData(ssrData)}
          window.__SSR_LOADED_PAGES__ = ['${name}'];
          window.__SSR_REGISTER_PAGE__ = function(r,f) { __SSR_LOADED_PAGES__.push([r, f()]) };
        `,
      },
      ...jsDefinition,
    ] as INode[],
  }
}

const createSSRData = (ssrData: IssRData) => {
  const code = htmlescape(ssrData)
  const { isBase64 } = ssrData
  if (isBase64) {
    return `'${Base64.encode(code)}'`
  }
  return code
}

const getDefinition = () => {
  const { asyncJsChunks, asyncCssChunks } = getAsyncChunks()
  const styleMap = getStyleMap()

  const jsDefinition = asyncJsChunks.map<INode>(src => {
    return {
      attribs: { type: scriptType, src },
      tagName: 'script',
    }
  })
  const cssDefinition = asyncCssChunks.map<INode>(href => {
    return {
      attribs: { href, rel: cssRel },
      tagName: 'link',
    }
  })
  const styleDefinition = Object.keys(styleMap).reduce<INode[]>(
    (p, key) => p.concat(styleMap[key]),
    [],
  )

  return { jsDefinition, cssDefinition, styleDefinition }
}
