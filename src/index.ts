import { useCallback, useMemo } from 'react'
import { MessageData, MessageDefinitions } from './message'
import {
  UseContextTransType,
  UseTransType,
  UseTransResponse,
  LocaleResourceLoader,
  withDefinitionsContextHook,
  withDefinitionsHook,
} from './hooks'
import { TranslateProps, TranslateType, withDefinitionsComponent } from './Translate'
import { determineLocale, hasOwnProperty } from './utils'

export {
  MessageDefinitions,
  TranslateProps,
  TranslateType,
  UseContextTransType,
  UseTransType,
  UseTransResponse,
  LocaleResourceLoader,
  determineLocale,
  withDefinitionsComponent,
  withDefinitionsContextHook,
  withDefinitionsHook,
}
export {
  LocaleContext,
  LocaleProvider,
  setLocale,
  setFallbackLocale,
  getLocale,
  getFallbackLocale,
  subscribe,
} from './context'
export { PluginFunction, PluginTranslate, MessageValue, MessageData } from './message'

// 异步本地化资源导入。
export type AsyncLocaleResources = { [P: string]: () => Promise<{ default: MessageData }> }

export type UseTranslatorResponse = {
  useTrans: UseTransType
  useContextTrans: UseContextTransType
  Translate: TranslateType
}

/**
 * 获取以同步或异步方式加载的本地化资源文件的hook或组件。
 * @param locales 可同步或异步加载的本地化资源。
 */
export function useTranslator(
  locales?: MessageDefinitions | AsyncLocaleResources | LocaleResourceLoader
): UseTranslatorResponse {
  const loader: LocaleResourceLoader = useCallback(
    async (lang: string) => {
      let data: MessageData
      if (typeof locales === 'function') {
        // LocaleResourceLoader
        return locales(lang)
      }
      if (locales && hasOwnProperty(locales, lang)) {
        // MessageDefinitions or AsyncLocaleResources
        const resource = locales[lang]
        if (typeof resource === 'function') {
          // AsyncLocaleResources
          ;({ default: data = {} } = await resource())
        } else {
          // MessageDefinitions
          data = resource || {}
        }
      } else {
        data = {}
      }
      return { [lang]: data }
    },
    [locales]
  )
  return useMemo(
    () => ({
      useTrans: withDefinitionsHook(loader),
      useContextTrans: withDefinitionsContextHook(loader),
      Translate: withDefinitionsComponent(loader),
    }),
    [loader]
  )
}

/**************************************************************************
 * API的实际导出是由构建插件@ices/locale-webpack-plugin根据语言定义文件自动生成。 \
 * 下面导出的常量，仅为自动生成定义声明，请不要直接使用。                          \
 * 如果需要自己绑定语言模块，可使用 useTranslator 自行绑定。                        \
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
