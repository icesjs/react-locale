import { Context, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeLocale } from './utils'
import { MessageDefinitions, PluginFunction, TranslateFunction, withDefinitions } from './message'
import {
  fetchLocaleData,
  getFallbackLocale,
  getLocale as getGlobalLocale,
  LocaleContext,
  LocaleResourceLoader,
  setFallbackLocale,
  setLocale as setContextLocale,
  subscribe,
  validateLocale,
} from './context'

/**
 * useTrans 或 useContextTrans 的返回值类型。
 */
export type UseTransResponse = [
  /**
   * 转译函数。用于获取转译后的消息内容。
   */
  TranslateFunction,
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

// 插件函数如果不改变，则引用之前的数组，确保数组引用不变
function getUpdatedPlugins(
  prevPlugins: PluginFunction[],
  pluginsProp?: PluginFunction | PluginFunction[] | null
) {
  let nextPlugins: PluginFunction[]
  if (!pluginsProp) {
    nextPlugins = []
  } else if (typeof pluginsProp === 'function') {
    nextPlugins = [pluginsProp]
  } else {
    nextPlugins = [...pluginsProp]
  }
  if (prevPlugins.length !== nextPlugins.length) {
    return nextPlugins
  }
  for (let i = 0; i < prevPlugins.length; i++) {
    if (prevPlugins[i] !== nextPlugins[i]) {
      return nextPlugins
    }
  }
  return prevPlugins
}

/**
 * 获取转译函数。
 * @param context 转译函数所需上下文参数。
 * @param fallbackTranslate 备用的转译函数。
 */
function useTranslate(
  context: {
    data: MessageDefinitions | null
    locale: string
    fallback: string
    plugins?: PluginFunction | PluginFunction[] | null
  },
  fallbackTranslate?: TranslateFunction | null
) {
  const pluginsRef = useRef<PluginFunction[]>([])
  const plugins = getUpdatedPlugins(pluginsRef.current, context.plugins)
  pluginsRef.current = plugins

  const { data, locale, fallback } = context
  return useMemo(() => {
    return withDefinitions(data, { locale, fallback, plugins }, fallbackTranslate)
  }, [data, locale, fallback, plugins, fallbackTranslate])
}

/**
 * 使用语言消息内容转译函数。
 * @param expectedLocale 当前应用的区域语言代码。
 * @param definitions 语言消息内容定义对象，或者一个用于获取内容的的函数。
 * @param plugins 使用到的插件或插件列表。
 * @param fallback 备选区域语言代码。默认值为全局备选区域语言代码。
 */
function useLocale(
  expectedLocale: string,
  definitions?: MessageDefinitions | LocaleResourceLoader,
  plugins?: PluginFunction | PluginFunction[] | null,
  fallback?: string
): UseTransResponse {
  const isAsyncResources = typeof definitions === 'function'

  const fallbackLocale = useMemo(() => {
    if (fallback) {
      setFallbackLocale(fallback)
    }
    return getFallbackLocale()
  }, [fallback])

  const [state, setState] = useState<{
    resourceLoader: LocaleResourceLoader | null
    asyncData: MessageDefinitions | null
    asyncLocale: string
    asyncFallback: string
    useFallbackTranslate: boolean
  }>({
    resourceLoader: isAsyncResources ? definitions : null,
    asyncData: null,
    asyncLocale: expectedLocale,
    asyncFallback: fallbackLocale,
    useFallbackTranslate: false,
  })
  let { asyncData, resourceLoader, asyncLocale, asyncFallback, useFallbackTranslate } = state

  if (isAsyncResources) {
    if (
      resourceLoader !== definitions ||
      asyncLocale !== expectedLocale ||
      asyncFallback !== fallbackLocale
    ) {
      // 仅当数据源未更换时，即只切换语言时，使用备用的translate避免加载远程数据过程中闪白
      useFallbackTranslate = resourceLoader === definitions
      asyncData = null
      resourceLoader = definitions
      asyncLocale = expectedLocale
      asyncFallback = fallbackLocale
      // 重置状态
      setState({ resourceLoader, asyncData, asyncLocale, asyncFallback, useFallbackTranslate })
    }
  } else if (resourceLoader || asyncData || useFallbackTranslate) {
    // 异步数据源切换成了同步数据源
    useFallbackTranslate = false
    setState({ ...state, resourceLoader: null, asyncData: null, useFallbackTranslate: false })
  }

  // fallbackTranslate是为了解决切换语言时，等待加载数据期间，屏幕会“闪白”的问题
  const fallbackTranslateRef = useRef<TranslateFunction | null>(null)

  //
  const translate = useTranslate(
    {
      data: isAsyncResources ? asyncData : definitions || null,
      locale: expectedLocale,
      fallback: fallbackLocale,
      plugins,
    },
    useFallbackTranslate ? fallbackTranslateRef.current : null
  )
  fallbackTranslateRef.current = translate

  useEffect(() => {
    if (typeof definitions !== 'function') {
      fallbackTranslateRef.current = null
      return
    }
    // 加载并更新语言数据
    fetchLocaleData(expectedLocale, fallbackLocale, definitions).then(
      (data) => {
        // 数据加载成功
        setState((prevState) => {
          if (
            prevState.asyncLocale === expectedLocale &&
            prevState.asyncFallback === fallbackLocale &&
            prevState.resourceLoader === definitions
          ) {
            // 清除备选translate，使得重新生成新的translate
            fallbackTranslateRef.current = null
            return { ...prevState, asyncData: data, useFallbackTranslate: false }
          }
          // 加载数据期间，又切换了语言，当次更新作废，返回“前一个”状态
          return prevState
        })
      },
      // 数据加载失败
      () => {
        setState((prevState) => {
          if (
            prevState.asyncLocale === expectedLocale &&
            prevState.asyncFallback === fallbackLocale &&
            prevState.resourceLoader === definitions
          ) {
            // 更新组件，并生成返回空字符串的translate
            fallbackTranslateRef.current = null
            return { ...prevState, asyncData: null, useFallbackTranslate: false }
          }
          return prevState
        })
      }
    )
  }, [definitions, expectedLocale, fallbackLocale])

  return [translate, expectedLocale, setContextLocale]
}

/**
 * 使用绑定了上下文组件的本地化消息hook。
 * @param contextType 上下文组件。
 * @param plugins 插件函数，或包含插件函数的数组。
 * @param fallback 当前区域语言没有匹配到相关定义时，备选的区域语言。默认值为默认的区域语言设置。
 * @param definitions 区域语言内容定义。
 */
export function useContextLocaleTrans(
  contextType: Context<string>,
  plugins?: PluginFunction | PluginFunction[] | null,
  fallback?: string,
  definitions?: MessageDefinitions | LocaleResourceLoader
) {
  // 这里locale状态从上下文中获取
  const locale = useContext(contextType)
  //
  let localeCode: string
  if (contextType !== LocaleContext) {
    ;[localeCode] = normalizeLocale(locale)
    // 这里校验上下文组件提供的值
    // 校验值是因为，上下文组件可以任意设置其值类型，并不能保证提供的值是有效的区域语言代码字符串
    // 如果校验不通过，会抛出异常
    validateLocale(localeCode, false, locale)
  } else {
    localeCode = locale
  }
  // 使用转译函数
  return useLocale(localeCode, definitions, plugins, fallback)
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
  definitions?: MessageDefinitions | LocaleResourceLoader
) {
  // 定义函数组件locale状态
  const [locale, setLocale] = useState(() => getGlobalLocale())
  // 订阅全局locale状态变更事件
  useEffect(() => subscribe(setLocale), [])
  // 使用转译函数
  return useLocale(locale, definitions, plugins, fallback)
}

/**
 * 绑定消息定义对象的 useTrans hook。
 * @param definitions 消息定义对象。
 */
export function withDefinitionsHook(definitions?: MessageDefinitions | LocaleResourceLoader) {
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
export function withDefinitionsContextHook(
  definitions?: MessageDefinitions | LocaleResourceLoader
) {
  return function useContextTrans(
    contextType: Context<string>,
    plugins?: PluginFunction | PluginFunction[] | null,
    fallback?: string
  ) {
    return useContextLocaleTrans(contextType, plugins, fallback, definitions)
  }
}
