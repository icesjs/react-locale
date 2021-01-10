const hasOwnProperty = Object.prototype.hasOwnProperty

// 格式化后的locale [lang, area]
type Locale = [string, string]
// 消息定义
export type MessageValue = string | number
export type Message = { [key: string]: MessageValue }
export type MessageDefinitions = {
  [locale: string]: Message
}
// 插件定义
export type PluginFunction = (message: MessageValue, args: any[], locale: Locale) => MessageValue

/**
 * 获取格式化后的语言区域。
 * @param locale
 */
function getLangArea(locale: string): Locale {
  const [langArea] = locale.split('.')
  const [lang, area = ''] = langArea.split(/[-_]/)
  return [lang, area]
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
    if (data && typeof data === 'object' && hasOwnProperty.call(data, key)) {
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

  const [prefLang, prefArea] = getLangArea(locale)
  const [backLang, backArea] = getLangArea(fallback)

  const preference = `${prefLang}${prefArea}`
  const locales = Array.from(new Set([preference, prefLang, `${backLang}${backArea}`, backLang]))
  const dataList = locales.map((locale) => ({ locale, data: definitions[locale] }))

  // 筛选本土化的消息内容
  const localizedMessage = filterMessage(key, dataList, preference)
  if (localizedMessage) {
    const { locale, message } = localizedMessage
    const langArea = getLangArea(locale)
    // 应用插件列表处理消息内容格式化
    const value = plugins.reduce(
      (message, plugin) => plugin(message, [...args], [...langArea]),
      message
    )
    if (typeof value !== 'string') {
      // 插件处理后的内容，只能是字符串或数值类型，如果不是，则强制转换类型为字符串
      // 也意味着，插件不能够输出一个组件
      return `${value}`
    }
    return value
  }

  // 没有定义message值，抛出错误，提醒开发者修正
  throw new Error(`Unknown localized message with key of "${key}" for [${preference}]`)
}
