import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  getLocaleMessage,
  normalizeDefinitions,
  MessageDefinitions,
  PluginFunction,
} from './message'
import {
  FALLBACK_LOCALE as fallbackLocale,
  getLocale as getCurrentLocale,
  setLocale as setContextLocale,
  isValidLocale,
  subscribe,
} from './context'

/**
 * 函数组件内部应用 useLocale 时，其返回的值类型。
 */
export type UseLocaleResponse = [
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
 * 使用区域语言hook。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param contextType 绑定当前函数组件的上下文。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
export function useLocaleMessage(
  plugins: PluginFunction | PluginFunction[] | null = null,
  contextType: React.Context<string> | null = null,
  fallback: string = fallbackLocale,
  definitions: MessageDefinitions = {}
): UseLocaleResponse {
  //
  if (plugins === null) {
    plugins = []
  } else if (!Array.isArray(plugins)) {
    plugins = [plugins]
  }
  // 用到的插件，可以对消息进行格式化处理
  const usedPlugins: PluginFunction[] = plugins.filter((p) => typeof p === 'function')
  let contextLocale: any
  if (contextType) {
    // 绑定上下文
    contextLocale = useContext(contextType)
  }
  // 定义locale状态
  const [locale, setLocale] = useState(
    // 初始状态取当前上下文的值
    // 检查值是否有效是因为上下文值可以由提供方任意设置，并没有保障
    // 这里如果值无效，其实是会抛异常了
    contextType && isValidLocale(contextLocale) ? contextLocale : getCurrentLocale()
  )
  if (contextType) {
    // 处于同一个上下文，却在不同的组件树根下的组件，可能会拥有不同的上下文值(Provider的就近取值原则)
    // 这里函数组件如果绑定了上下文，则以上下文Provider组件中的值为状态值
    // 如果Provider上下文状态变化了，则重新渲染
    if (contextLocale !== locale) {
      setLocale(contextLocale)
    }
  } else {
    // 没有指定上下文，则订阅全局locale状态变更事件
    useEffect(() => subscribe(setLocale), [])
  }
  // 定义语言转换方法
  const translate = useCallback(
    (key: string, ...args: any[]) =>
      getLocaleMessage(key, args, { locale, fallback, definitions, plugins: usedPlugins }),
    // 依赖列表
    [locale, fallback, definitions, ...usedPlugins]
  )
  // setContextLocale 会推送全局locale状态变更事件
  // 如果是绑定了上下文的组件，其状态值以上下文状态为准
  // 因为没有订阅该状态变更事件，所以也不会响应全局状态变化
  return [translate, setContextLocale, locale]
}

/**
 * 绑定消息定义对象的 useLocale hook。
 * @param data 消息定义对象。
 */
export function withDefinitionsHook(data: MessageDefinitions) {
  const definitions = normalizeDefinitions(data)
  return function useLocale(
    plugins?: PluginFunction | PluginFunction[] | null,
    contextType?: React.Context<string> | null,
    fallback?: string
  ): UseLocaleResponse {
    return useLocaleMessage(plugins, contextType, fallback, definitions)
  }
}
