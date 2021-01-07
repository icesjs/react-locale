/**
 * 根据区域数据过滤消息内容。
 * @param dataList 区域消息数据集。
 * @param key 消息键名。
 * @param preference 首选区域语言。
 */
function filterMessage<T extends { [key: string]: any }>(
  dataList: { locale: string; data: T }[],
  key: string,
  preference: string
) {
  const hasOwnProperty = Object.prototype.hasOwnProperty
  for (const { locale, data } of dataList) {
    // 数据集要是一个对象，才进行取值
    if (data && typeof data === 'object' && hasOwnProperty.call(data, key)) {
      const message = data[key]
      const type = typeof message
      if (type !== 'undefined' && type !== 'object') {
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

type Locale = [string, string]

export type MessageDefinitions<T> = {
  [key: string]: T
}

export interface PluginFunction<T, V> {
  (message: T, args: V[], locale: Locale): T
}

/**
 * 获取格式化后的语言区域。
 * @param locale
 */
function getLangArea(locale: string) {
  const [langArea] = locale.split('.')
  const [lang, area = ''] = langArea.split(/[-_]/)
  return [lang, area] as Locale
}

/**
 * 获取区域化的内容。
 * @param options
 * @param key
 * @param args
 */
export function getLocaleMessage<T, V>(
  options: {
    locale: string
    fallback: string
    plugins: PluginFunction<T, V>[]
    definitions: MessageDefinitions<T>
  },
  key: string,
  args: V[]
) {
  const { locale, fallback, plugins, definitions } = options
  // 尝试取值的locales
  const [prefLang, prefArea] = getLangArea(locale)
  const [backLang, backArea] = getLangArea(fallback)
  const preference = `${prefLang}${prefArea}`
  const locales = new Set([preference, prefLang, `${backLang}${backArea}`, backLang])
  const dataList = [...locales].map((locale) => ({ locale, data: definitions[locale] }))

  // 筛选本土化的消息内容
  const localizedMessage = filterMessage(dataList, key, preference)
  if (localizedMessage) {
    const { locale, message } = localizedMessage
    const langArea = getLangArea(locale)
    // 应用插件列表处理消息内容格式化
    return plugins.reduce((message, plugin) => plugin(message, [...args], [...langArea]), message)
  }

  // 没有定义message值，抛出错误，提醒开发者修正
  throw new Error(`Unknown localized message with key of "${key}" for [${preference}]`)
}

export default getLocaleMessage
