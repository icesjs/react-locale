import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_LOCALE, getLocale, setLocale, subscribe } from './context'
import { getLocaleMessage, MessageDefinitions, PluginFunction, MessageValue } from './message'

export type TranslateFunction = (key: string, ...args: any[]) => MessageValue
export type UseLocaleResponse = [TranslateFunction, string, typeof setLocale]

/**
 * 使用区域语言hook。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
export function useLocaleMessage(
  plugins: PluginFunction | PluginFunction[] | null = null,
  fallback: string = DEFAULT_LOCALE,
  definitions: MessageDefinitions = {}
): UseLocaleResponse {
  if (plugins === null) {
    plugins = []
  } else if (!Array.isArray(plugins)) {
    plugins = [plugins]
  }
  // 用到的转换插件
  const usedPlugins: PluginFunction[] = plugins.filter((p) => typeof p === 'function')

  // 定义locale状态
  const [locale, setLocale] = useState(getLocale())

  // 订阅区域语言更新
  useEffect(() => subscribe(setLocale), [])

  // 定义语言转换方法
  const translate = useCallback(
    (key: string, ...args: any[]) =>
      getLocaleMessage(key, args, { locale, fallback, definitions, plugins: usedPlugins }),
    // 依赖列表
    [locale, fallback, definitions, ...usedPlugins]
  )
  //
  return [translate, locale, setLocale]
}

/**
 * 绑定消息定义对象的 useLocale hook。
 * @param definitions 消息定义对象。
 */
export function withDefinitionsHook(definitions: MessageDefinitions) {
  return function useLocale(plugins?: PluginFunction | PluginFunction[] | null, fallback?: string) {
    return useLocaleMessage(plugins, fallback, definitions)
  }
}
