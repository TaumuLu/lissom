import htmlescape from 'htmlescape';
import { IRouter, ISSRData } from '../../lib/types';
import ParseHtml from './parse-html';
import { getStyleMap } from './style-loader';
import { getAsyncChunks } from './webpack-runtime';

interface IParam {
  pageHTML?: string;
  styleHTML?: string;
  parseHtml: ParseHtml;
  router: IRouter;
  ssrData: ISSRData;
}

export default function createHtml({
  pageHTML,
  styleHTML,
  parseHtml,
  router,
  ssrData,
}: IParam): string {
  // 重置回初始的html
  parseHtml.reset();
  const assetTags = createAssetTags({
    pageHTML,
    styleHTML,
    router,
    ssrData,
  });
  parseHtml.injectTags(assetTags);

  return parseHtml.get();
}

const cssRel = 'stylesheet';
const scriptType = 'text/javascript';

const createAssetTags = ({
  pageHTML = '',
  styleHTML = '',
  router,
  ssrData,
}) => {
  const { name } = router;
  const { rootAttr } = ssrData;
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
          window.__SSR_DATA__ = ${htmlescape(ssrData)}
          window.__SSR_LOADED_PAGES__ = ['${name}'];
          window.__SSR_REGISTER_PAGE__ = function(r,f) { __SSR_LOADED_PAGES__.push([r, f()]) };
        `,
      },
      ...jsDefinition,
    ],
  };
  if (styleHTML) {
    assetTags.headEnd.push({
      innerHTML: styleHTML,
    });
  }

  return assetTags;
};
