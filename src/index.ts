import { TranslateType, withDefinitionsComponent } from './Translate'
import {
  UseContextTransType,
  UseTransType,
  withDefinitionsContextHook,
  withDefinitionsHook,
} from './hooks'
import { MessageDefinitions } from './message'
//
export * as utils from './utils'
export * as plugins from './plugins'
//
export {
  LocaleContext,
  LocaleProvider,
  setLocale,
  setFallbackLocale,
  getLocale,
  getFallbackLocale,
  subscribe,
} from './context'
export { withDefinitionsHook, withDefinitionsContextHook, UseTransResponse } from './hooks'
export { withDefinitionsComponent, TranslateType } from './Translate'
export { PluginFunction, PluginTranslate, MessageValue, MessageDefinitions } from './message'

/**************************************************************************
 * API的实际导出是由构建插件@ices/locale-webpack-plugin根据语言定义文件自动生成。 \
 * 下面导出的常量，仅为自动生成定义声明，请不要直接使用。                          \
 * 如果需要自己绑定语言模块，可使用 withXxx 方法自行绑定。                        \
 *************************************************************************/

/**
 * 类型组件内使用的转译组件。
 */
export const Trans: TranslateType = withDefinitionsComponent()

/**
 * 函数组件内使用的hook，可提供区域语言内容转译。
 */
export const useTrans: UseTransType = withDefinitionsHook()

/**
 * 函数组件内使用的绑定至指定上下文组件的内容转译hook。
 */
export const useContextTrans: UseContextTransType = withDefinitionsContextHook()

/**
 * 语言模块内的消息定义内容。
 */
export const definitions: MessageDefinitions = {}
