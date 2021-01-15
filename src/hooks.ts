import React, { useState, useEffect, useContext, useMemo } from 'react'
import { withDefinitions, MessageDefinitions, PluginFunction } from './message'
import {
  getLocale as getGlobalLocale,
  setLocale as setContextLocale,
  validateLocale,
  subscribe,
  setFallbackLocale,
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
   * 当前已应用的区域语言值。
   */
  string,
  /**
   * 用于变更当前区域语言设置。
   */
  typeof setContextLocale
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
  return [translate, locale, setContextLocale]
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
  // 初始化 locale 状态
  let init = (initLocale?: () => string, initialFallback?: string) => {
    // 重置为空方法，因为只需要初始化执行一次
    init = () => {}
    // 设置初始化值
    if (typeof initLocale === 'function') {
      setContextLocale(initLocale())
    }
    if (typeof initialFallback === 'string') {
      setFallbackLocale(initialFallback)
    }
  }

  /**
   * 用于设置初始化locale值。
   * 一般在切换语言的组件中使用。
   * @param plugins 当前trans使用的插件列表。
   * @param initialLocale 初始化的locale值或返回locale值的初始化函数。
   * @param initialFallback 初始化的备选locale值。
   */
  function useTrans(
    plugins: PluginFunction | PluginFunction[] | null,
    initialLocale: string | (() => string),
    initialFallback: string
  ): UseTransResponse
  /**
   * 常规使用的方法。
   * @param plugins 当前trans使用的插件列表。
   * @param fallback 当前trans使用的备选语言。
   */
  function useTrans(
    plugins: PluginFunction | PluginFunction[] | null,
    fallback: string
  ): UseTransResponse
  /**
   * 只使用插件。备选语言使用已初始化设置或默认的值。
   * @param plugins 当前trans使用的插件列表。
   */
  function useTrans(plugins: PluginFunction | PluginFunction[] | null): UseTransResponse
  /**
   * 不使用插件。备选语言使用已初始化设置或默认的值。
   */
  function useTrans(): UseTransResponse
  // 方法重载实现
  function useTrans(...args: any[]): any {
    const plugins = args[0]
    let initLocale
    let initialFallback
    let fallback
    if (args.length >= 3) {
      initLocale = typeof args[1] === 'function' ? args[1] : () => args[1]
      initialFallback = args[2]
    } else {
      fallback = args[1]
    }
    // 设置初始化的locale
    init(initLocale, initialFallback)
    //
    return useLocaleTrans(plugins, fallback, definitions)
  }
  return useTrans
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
