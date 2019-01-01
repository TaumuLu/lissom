import React from 'react'
import htmlescape from 'htmlescape'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import { loadGetInitialStyles } from './lib/utils'
import { getAsyncChunks } from './webpack-runtime'

const scriptType = 'text/javascript'
const cssRel = 'stylesheet'

export default async function createHtml({ htmlConfig, props, router, Component, ctx, staticMarkup }) {
  const { html } = htmlConfig
  const { name } = router
  const data = { props }
  const render = staticMarkup ? renderToStaticMarkup : renderToString
  const innerHTML = render(<Component {...props}/>)
  const { asyncJsChunks, asyncCssChunks } = getAsyncChunks()
  const jsDefinition = asyncJsChunks.map((src) => {
    return {
      attributes: { type: scriptType, src },
      tagName: 'script',
    }
  })
  const cssDefinition = asyncCssChunks.map((href) => {
    return {
      attributes: { href, rel: cssRel },
      tagName: 'link',
    }
  })

  const assetTags = {
    bodyStart: [{
      attributes: { id: '__ssr__' },
      tagName: 'div',
      innerHTML,
    }],
    headEnd: [...cssDefinition],
    scriptStart: [{
      attributes: { type: scriptType },
      tagName: 'script',
      innerHTML: `
        window.__SSR_DATA__ = ${htmlescape(data)}
        window.__SSR_LOADED_PAGES__ = ['${name}'];
        window.__SSR_REGISTER_PAGE__ = function(r,f){__SSR_LOADED_PAGES__.push([r, f()])};
      `,
    }, ...jsDefinition],
  }
  const Styles = await loadGetInitialStyles(Component, ctx)
  if (Styles) {
    assetTags.headEnd.push({
      innerHTML: render(Styles),
    } as any)
  }

  const htmlTemplate = injectAssetsIntoHtml(html, assetTags)
  return htmlTemplate
}

const getTagRegExp = (tag, isEnd = false, flags = 'i') => {
  let tagAfter = '\\s'
  if (tag === 'html') {
    tagAfter = '[^>]'
  }
  const regStr = `(<${isEnd ? '\\/' : ''}${tag}${tagAfter}*>)`
  return new RegExp(regStr, flags)
}
const htmlReg = getTagRegExp('html')
const bodyRegStart = getTagRegExp('body')
const bodyRegEnd = getTagRegExp('body', true)
const headRegExpEnd = getTagRegExp('head', true)
const scriptRegStart = getTagRegExp('script')

const injectAssetsIntoHtml = (html, assetTags) => {
  const { bodyStart = [], bodyEnd = [], headEnd = [], scriptStart = [] } = Object
    .keys(assetTags)
    .reduce((p, k) => {
      const tags = assetTags[k]
      return {
        ...p,
        [k]: tags.map(createHtmlTag),
      }
    }, {}) as any

  if (bodyStart.length || bodyEnd.length) {
    if (bodyRegStart.test(html)) {
      html = html.replace(bodyRegStart, match => match + bodyStart.join(''))
    } else {
      html += bodyStart.join('')
    }
    if (bodyRegEnd.test(html)) {
      html = html.replace(bodyRegEnd, match => bodyEnd.join('') + match)
    } else {
      html += bodyEnd.join('')
    }
  }

  if (headEnd.length) {
    if (!headRegExpEnd.test(html)) {
      if (!htmlReg.test(html)) {
        html = `<head></head>${html}`
      } else {
        html = html.replace(htmlReg, match => `${match}<head></head>`)
      }
    }

    html = html.replace(headRegExpEnd, match => headEnd.join('') + match)
  }

  if (scriptStart.length) {
    if (scriptRegStart.test(html)) {
      html = html.replace(scriptRegStart, match => scriptStart.join('') + match)
    } else {
      html += scriptStart.join('')
    }
  }

  return html
}

const createHtmlTag = (tagDefinition) => {
  const { attributes, voidTag = false, closeTag = true, tagName, innerHTML, selfClosingTag = false } = tagDefinition
  if (!tagName) return innerHTML

  const attributeList = Object.keys(attributes || {})
    .filter(attributeName => attributes[attributeName] !== false)
    .map((attributeName) => {
      if (attributes[attributeName] === true) {
        return attributeName
      }
      return `${attributeName}="${tagDefinition.attributes[attributeName]}"`
    })

  const isVoidTag = voidTag !== undefined ? voidTag : !closeTag
  const isSelfClosingTag = voidTag !== undefined ? voidTag : selfClosingTag
  return `<${[tagName].concat(attributeList).join(' ')}${isSelfClosingTag ? '/' : ''}>${
    innerHTML || ''
  }${isVoidTag ? '' : `</${tagName}>`}`
}