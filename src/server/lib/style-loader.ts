let styleMap = {};

function addStyleMap(styles, options) {
  for (let i = 0; i < styles.length; i++) {
    const item = styles[i];
    const parts = [];

    for (let j = 0; j < item.parts.length; j++) {
      parts.push(createDefinition(item.parts[j], options));
    }

    // 每次替换新的样式
    styleMap[item.id] = { id: item.id, parts };
  }
}

function createDefinition(obj, options) {
  let result;

  // If a transform function was defined, run it on the css
  if (options.transform && obj.css) {
    result =
      typeof options.transform === 'function'
        ? options.transform(obj.css)
        : options.transform.default(obj.css);

    if (result) {
      // If transform returns a value, use that instead of the original css.
      // This allows running runtime transformations on the css.
      obj.css = result;
    } else {
      // If the transform function returns a falsy value, don't add this css.
      // This allows conditional loading of css
      return function() {
        // noop
      };
    }
  }
  return {
    tagName: 'style',
    attributes: getAttrs(options),
    innerHTML: obj.css,
  };
}

function getAttrs(options) {
  if (options.attrs.type === undefined) {
    options.attrs.type = 'text/css';
  }

  return options.attrs;
}

function listToStyles(list, options) {
  const styles = [];
  const newStyles = {};

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const id = options.base ? item[0] + options.base : item[0];
    const css = item[1];
    const media = item[2];
    const sourceMap = item[3];
    const part = { css, media, sourceMap };

    if (!newStyles[id]) styles.push((newStyles[id] = { id, parts: [part] }));
    else newStyles[id].parts.push(part);
  }

  return styles;
}

const getStyleMap = () => {
  return styleMap;
};

// 目前暂未执行清理操作，考虑node_modules里的模块清理掉后无法再次生成，故每次生成style时采用替换的操作
const clearStyleMap = () => {
  styleMap = {};
};

export { getStyleMap, clearStyleMap };

export default (list, options) => {
  options = options || {};
  options.attrs = typeof options.attrs === 'object' ? options.attrs : {};
  if (!options.insertInto) options.insertInto = 'head';
  if (!options.insertAt) options.insertAt = 'bottom';

  const styles = listToStyles(list, options);
  addStyleMap(styles, options);
};
