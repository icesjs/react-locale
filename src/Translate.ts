import React from 'react'
import { useLocaleMessage } from './hooks'
import { MessageDefinitions, PluginFunction } from './message'

export interface TranslateProps {
  id: string
  fallback?: string
  plugins?: PluginFunction | PluginFunction[] | null
  data?: any | any[]
  contextType?: React.Context<string>
  definitions?: MessageDefinitions
}

interface TranslateMessageFC extends React.FunctionComponent<TranslateProps> {}

/**
 * 用于获取本地消息内容的函数组件
 * @param id
 * @param fallback
 * @param plugins
 * @param data
 * @param contextType
 * @param definitions
 * @constructor
 */
export const TranslateMessage: TranslateMessageFC = ({
  id,
  fallback,
  plugins,
  data,
  contextType,
  definitions,
}) => {
  let args
  if (Array.isArray(data)) {
    args = data
  } else if (typeof data !== 'undefined') {
    args = [data]
  } else {
    args = []
  }
  const [translate] = useLocaleMessage(plugins, contextType, fallback, definitions)
  return React.createElement(React.Fragment, null, translate(id, ...args))
}

/**
 * 注入消息定义至转换消息组件。
 * @param definitions 消息定义数据对象。
 */
export function withDefinitionsComponent(definitions: MessageDefinitions) {
  return class Translate extends React.PureComponent<
    Omit<TranslateProps, 'contextType' | 'definitions'>
  > {
    contextType?: React.Context<string>
    render() {
      return React.createElement(
        TranslateMessage,
        Object.assign({}, this.props, { contextType: Translate.contextType, definitions })
      )
    }
  }
}
