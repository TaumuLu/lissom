import htmlescape from 'htmlescape';
import { getStyleMap } from './style-loader';
import { getAsyncChunks } from './webpack-runtime';

const scriptType = 'text/javascript';
const cssRel = 'stylesheet';

export default async function createHtml({
  pageHTML,
  styleHTML,
  htmlConfig,
  router,
  ssrData,
}) {
  const { html } = htmlConfig;
  const assetTags = getAssetTags({ pageHTML, styleHTML, router, ssrData });

  return injectAssetsIntoHtml(html, assetTags);
}

const getAssetTags = ({ pageHTML, styleHTML, router, ssrData }) => {
  const { name } = router;
  const { asyncJsChunks, asyncCssChunks } = getAsyncChunks();
  const styleMap = getStyleMap();

  const jsDefinition = asyncJsChunks.map(src => {
    return {
      attributes: { type: scriptType, src },
      tagName: 'script',
    };
  });
  const cssDefinition = asyncCssChunks.map(href => {
    return {
      attributes: { href, rel: cssRel },
      tagName: 'link',
    };
  });
  const styleDefinition = Object.keys(styleMap).reduce((p, key) => {
    const { parts } = styleMap[key];
    parts.forEach(value => {
      p.push(value);
    });
    return p;
  }, []);

  const assetTags = {
    bodyStart: [
      {
        attributes: {
          id: '__ssr_root__',
          style: 'height: 100%; display: flex',
        },
        tagName: 'div',
        innerHTML: pageHTML,
      },
      {
        attributes: { type: scriptType },
        tagName: 'script',
        innerHTML: `
        window.__SSR_DATA__ = ${htmlescape(ssrData)}
        window.__SSR_LOADED_PAGES__ = ['${name}'];
        window.__SSR_REGISTER_PAGE__ = function(r,f) { __SSR_LOADED_PAGES__.push([r, f()]) };
      `,
      },
      ...jsDefinition,
    ],
    headEnd: [...cssDefinition, ...styleDefinition],
  };
  if (styleHTML) {
    assetTags.headEnd.push({
      innerHTML: styleHTML,
    } as any);
  }

  return assetTags;
};

const getTagRegExp = (tag, isEnd = false, flags = 'i') => {
  let tagAfter = '\\s';
  if (tag === 'html') {
    tagAfter = '[^>]';
  }
  const regStr = `(<${isEnd ? '\\/' : ''}${tag}${tagAfter}*>)`;
  return new RegExp(regStr, flags);
};
const htmlReg = getTagRegExp('html');
const bodyRegStart = getTagRegExp('body');
const bodyRegEnd = getTagRegExp('body', true);
const headRegExpEnd = getTagRegExp('head', true);
// const scriptRegStart = getTagRegExp('script')

const injectAssetsIntoHtml = (html, assetTags) => {
  const { bodyStart = [], bodyEnd = [], headEnd = [] } = Object.keys(
    assetTags
  ).reduce((p, k) => {
    const tags = assetTags[k];
    return {
      ...p,
      [k]: tags.map(createHtmlTag),
    };
  }, {}) as any;

  if (bodyStart.length || bodyEnd.length) {
    if (bodyRegStart.test(html)) {
      html = html.replace(bodyRegStart, match => match + bodyStart.join(''));
    } else {
      html += bodyStart.join('');
    }
    if (bodyRegEnd.test(html)) {
      html = html.replace(bodyRegEnd, match => bodyEnd.join('') + match);
    } else {
      html += bodyEnd.join('');
    }
  }

  if (headEnd.length) {
    if (!headRegExpEnd.test(html)) {
      if (!htmlReg.test(html)) {
        html = `<head></head>${html}`;
      } else {
        html = html.replace(htmlReg, match => `${match}<head></head>`);
      }
    }

    html = html.replace(headRegExpEnd, match => headEnd.join('') + match);
  }

  // if (scriptStart.length) {
  //   if (scriptRegStart.test(html)) {
  //     html = html.replace(scriptRegStart, match => scriptStart.join('') + match)
  //   } else {
  //     html += scriptStart.join('')
  //   }
  // }

  return html;
};

const createHtmlTag = tagDefinition => {
  const {
    attributes,
    voidTag = false,
    closeTag = true,
    tagName,
    innerHTML,
    selfClosingTag = false,
  } = tagDefinition;
  if (!tagName) return innerHTML;

  const attributeList = Object.keys(attributes || {})
    .filter(attributeName => attributes[attributeName] !== false)
    .map(attributeName => {
      if (attributes[attributeName] === true) {
        return attributeName;
      }
      return `${attributeName}="${tagDefinition.attributes[attributeName]}"`;
    });

  const isVoidTag = voidTag !== undefined ? voidTag : !closeTag;
  const isSelfClosingTag = voidTag !== undefined ? voidTag : selfClosingTag;
  return `<${[tagName].concat(attributeList).join(' ')}${
    isSelfClosingTag ? '/' : ''
  }>${innerHTML || ''}${isVoidTag ? '' : `</${tagName}>`}`;
};
