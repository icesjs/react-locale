import React, { useState, useEffect, useContext, useMemo } from 'react'
import { withDefinitions, MessageDefinitions, PluginFunction } from './message'
import {
  getLocale as getGlobalLocale,
  setLocale as setContextLocale,
  validateLocale,
  subscribe,
} from './context'

/**
 * useTrans 或 useContextTrans 的返回值类型。
 */
export type UseTransResponse = [
  /**
   * 转译函数。用于获取转译后的消息内容。
   */
  (key: string, ...pluginArgs: any[]) => string,
  /**
   * 用于变更当前区域语言设置。
   */
  typeof setContextLocale,
  /**
   * 当前已应用的区域语言值。
   */
  string
]

/**
 * useTrans 函数的类型定义。
 */
export type UseTransType = ReturnType<typeof withDefinitionsHook>

/**
 * UseContextTrans 函数的类型定义。
 */
export type UseContextTransType = ReturnType<typeof withDefinitionsContextHook>

/**
 * 使用语言消息内容转译函数。
 * @param locale 当前应用的区域语言代码。
 * @param definitions 语言消息内容定义对象。
 * @param plugins 使用到的插件或插件列表。
 * @param fallback 备选区域语言代码。默认值为全局备选区域语言代码。
 */
function useLocale(
  locale: string,
  definitions?: MessageDefinitions,
  plugins?: PluginFunction | PluginFunction[] | null,
  fallback?: string
): UseTransResponse {
  // 创建一个转译上下文，以及绑定上下文转译函数
  // 这个上下文对象，需要保持引用不变，所以使用memo缓存起来
  const transContext = useMemo(() => ({}), [])
  // 转译函数使用的数据如果发生了变化，则重新生成转译函数
  const translate = useMemo(() => withDefinitions(definitions, transContext), [definitions])
  // 根据当前参数，设置转译上下文属性值
  Object.assign(transContext, {
    locale,
    fallback,
    plugins,
  })
  // setContextLocale 会推送全局locale状态变更事件
  // 如果是绑定了上下文的组件，其状态值以上下文状态为准
  // 因为没有订阅该状态变更事件，所以也不会响应全局状态变化
  return [translate, setContextLocale, locale]
}

/**
 * 使用绑定了上下文组件的本地化消息hook。
 * @param contextType 上下文组件。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
export function useContextLocaleTrans(
  contextType: React.Context<string>,
  plugins?: PluginFunction | PluginFunction[] | null,
  fallback?: string,
  definitions?: MessageDefinitions
) {
  // 这里locale状态从上下文中获取
  const locale = useContext(contextType)
  // 这里校验上下文组件提供的值
  // 校验值是因为，上下文组件可以任意设置其值类型，并不能保证提供的值是有效的区域语言代码字符串
  // 如果校验不通过，会抛出异常
  validateLocale(locale)
  // 使用转译函数
  return useLocale(locale, definitions, plugins, fallback)
}

/**
 * 使用本地化消息hook。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
export function useLocaleTrans(
  plugins?: PluginFunction | PluginFunction[] | null,
  fallback?: string,
  definitions?: MessageDefinitions
) {
  // 定义函数组件locale状态
  const [locale, setLocale] = useState(getGlobalLocale())
  // 订阅全局locale状态变更事件
  useEffect(() => subscribe(setLocale), [])
  // 使用转译函数
  return useLocale(locale, definitions, plugins, fallback)
}

/**
 * 绑定消息定义对象的 useTrans hook。
 * @param definitions 消息定义对象。
 */
export function withDefinitionsHook(definitions?: MessageDefinitions) {
  return function useTrans(plugins?: PluginFunction | PluginFunction[] | null, fallback?: string) {
    return useLocaleTrans(plugins, fallback, definitions)
  }
}

/**
 * 绑定消息定义对象的 useContextTrans hook。
 * @param definitions 消息定义对象。
 */
export function withDefinitionsContextHook(definitions?: MessageDefinitions) {
  return function useContextTrans(
    contextType: React.Context<string>,
    plugins?: PluginFunction | PluginFunction[] | null,
    fallback?: string
  ) {
    return useContextLocaleTrans(contextType, plugins, fallback, definitions)
  }
}
