const getTagRegExp = (tag, isEnd = false, flags = 'i') => {
  let tagAfter = '\\s';
  if (tag === 'html') {
    tagAfter = '[^>]';
  }
  const regStr = `(<${isEnd ? '\\/' : ''}${tag}${tagAfter}*>)`;
  return new RegExp(regStr, flags);
};

const tagReg = {
  htmlReg: getTagRegExp('html'),
  bodyStart: getTagRegExp('body'),
  bodyEnd: getTagRegExp('body', true),
  headEnd: getTagRegExp('head', true),
};

const scriptTagReg = /<script[^<>]*(\/\s*>|>[\s\S]*<\/script>)/gi;

export default class ParseHtml {
  private _originSource: string;
  private _source: string;
  constructor(source) {
    this.set(source);
  }

  public checkHtml(source: string): string {
    if (!tagReg.headEnd.test(source)) {
      if (!tagReg.htmlReg.test(source)) {
        source = `<head></head>${source}`;
      } else {
        source = source.replace(
          tagReg.htmlReg,
          match => `${match}<head></head>`
        );
      }
    }
    if (!tagReg.bodyEnd.test(source)) {
      source = `${source}<body></body>`;
    }
    return source;
  }

  // public deleteTag(attr: string, value: string): void {
  //   const matchReg = new RegExp(`<[a-zA-Z]*\\s*${attr}\\s*=?\\s*['"]{1}${value}['"]{1}\\s*(\\/\\s*>|>([\\s\\S]*)<\\/[a-zA-Z]*\\s*>)`, 'g')
  //   this._source = this._source.replace(matchReg, '')
  // }
  public deleteScriptTag() {
    this._source = this._source.replace(scriptTagReg, '');
  }

  public reset(): void {
    this._source = this._originSource;
  }

  public injectTags(assetTags): string {
    Object.keys(assetTags).forEach(key => {
      const tags = assetTags[key];
      const isEnd = key.includes('End');
      const texts = tags.map(createTagTexts).join('');
      const reg = tagReg[key];

      this._source = this._source.replace(reg, match => {
        if (isEnd) {
          return texts + match;
        }
        return match + texts;
      });
    });
    return this._source;
  }

  public get(): string {
    return this._source;
  }

  public set(source: string): string {
    return (this._source = this._originSource = this.checkHtml(source));
  }
}

const createTagTexts = tagDefinition => {
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
