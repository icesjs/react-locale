import { useState, useEffect, useCallback } from 'react'
import { defaultLocale, getCurrentLocale, setCurrentLocale, subscribe } from './context'
import getLocaleMessage, { MessageDefinitions, PluginFunction } from './message'

export type MessageValue = string | number | boolean | null | undefined

interface TranslateFunction<PluginArgs> {
  (key: string, ...args: PluginArgs[]): MessageValue
}

/**
 * 使用区域语言。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
function useLocale<PluginArgs>(
  plugins:
    | PluginFunction<MessageValue, PluginArgs>
    | PluginFunction<MessageValue, PluginArgs>[]
    | null = null,
  fallback: string = defaultLocale,
  definitions: MessageDefinitions<MessageValue> = {}
) {
  // 用到的转换插件
  const usedPlugins = (Array.isArray(plugins) ? [...plugins] : [plugins]).filter(
    (plugin) => typeof plugin === 'function'
  ) as PluginFunction<MessageValue, PluginArgs>[]

  // 定义locale状态
  const [locale, setLocale] = useState(getCurrentLocale())

  // 订阅区域语言更新
  useEffect(() => subscribe(setLocale), [])

  // 定义语言转换方法
  const translate = useCallback(
    (key: string, ...args: PluginArgs[]) =>
      getLocaleMessage({ locale, fallback, definitions, plugins: usedPlugins }, key, args),
    // 依赖列表
    [locale, fallback, definitions, ...usedPlugins]
  )

  return [translate, setCurrentLocale, locale] as [
    TranslateFunction<PluginArgs>,
    (locale: string) => void,
    string
  ]
}

// 导出hooks
export default useLocale
