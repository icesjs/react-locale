import React from 'react'
import { useContextLocaleTrans, useLocaleTrans } from './hooks'
import { formatPluginArgs } from './utils'
import { MessageDefinitions, PluginFunction } from './message'

type LocaleTransProps = {
  // 消息键名
  id: string
  // 插件数组
  plugins?: PluginFunction | PluginFunction[] | null
  // 插件参数，或参数数组。如果参数本身是一个数组，则需要使用[[]]形式传参
  data?: any | any[]
  // 备选语言
  fallback?: string
  // 消息内容定义对象
  definitions?: MessageDefinitions
}

type TransVFC = React.VoidFunctionComponent<LocaleTransProps>
type ContextTransVFC = React.VoidFunctionComponent<
  { contextType: React.Context<string> } & LocaleTransProps
>

/**
 * 语言内容转译组件属性定义类型。
 */
type TranslateProps = React.PropsWithoutRef<Omit<LocaleTransProps, 'definitions'>>

/**
 * 语言内容转译组件定义类型。
 */
export type TranslateType = ReturnType<typeof withDefinitionsComponent>

/**
 * 语言内容转译组件。
 */
const LocaleTrans: TransVFC = ({ id, fallback, plugins, data, definitions }) => {
  const pluginArgs = formatPluginArgs(data)
  const [translate] = useLocaleTrans(plugins, fallback, definitions)
  return <>{translate(id, ...pluginArgs)}</>
}

/**
 * 绑定了上下文的语言内容转译组件。
 */
const ContextLocaleTrans: ContextTransVFC = ({
  id,
  fallback,
  plugins,
  data,
  contextType,
  definitions,
}) => {
  const [translate] = useContextLocaleTrans(contextType, plugins, fallback, definitions)
  return <>{translate(id, ...formatPluginArgs(data))}</>
}

/**
 * 注入消息定义至转译消息组件。
 * @param definitions 消息定义数据对象。
 */
export function withDefinitionsComponent(definitions?: MessageDefinitions) {
  return class Translate extends React.PureComponent<TranslateProps> {
    static contextType?: React.Context<string>
    constructor(readonly props: TranslateProps) {
      super(props)
    }

    render() {
      // 因为不能保证所有使用者都开启了ts校验，这里仍然检查下是否包含子组件
      const { children } = this.props as any
      if (children && !(typeof children === 'string' && !children.trim())) {
        // 存在非空字符串的子组件时，则抛异常，因为子组件不会被渲染
        throw new Error(
          'The <Translate> component must be an empty component, but got some children within it.'
        )
      }
      // 如果使用了上下文绑定，则使用绑定上下文的转译组件
      const contextType = Translate.contextType
      return contextType ? (
        <ContextLocaleTrans {...this.props} contextType={contextType} definitions={definitions} />
      ) : (
        <LocaleTrans {...this.props} definitions={definitions} />
      )
    }
  }
}
