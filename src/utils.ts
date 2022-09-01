/**
 * 转义正则元字符。
 * @param str 待转义的字符序列。
 */
export function escapeRegExpCharacters(str: string): string {
  return str.replace(/[|/\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

/**
 * 从URL里匹配语言设置。
 * @param queryName 查询参数名称。
 */
export function getLocaleFromURL(queryName: string = 'lang') {
  const escapedName = escapeRegExpCharacters(queryName)
  const query = new RegExp(`\\b${escapedName}=([^&#]+)`).exec(location.search)
  return query ? decodeURIComponent(query[1]) : ''
}

/**
 * 从cookie中获取语言设置。
 * @param key cookie键名。
 */
export function getLocaleFromCookie(key: string = 'lang') {
  const escapedKey = escapeRegExpCharacters(key)
  const regx = new RegExp(`^${escapedKey}=(.+)`)
  let cookie: string[] | null
  for (const item of document.cookie.split(/;\s*/)) {
    if ((cookie = regx.exec(item))) {
      return decodeURIComponent(cookie[1])
    }
  }
  return ''
}

/**
 * 从本地存储中获取语言设置。
 * @param key 本地存储键名。
 */
export function getLocaleFromLocalStorage(key: string = 'lang') {
  if (window.localStorage) {
    return localStorage.getItem(key)
  }
  return ''
}

/**
 * 从浏览器设置中获取语言设置。
 */
export function getLocaleFromBrowser() {
  // @ts-ignore
  return navigator.language || navigator.userLanguage || ''
}

/**
 * 根据指定的语言设置参数名，获取系统当前的语言区域设置。
 * @param options 配置对象。
 */
export function determineLocale(options?: {
  urlLocaleKey?: string
  cookieLocaleKey?: string
  storageLocaleKey?: string
  fallbackLocale?: string
}): string {
  const defaultKey = 'lang'
  const {
    urlLocaleKey = defaultKey,
    cookieLocaleKey = defaultKey,
    storageLocaleKey = defaultKey,
    fallbackLocale,
  } = Object.assign({}, options)
  for (const getLocale of [
    () => getLocaleFromURL(urlLocaleKey),
    () => getLocaleFromCookie(cookieLocaleKey),
    () => getLocaleFromLocalStorage(storageLocaleKey),
    () => getLocaleFromBrowser(),
  ]) {
    const [locale] = normalizeLocale(getLocale())
    if (locale) {
      return locale
    }
  }
  if (fallbackLocale) {
    const [fallback] = normalizeLocale(fallbackLocale)
    if (fallback) {
      return fallback
    }
  }
  return ''
}

/**
 * 获取格式化后的语言区域。
 * @param locale 需要格式化的区域语言代码字符串。
 * @return [lang-AREA, lang, AREA]
 */
export function normalizeLocale(locale: string): [string, string, string] {
  if (typeof (locale as any) !== 'string') {
    locale = ''
  }
  const [langArea] = locale.split('.')
  const [lang, area = ''] = langArea.split(/[-_]/)
  const lowerLang = lang.toLowerCase()
  const upperArea = area.toUpperCase()
  return [`${lowerLang}${area ? '-' + upperArea : ''}`, lowerLang, upperArea]
}

/**
 * 简单判断给定的对象是不是一个普通的对象。
 * @param obj 待判定的对象。
 */
export function isObject(obj: any) {
  return obj !== null && typeof obj === 'object'
}

/**
 * 判断对象是否包含自身属性。
 * @param obj 待判定的对象。
 * @param prop 属性名。
 */
function hasOwnProp(obj: object, prop: string) {
  // @ts-ignore
  return Object.hasOwn ? Object.hasOwn(obj, prop) : Object.prototype.hasOwnProperty.call(obj, prop)
}

/**
 * 判断给定的对象是不是自身包含一个属性。
 * @param obj 待判定的对象。
 * @param prop 需要检查的属性名。
 */
export function hasOwnProperty(obj: any, prop: string) {
  return !(obj === null || obj === undefined) && hasOwnProp(obj, prop)
}

/**
 * 获取插件参数。
 * 参数如果是一个数组，则会展开，如果不是数组，则会用作为数组元素返回一个新数组。
 * 如果参数本身是一个数组，则需要使用 [[]] 来传参。
 * @param args
 */
export function formatPluginArgs(args: any) {
  let pluginArgs
  if (Array.isArray(args)) {
    pluginArgs = args
  } else if (typeof args !== 'undefined') {
    pluginArgs = [args]
  } else {
    pluginArgs = []
  }
  return pluginArgs
}
