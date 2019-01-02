"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function printAndExit(message, code = 1) {
    if (code === 0) {
        console.log(message);
    }
    else {
        console.error(message);
    }
    process.exit(code);
}
exports.printAndExit = printAndExit;
function getType(value, nameStr) {
    const typeName = Object.prototype.toString.call(value).slice(8, -1);
    if (nameStr) {
        return typeName.toLowerCase() === nameStr.toLowerCase();
    }
    return typeName;
}
exports.getType = getType;
exports.suffixRegs = [/\.(html|php)/, /\/[^.]*/];
exports.getRegSourceStr = (regs) => {
    return regs.reduce((p, reg) => {
        if (reg) {
            const type = Object.prototype.toString.call(reg).slice(8, -1);
            if (type === 'RegExp') {
                p.push(reg.source);
            }
            else {
                p.push(reg.toString());
            }
        }
        return p;
    }, []).join('|');
};
exports.getReg = (regs = [], matchEnd = true) => {
    const regTpl = exports.getRegSourceStr(regs);
    let regStr = '';
    if (regTpl) {
        regStr += `(${regTpl})${matchEnd ? '$' : ''}`;
    }
    return new RegExp(regStr);
};
//# sourceMappingURL=utils.js.map