/**
 * 首选语言
 */
export const DEFAULT_LOCALE =
  process.env.REACT_APP_DEFAULT_LOCALE || process.env.VUE_APP_DEFAULT_LOCALE || 'zh'

/**
 * 备选语言
 */
export const FALLBACK_LOCALE =
  process.env.REACT_APP_FALLBACK_LOCALE || process.env.VUE_APP_FALLBACK_LOCALE || 'zh'

// 当前设置的区域语言
let currentLocale = getCurrentLocale(DEFAULT_LOCALE)

// 标记是否在更新区域语言设置，避免无限循环设置
let isUpdating = false

// 当前已订阅区域语言变化的处理程序
const consumers: Function[] = []

// 获取系统当前的语言区域设置
function getCurrentLocale(pref: string) {
  if (pref !== 'auto') {
    return pref
  }
  return navigator.language || FALLBACK_LOCALE
}

// 获取当前生效的区域语言
export function getLocale() {
  return currentLocale
}

/**
 * 判断locale值是不是有效的
 * @param locale
 */
export function isValidLocale(locale: any): boolean | never {
  if (!locale || typeof locale !== 'string') {
    // 这里还是要检查值的类型，因为不能保证所有使用者都强制开启了ts校验
    throw new Error(
      `Locale code must be a valid string value. (currType: ${typeof locale} , currValue: ${JSON.stringify(
        locale
      )})`
    )
  }
  return true
}

// 设置当前生效的区域语言
export function setLocale(locale: string) {
  if (isUpdating || locale === currentLocale || !isValidLocale(locale)) {
    // 这里还是要检查值的类型，因为不能保证所有使用者都强制开启了ts校验
    return
  }
  try {
    currentLocale = locale
    isUpdating = true
    for (const handle of consumers) {
      handle(locale)
    }
  } catch (e) {
    throw e
  } finally {
    isUpdating = false
  }
}

// 订阅区域语言变化
export function subscribe(handle: Function) {
  if (typeof handle !== 'function') {
    throw new Error('Handle is not a function')
  }
  consumers.push(handle)
  return function unsubscribe() {
    consumers.splice(consumers.indexOf(handle), 1)
  }
}
