import * as React from 'react'
import { useEffect, useState } from 'react'
import { determineLocale, normalizeLocale } from './utils'
import { MessageDefinitions } from './message'

// 备选语言
let fallbackLocale: string = 'zh'

// 当前设置的区域语言
let currentLocale: string = determineLocale({ fallbackLocale })

// 标记是否在更新区域语言设置，避免无限循环设置
let isUpdating = false

const unregisterProp = '__localeChangeUnregister'

let listenerId = 1

interface LocaleChangeHandler {
  (arg: string): void

  [unregisterProp]?: (() => void) | null
}

interface LocaleLoadListener {
  (locale: string, fallbackLocale: string, error?: Error): void

  [unregisterProp]?: (() => void) | null
}

type ListenerMap = { [p: string]: LocaleChangeHandler | LocaleLoadListener }
type LoadStatus = 'prepared' | 'loading' | 'finished' | 'failed'

// 当前已订阅区域语言变化的监听
const localeChangeListeners: { [p: string]: LocaleChangeHandler } = Object.create(null)
// 语言文件加载失败时的监听函数
const loadErrorListeners: { [p: string]: LocaleLoadListener } = Object.create(null)
// 语言文件加载完成时的监听函数
const loadFinishListeners: { [p: string]: LocaleLoadListener } = Object.create(null)
// 语言文件开始加载时的监听函数
const loadStartListeners: { [p: string]: LocaleLoadListener } = Object.create(null)
// 加载状态标记
const localeLoadStatus: { [p: string]: LoadStatus } = Object.create(null)

// 调试信息配置对象
export const debugMessageFilter = {
  // @ts-ignore
  warning: !window.__suspendReactLocaleWarning,
  // @ts-ignore
  error: !window.__suspendReactLocaleError,
  // @ts-ignore
  emptyKeyError: !window.__suspendReactLocaleEmptyKeyError,
}

// 设置调试信息配置对象
export function setDebugMessageFilter(filter: Partial<typeof debugMessageFilter>) {
  Object.assign(debugMessageFilter, filter)
}

/**
 * 获取备选区域语言代码。
 */
export function getFallbackLocale() {
  return fallbackLocale
}

/**
 * 获取当前生效的区域语言代码。
 */
export function getLocale() {
  return currentLocale
}

/**
 * 校验locale值是不是有效的。如果非有效，则抛出异常。
 * @param locale 需要校验的值。
 * @param isFallback 是否是fallback语言
 * @param original 原来的值
 */
export function validateLocale(locale: any, isFallback?: boolean, original = locale) {
  if (!locale || typeof locale !== 'string') {
    // 这里还是要检查值的类型，因为不能保证所有使用者都强制开启了ts校验
    throw new Error(
      `${
        isFallback ? 'Fallback locale' : 'Locale'
      } code must be a valid string value. (currType: ${typeof original} , currValue: ${JSON.stringify(
        original
      )})`
    )
  }
}

/**
 * 设置备选的区域语言代码。
 * @param locale 待设定的区域语言代码。
 */
export function setFallbackLocale(locale: string) {
  if (locale !== fallbackLocale) {
    const [localeCode] = normalizeLocale(locale)
    validateLocale(localeCode, true, locale)
    fallbackLocale = localeCode
  }
}

/**
 * 获取加载状态键值。
 */
function getLocaleLoadKey(locale: string, fallback: string) {
  return `${locale}$$${fallback}`
}

/**
 * 设置当前生效的区域语言。
 * @param locale 待设定的区域语言代码。
 */
export function setLocale(locale: string) {
  if (isUpdating || locale === currentLocale) {
    return
  }
  const [localeCode] = normalizeLocale(locale)
  // 校验值有效性
  validateLocale(localeCode, false, locale)
  //
  isUpdating = true
  currentLocale = localeCode
  // 重置加载状态
  localeLoadStatus[getLocaleLoadKey(currentLocale, fallbackLocale)] = 'prepared'
  //
  for (const handle of Object.values(localeChangeListeners)) {
    try {
      handle(currentLocale)
    } catch (e) {
      console.error(e)
    }
  }
  isUpdating = false
}

function registerListener(
  listeners: ListenerMap,
  handle: LocaleChangeHandler | LocaleLoadListener
) {
  if (typeof handle !== 'function') {
    throw new Error('Handle is not a function')
  }
  let unregister = handle[unregisterProp]
  if (!unregister) {
    let id = listenerId++
    unregister = () => {
      if (id) {
        listeners[id][unregisterProp] = null
        delete listeners[id]
        id = 0
      }
    }
    handle[unregisterProp] = unregister
    listeners[id] = handle
  }
  return unregister
}

/**
 * 订阅全局区域语言变化事件。
 * @param handler 监听处理函数。
 * @return 返回取消订阅的函数。
 */
export function subscribe(handler: LocaleChangeHandler) {
  return registerListener(localeChangeListeners, handler)
}

/**
 * 订阅语言文件加载错误事件。
 * @param listener 监听处理函数。
 * @return 返回取消订阅的函数。
 */
export function addLoadErrorListener(listener: LocaleLoadListener) {
  return registerListener(loadErrorListeners, listener)
}

/**
 * 订阅语言文件开始加载事件。
 * @param listener 监听处理函数。
 * @return 返回取消订阅的函数。
 */
export function addLoadStartListener(listener: LocaleLoadListener) {
  return registerListener(loadStartListeners, listener)
}

/**
 * 订阅语言文件加载完成事件。成功或失败都会调此监听。
 * @param listener 监听处理函数。
 * @return 返回取消订阅的函数。
 */
export function addLoadFinishListener(listener: LocaleLoadListener) {
  return registerListener(loadFinishListeners, listener)
}

/**
 * 发布加载事件。
 */
function emitLoadEvent(
  listeners: ListenerMap,
  status: LoadStatus,
  locale: string,
  fallback: string,
  error?: Error
) {
  const key = getLocaleLoadKey(locale, fallback)
  if (localeLoadStatus[key] === status) {
    return
  }
  localeLoadStatus[key] = status
  for (const handle of Object.values(listeners)) {
    try {
      handle(locale, fallback, error)
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * 发布语言加载错误事件。
 */
function emitLoadError(locale: string, fallback: string, error: Error) {
  if (localeLoadStatus[getLocaleLoadKey(locale, fallback)] === 'finished') {
    emitLoadEvent(loadErrorListeners, 'failed', locale, fallback, error)
  }
}

/**
 * 发布语言加载开始事件。
 */
function emitLoadStart(locale: string, fallback: string) {
  if (localeLoadStatus[getLocaleLoadKey(locale, fallback)] === 'prepared') {
    emitLoadEvent(loadStartListeners, 'loading', locale, fallback)
  }
}

/**
 * 发布语言加载完成事件。
 */
function emitLoadFinish(locale: string, fallback: string) {
  if (localeLoadStatus[getLocaleLoadKey(locale, fallback)] === 'loading') {
    emitLoadEvent(loadFinishListeners, 'finished', locale, fallback)
  }
}

/**
 * 语言资源加载函数。
 */
export type LocaleResourceLoader = (locale: string) => Promise<MessageDefinitions>

// 加载异步数据
export function fetchLocaleData(locale: string, fallback: string, fetch: LocaleResourceLoader) {
  emitLoadStart(locale, fallback)
  return Promise.all([fetch(locale), fetch(fallback)]).then(
    (res) => {
      emitLoadFinish(locale, fallback)
      return Object.assign({}, res[1], res[0])
    },
    (err) => {
      emitLoadFinish(locale, fallback)
      emitLoadError(locale, fallback, err)
      throw err
    }
  )
}

/**
 * 可供选用的LocaleContext。
 */
export const LocaleContext = React.createContext(currentLocale)

/**
 * 默认的全局语言上下文组件。
 * @param value
 * @param props
 * @constructor
 */
export const LocaleProvider: React.FC<React.ProviderProps<string>> = function LocaleProvider({
  value,
  ...props
}) {
  const [state, setState] = useState(value)
  useEffect(() => subscribe(setState), [])
  useEffect(() => setLocale(value), [value])
  return <LocaleContext.Provider {...props} value={state} />
}
