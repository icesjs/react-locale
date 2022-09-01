import { hasOwnProperty, isObject } from './utils'
import { MessageValue, PluginFunction } from './message'

/**
 * 将 { variable } 使用变量数据进行替换。
 * 如果前导括号含转义符号，如 \{ xxx } 则不会进行替换。
 * 如果数据对象自身不包含变量名属性，也不会进行替换。
 */
export const placeholder: PluginFunction = (message: MessageValue, args: any[]): MessageValue => {
  if (!isObject(args[0]) || typeof message !== 'string') {
    return message
  }
  const data = args[0]
  return message.replace(/(.?){\s*(.*?)\s*(\\|)}/g, (sub, g1, g2, g3) => {
    if (g1 === '\\' || g3 === '\\') {
      // 反斜杠转义，不做处理
      return g1 === '\\' ? sub.substring(1) : sub
    }
    if (!g2 || !hasOwnProperty(data, g2)) {
      // 没有可处理的变量名
      return sub
    }
    const str = data[g2]
    return `${g1}${str !== undefined ? str : ''}`
  })
}
