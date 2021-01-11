import { withDefinitionsHook, UseLocaleResponse } from './hooks'
import { withDefinitionsComponent, TranslateComponentProps } from './Translate'
export { setLocale, getLocale, subscribe } from './context'
export { withDefinitionsHook, withDefinitionsComponent }
export * as utils from './utils'
export * as plugins from './plugins'

/**
 * 类型组件内使用的转换组件。
 */
export type Translate = ReturnType<typeof withDefinitionsComponent>

/**
 * 类型组件内使用的转换组件，是Translate组件的别名。
 */
export type Trans = Translate

/**
 * 函数组件内使用的hook，可提供区域语言内容转换。
 */
export type useLocale = ReturnType<typeof withDefinitionsHook>

export { UseLocaleResponse, TranslateComponentProps }
export {
  PluginFunction,
  PluginTranslateFunction,
  Message,
  MessageValue,
  MessageDefinitions,
} from './message'

// 下面定义的常量，仅为生成类型定义文件。
// 如果需要直接使用这些常量，请用 withXxx 方法进行语言内容绑定，并获取相应方法。

/**
 * 类型组件内使用的转换组件。
 */
export const Translate: Translate = withDefinitionsComponent({})

/**
 * 类型组件内使用的转换组件，是Translate组件的别名。
 */
export const Trans: Translate = Translate

/**
 * 函数组件内使用的hook，可提供区域语言内容转换。
 */
export const useLocale: useLocale = withDefinitionsHook({})

/**
 * 函数组件内使用的hook，可提供区域语言内容转换。
 */
export default useLocale
