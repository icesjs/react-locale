import { normalizeLocale } from './utils'
import { placeholder } from './plugins'

const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * 语言消息内容的值类型。
 */
export type MessageValue = string | number
/**
 * 语言消息内容类型。
 */
export type Message = { [key: string]: MessageValue }
/**
 * 语言模块消息内容定义类型。
 */
export type MessageDefinitions = {
  [locale: string]: Message
}

/**
 * 插件使用的转换函数，可供插件获取语言模块消息内容。
 */
export type PluginTranslateFunction = (
  key: string,
  definitions?: MessageDefinitions
) => MessageValue

/**
 * 插件函数，用来实现语言内容的格式转换。
 */
export type PluginFunction = (
  message: MessageValue,
  args: any[],
  translate: PluginTranslateFunction
) => MessageValue

/**
 * 格式化定义语言消息定义。
 * @param definitions
 */
export function normalizeDefinitions(definitions: any): MessageDefinitions {
  const formattedDefs: MessageDefinitions = {}
  for (const [key, val] of Object.entries(Object.assign({}, definitions))) {
    formattedDefs[normalizeLocale(key)[0]] = val as Message
  }
  return formattedDefs
}

/**
 * 根据区域数据过滤消息内容。
 * @param key 消息键名。
 * @param dataList 区域消息数据集。
 * @param preference 首选区域语言。
 */
function filterMessage(
  key: string,
  dataList: { locale: string; data: Message }[],
  preference: string
) {
  for (const { locale, data } of dataList) {
    // 数据集要是一个对象，才进行取值
    if (data && hasOwnProperty.call(data, key)) {
      const message = data[key]
      const type = typeof message
      if (type !== 'undefined' && /string|number|boolean/.test(type)) {
        if (locale !== preference) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `Missing message with key of "${key}" for locale [${preference}], using default message of locale [${locale}] as fallback.`
            )
          }
        }
        return { locale, message }
      }
    }
  }
  return null
}

/**
 * 获取区域化的内容。
 * @param key
 * @param args
 * @param options
 */
export function getLocaleMessage(
  key: string,
  args: any[],
  options: {
    locale: string
    fallback: string
    plugins: PluginFunction[]
    definitions: MessageDefinitions
  }
): string | never {
  const { locale, fallback, plugins, definitions } = options
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
  const { locale: messageLocale, message } = localizedMessage

  // 插件内部可用于转换插件自身消息内容的函数
  const translate = (key: string, defs?: MessageDefinitions) =>
    // 这里locale是经过主消息匹配后的语言，可能是备选语言
    // 插件可以传入自己的消息定义内容defs，如果没有传参，则使用调用方的消息定义
    getLocaleMessage(key, [], {
      locale: messageLocale,
      fallback,
      plugins: [],
      definitions: defs ? normalizeDefinitions(defs) : definitions,
    })

  // 默认添加placeholder插件，用于处理 { var } 变量替换
  // placeholder插件放置在插件列表最后进行处理
  const appliedPlugins = [...plugins]
  const index = appliedPlugins.indexOf(placeholder)
  if (index !== -1) {
    appliedPlugins.splice(index, 1)
  }
  appliedPlugins.push(placeholder)

  // 应用插件列表处理消息内容格式化
  const value = appliedPlugins.reduce(
    (message, plugin) => plugin(message, [...args], translate),
    message
  )

  // 插件处理后的内容，最终强制转换为字符串返回
  // 所以插件里，不要返回对象，undefined什么的
  return `${value}`
}
