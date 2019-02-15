import { ConcatSource } from 'webpack-sources';

export default class PagesPlugin {
  public apply(compiler) {
    compiler.hooks.compilation.tap('PagesPlugin', compilation => {
      compilation.moduleTemplates.javascript.hooks.render.tap(
        'PagesPluginRenderRegister',
        (moduleSourcePostModule, module, options) => {
          const { chunk } = options;

          // 排除非入口模块
          if (chunk.entryModule !== module) {
            return moduleSourcePostModule;
          }

          // 排除非项目入口模块
          if (compilation.compiler !== compiler) {
            return moduleSourcePostModule;
          }

          // 包装入口模块注册函数，供客户端查找调用
          const source = new ConcatSource(
            'var __SSR_REGISTER_PAGE__ = __SSR_REGISTER_PAGE__ || function(r, f) { return f() }\n',
            `__SSR_REGISTER_PAGE__('${chunk.name}', function() {\n`,
            moduleSourcePostModule,
            '\nreturn { page: module.exports.default }',
            '});'
          );

          return source;
        }
      );
    });
  }
}
