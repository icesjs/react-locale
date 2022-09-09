/**
 * 给 @ices/locale-webpack-plugin 使用的loader接口。
 * 用于获取模块资源，并导出相应模块接口。
 */
export function getModuleCode({
  module,
  esModule,
  resourcePath,
}: {
  module: string
  esModule: boolean
  resourcePath: string
}) {
  const runtime = JSON.stringify('@ices/react-locale')
  const request = JSON.stringify(module)
  return esModule
    ? `
    /** ${resourcePath} **/
    import definitions from ${request}
    import { withDefinitionsComponent, withDefinitionsHook, withDefinitionsContextHook } from ${runtime}
    var Trans = withDefinitionsComponent(definitions)
    var useTrans = withDefinitionsHook(definitions)
    var useContextTrans = withDefinitionsContextHook(definitions)
    export { useTrans as default, definitions, Trans, useTrans, useContextTrans }
  `
    : `
    /** ${resourcePath} **/
    var definitions = require(${request})
    var runtime = require(${runtime})
    var { withDefinitionsComponent, withDefinitionsHook, withDefinitionsContextHook } = runtime
    var Trans = withDefinitionsComponent(definitions)
    var useTrans = withDefinitionsHook(definitions)
    var useContextTrans = withDefinitionsContextHook(definitions)
    
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.default = useTrans
    exports.definitions = definitions
    exports.Trans = Trans
    exports.useTrans = useTrans
    exports.useContextTrans = useContextTrans
  `
}

/**
 * 给 @ices/locale-webpack-plugin 使用的loader接口。
 * 模块导出定义，用于生成资源模块的导出声明。
 */
export function getModuleExports() {
  return `export { useTrans as default, definitions, Trans, useTrans, useContextTrans }`
}
