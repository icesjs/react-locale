import React from 'react'
import { useLocaleMessage } from './hooks'
import { MessageDefinitions, PluginFunction } from './message'

export interface TranslateProps {
  id: string
  fallback?: string
  plugins?: PluginFunction | PluginFunction[] | null
  data?: any | any[]
  definitions?: MessageDefinitions
}

interface TranslateMessageFC extends React.FunctionComponent<TranslateProps> {}

/**
 * 用于获取本地消息内容的函数组件
 * @param id
 * @param fallback
 * @param plugins
 * @param data
 * @param definitions
 * @constructor
 */
export const TranslateMessage: TranslateMessageFC = ({
  id,
  fallback,
  plugins,
  data,
  definitions,
}) => {
  const [translate] = useLocaleMessage(plugins, fallback, definitions)
  let args
  if (Array.isArray(data)) {
    args = data
  } else if (typeof data !== 'undefined') {
    args = [data]
  } else {
    args = []
  }
  return /*#__PURE__*/ React.createElement(React.Fragment, null, translate(id, ...args))
}

/**
 * 注入消息定义至转换消息组件。
 * @param definitions 消息定义数据对象。
 */
export function withDefinitionsComponent(definitions: MessageDefinitions) {
  return function Translate(props: Omit<TranslateProps, 'definitions'>) {
    return /*#__PURE__*/ React.createElement(
      TranslateMessage,
      Object.assign({}, props, { definitions })
    )
  }
}
