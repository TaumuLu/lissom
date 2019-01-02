"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntry = (entries, entry) => {
    const prependEntry = (entry) => {
        if (typeof entry === 'function') {
            return () => Promise.resolve(entry()).then(prependEntry);
        }
        if (typeof entry === 'object' && !Array.isArray(entry)) {
            const clone = {};
            Object.keys(entry).forEach((key) => {
                clone[key] = entries.concat(entry[key]);
            });
            return clone;
        }
        return entries.concat(entry);
    };
    return prependEntry(entry);
};
function handleExport(options) {
    const isES6DefaultExported = typeof options === 'object' && options !== null && typeof options.default !== 'undefined';
    return isES6DefaultExported ? options.default : options;
}
function handleFunction(options, ...params) {
    if (typeof options === 'function') {
        options = options(...params);
    }
    return options;
}
function prepareOptions(options, ...params) {
    options = handleExport(options);
    return Array.isArray(options)
        ? options.map(_options => handleFunction(_options, ...params))
        : handleFunction(options, ...params);
}
exports.prepareOptions = prepareOptions;
//# sourceMappingURL=utils.js.map