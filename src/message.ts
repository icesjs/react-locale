import { formatPluginArgs, normalizeLocale, hasOwnProperty } from './utils'
import { getFallbackLocale, getLocale, validateLocale } from './context'
import { placeholder } from './plugins'

type MessageDataValue = string | number | boolean | null
type MessageData = { [key: string]: MessageDataValue }

/**
 * 语言模块消息内容定义类型。
 */
export type MessageDefinitions = {
  [locale: string]: MessageData
}

/**
 * 语言消息内容的值类型。
 */
export type MessageValue = string | number

/**
 * 插件函数，用来实现语言内容的格式转译。
 */
export type PluginFunction = (
  message: MessageValue,
  pluginArgs: any[],
  translate: PluginTranslate
) => MessageValue

/**
 * 插件使用的转译函数，可供插件获取语言模块消息内容。
 */
export type PluginTranslate = ReturnType<typeof getPluginTranslate>

/**
 * 判定给定的值是否是一个消息内容的值。
 * @param obj
 */
function isMessageDataValue(obj: any) {
  return obj === null || /string|number|boolean/.test(typeof obj)
}

// 转换为数字和字符串类型
function toMessageValue(val: MessageDataValue): MessageValue {
  return typeof val === 'number' ? val : `${val}`
}

/**
 * 格式化定义语言消息定义。
 * @param dataSet 语言消息定义内容集
 */
export function normalizeDefinitions(dataSet: any): MessageDefinitions {
  const definitions: MessageDefinitions = {}
  for (const entry of Object.entries(Object.assign({}, dataSet))) {
    const [locale, data] = entry as [string, any]
    if (data === null || typeof data !== 'object') {
      continue
    }
    const localeCode = normalizeLocale(locale)[0]
    if (!hasOwnProperty(definitions, localeCode)) {
      definitions[localeCode] = {}
    }
    const messageData = definitions[localeCode]
    for (const [key, val] of Object.entries(data)) {
      if (isMessageDataValue(val)) {
        messageData[key] = val as MessageDataValue
      }
    }
  }
  return definitions
}

/**
 * 根据区域数据过滤消息内容。
 * @param key 消息键名。
 * @param dataList 区域消息数据集。
 * @param preference 首选区域语言。
 */
function filterMessage(
  key: string,
  dataList: { locale: string; data: MessageData }[],
  preference: string
) {
  for (const { locale, data } of dataList) {
    if (hasOwnProperty(data, key)) {
      const message = data[key]
      if (locale !== preference && process.env.NODE_ENV === 'development') {
        console.warn(
          `Missing message with key of "${key}" for locale [${preference}], using default message of locale [${locale}] as fallback.`
        )
      }
      return { locale, message }
    }
  }
  return null
}

/**
 * 获取插件转换函数。
 * @param locale 当前使用的语言
 * @param fallback 备选语言
 */
function getPluginTranslate(locale: string, fallback?: string) {
  // 插件内部可用于转译插件自身消息内容的转译函数
  return (
    key: string,
    // 需要指定内容定义
    definitions: MessageDefinitions,
    options?:
      | {
          plugins?: PluginFunction | PluginFunction[] | null
          pluginArgs?: any
          fallback?: string
        }
      | string
      | null
  ) => {
    let plugins
    let pluginArgs
    let pluginFallback
    if (typeof options === 'string') {
      pluginFallback = options
    } else {
      ;({ plugins, pluginArgs, fallback: pluginFallback } = Object.assign({}, options))
    }
    return withDefinitions(definitions, {
      // 这里locale是经过主消息匹配后的语言，可能是备选语言
      locale,
      plugins,
      fallback: pluginFallback || fallback,
    })(key, ...formatPluginArgs(pluginArgs))
  }
}

/**
 * 获取区域化的内容。
 * @param key
 * @param pluginArgs
 * @param context
 */
export function getLocaleMessage(
  key: string,
  pluginArgs: any[],
  context: {
    locale: string
    fallback: string
    plugins: PluginFunction[]
    definitions: MessageDefinitions
  }
): string | never {
  const { locale, fallback, plugins, definitions } = context
  const [preference, prefLang] = normalizeLocale(locale)
  const [backLangArea, backLang] = normalizeLocale(fallback)
  const locales = Array.from(new Set([preference, prefLang, backLangArea, backLang]))
  const dataList = locales.map((locale) => ({ locale, data: definitions[locale] }))

  // 筛选本土化的消息内容
  const localizedMessage = filterMessage(key, dataList, preference)
  if (!localizedMessage) {
    // 没有定义message值，抛出错误，提醒开发者修正
    throw new Error(`Unknown localized message with key of "${key}" for [${preference}]`)
  }
  const { locale: messageLocale, message: messageDataValue } = localizedMessage

  // 默认添加placeholder插件，用于处理 { var } 变量替换
  // placeholder插件放置在插件列表最后进行处理
  const appliedPlugins = [...plugins]
  const plugIndex = appliedPlugins.indexOf(placeholder)
  if (plugIndex !== -1) {
    appliedPlugins.splice(plugIndex, 1)
  }
  appliedPlugins.push(placeholder)

  // 取得插件转译函数
  const translate = getPluginTranslate(messageLocale, fallback)

  // 应用插件列表处理消息内容格式化
  const value = appliedPlugins.reduce(
    (message, plugin) => plugin(message, [...pluginArgs], translate),
    toMessageValue(messageDataValue)
  )

  // 插件处理后的内容，最终强制转换为字符串返回
  // 所以插件里，不要返回对象，undefined什么的
  return `${value}`
}

/**
 * 绑定语言定义，并根据提供的上下文获取转译函数。
 * @param data 需要绑定的语言定义数据。
 * @param context 需要绑定的上下文对象。
 */
export function withDefinitions(
  data?: MessageDefinitions,
  context?: {
    locale?: string
    fallback?: string
    plugins?: PluginFunction | PluginFunction[] | null
  }
) {
  const definitions = normalizeDefinitions(data)
  // 返回转译函数
  return function translate(key: string, ...pluginArgs: any[]) {
    const { locale = getLocale(), fallback = getFallbackLocale(), plugins } = Object.assign(
      {},
      context
    )
    // 校验fallback是否有效
    validateLocale(fallback, true)
    let usedPlugins: any[] = Array.isArray(plugins) ? plugins : [plugins]
    usedPlugins = usedPlugins.filter((p) => typeof p === 'function')
    return getLocaleMessage(key, pluginArgs, {
      locale,
      fallback,
      definitions,
      plugins: usedPlugins as PluginFunction[],
    })
  }
}
