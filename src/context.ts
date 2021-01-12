import { determineLocale } from './utils'

/**
 * 首选语言
 */
export const DEFAULT_LOCALE = process.env.REACT_APP_DEFAULT_LOCALE || 'zh'

/**
 * 备选语言
 */
export const FALLBACK_LOCALE = process.env.REACT_APP_FALLBACK_LOCALE || 'zh'

// 当前设置的区域语言
let currentLocale =
  DEFAULT_LOCALE !== 'auto' ? DEFAULT_LOCALE : determineLocale({ fallbackLocale: FALLBACK_LOCALE })

// 标记是否在更新区域语言设置，避免无限循环设置
let isUpdating = false

// 当前已订阅区域语言变化的监听
const listeners: { handle: (locale: string) => void; unregister: () => void }[] = []

/**
 * 获取当前生效的区域语言代码。
 */
export function getLocale() {
  return currentLocale
}

/**
 * 校验locale值是不是有效的。如果非有效，则抛出异常。
 * @param locale 需要校验的值。
 */
export function validateLocale(locale: any): boolean | never {
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

/**
 * 设置当前生效的区域语言。
 * @param locale 待设定的区域语言代码。
 */
export function setLocale(locale: string) {
  if (isUpdating || locale === currentLocale || !validateLocale(locale)) {
    return
  }
  try {
    currentLocale = locale
    isUpdating = true
    for (const { handle } of listeners) {
      handle(locale)
    }
  } catch (e) {
    throw e
  } finally {
    isUpdating = false
  }
}

/**
 * 订阅全局区域语言变化事件。
 * @param handle 监听处理函数。
 * @return 返回取消订阅的函数。
 */
export function subscribe(handle: (locale: string) => void) {
  if (typeof handle !== 'function') {
    throw new Error('Handle is not a function')
  }
  let registered = listeners.find((item) => item.handle === handle)
  if (!registered) {
    registered = {
      handle,
      unregister() {
        listeners.splice(
          listeners.findIndex((item) => item.handle === handle),
          1
        )
      },
    }
    listeners.push(registered)
  }
  return registered.unregister
}
