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
  return esModule
    ? `
    /** ${resourcePath} **/
    import definitions from ${module}
    import { withDefinitionsComponent, withDefinitionsHook, withDefinitionsContextHook } from ${runtime}
    export * from ${runtime}
    export const Trans = withDefinitionsComponent(definitions)
    export const Translate = Trans
    export const useTrans = withDefinitionsHook(definitions)
    export const useTranslate = useTrans
    export const useContextTrans = withDefinitionsContextHook(definitions)
    export const useContextTranslate = useContextTrans
    export { definitions, useTrans as default }
  `
    : `
    /** ${resourcePath} **/
    const definitions = require(${module})
    const runtime = require(${runtime})
    const { withDefinitionsComponent, withDefinitionsHook, withDefinitionsContextHook } = runtime
    
    Object.defineProperty(exports, '__esModule', { value: true });
    
    const Trans = withDefinitionsComponent(definitions)
    const Translate = Trans
    const useTrans = withDefinitionsHook(definitions)
    const useTranslate = useTrans
    const useContextTrans = withDefinitionsContextHook(definitions)
    const useContextTranslate = useContextTrans
    
    exports.default = useTrans
    exports.definitions = definitions
    
    exports.Trans = Trans
    exports.Translate = Translate
    exports.useTrans = useTrans
    exports.useTranslate = useTranslate
    exports.useContextTrans = useContextTrans
    exports.useContextTranslate = useContextTranslate
    
    exports.withDefinitionsComponent = withDefinitionsComponent
    exports.withDefinitionsHook = withDefinitionsHook
    exports.withDefinitionsContextHook = withDefinitionsContextHook
    
    exports.withDefinitions = runtime.withDefinitions
    exports.getLocale = runtime.getLocale
    exports.setLocale = runtime.setLocale
    exports.subscribe = runtime.subscribe
    exports.plugins = runtime.plugins
    exports.utils = runtime.utils
  `
}

/**
 * 给 @ices/locale-webpack-plugin 使用的loader接口。
 * 模块导出定义，用于生成资源模块的导出声明。
 */
export function getModuleExports() {
  return `
    import { useTrans } from '@ices/react-locale'
    export {
      Trans,
      Translate,
      definitions,
      getLocale,
      plugins,
      setLocale,
      subscribe,
      useContextTrans,
      useContextTranslate,
      useTrans,
      useTranslate,
      utils,
      withDefinitions,
      withDefinitionsComponent,
      withDefinitionsContextHook,
      withDefinitionsHook,
    } from '@ices/react-locale'
    export default useTrans
  `
}
