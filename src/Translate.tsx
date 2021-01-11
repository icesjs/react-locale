import React from 'react'
import { useLocaleMessage } from './hooks'
import { normalizeDefinitions, MessageDefinitions, PluginFunction } from './message'

type TranslateProps = {
  /**
   * 消息键名。
   */
  id: string
  /**
   * 备选语言。
   */
  fallback?: string
  /**
   * 插件数组。
   */
  plugins?: PluginFunction | PluginFunction[] | null
  /**
   * 插件参数，或参数数组。如果参数本身是一个数组，则需要使用[[]]形式传参。
   */
  data?: any | any[]
  /**
   * 需要绑定的上下文对象。需要使用React.createContext()创建该值。
   */
  contextType?: React.Context<string>
  /**
   * 消息内容定义对象。
   */
  definitions?: MessageDefinitions
}

/**
 * 供类型组件里使用的Translate组件的属性定义类型。
 */
export type TranslateComponentProps = Omit<TranslateProps, 'contextType' | 'definitions'>
export type TranslateMessageVFC = React.VoidFunctionComponent<TranslateProps>

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
export const TranslateMessage: TranslateMessageVFC = ({
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
  return <>{translate(id, ...args)}</>
}

/**
 * 注入消息定义至转换消息组件。
 * @param data 消息定义数据对象。
 */
export function withDefinitionsComponent(data: MessageDefinitions) {
  const definitions = normalizeDefinitions(data)
  return class Translate extends React.PureComponent<TranslateComponentProps> {
    static contextType?: React.Context<string>
    render() {
      const { children } = this.props
      if (children && !(typeof children === 'string' && !children.trim())) {
        // 存在非空字符串的子组件时，则抛异常，因为子组件不会被渲染
        throw new Error(
          'The <Translate> component must be an empty component, but got some children within it.'
        )
      }
      return (
        <TranslateMessage
          {...this.props}
          contextType={Translate.contextType}
          definitions={definitions}
        />
      )
    }
  }
}
