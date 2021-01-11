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
