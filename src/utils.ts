/**
 * 转义正则元字符。
 * @param str 待转义的字符序列。
 */
export function escapeRegExpCharacters(str: string): string {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
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
 * @param langKey 查找键名。
 * @param fallback 备选语言。
 */
export function determineLocale(langKey?: string, fallback?: string): string {
  return (
    getLocaleFromURL(langKey) ||
    getLocaleFromCookie(langKey) ||
    getLocaleFromLocalStorage(langKey) ||
    getLocaleFromBrowser() ||
    fallback
  )
}

/**
 * 获取格式化后的语言区域。
 * @param locale 需要格式化的区域语言代码字符串。
 * @return [lang-AREA, lang, AREA]
 */
export function normalizeLocale(locale: string): [string, string, string] {
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
 * 判断给定的对象是不是自身包含一个属性。
 * @param obj 待判定的对象。
 * @param prop 需要检查的属性名。
 */
export function hasOwnProperty(obj: any, prop: string) {
  return !(obj === null || obj === undefined) && Object.prototype.hasOwnProperty.call(obj, prop)
}
