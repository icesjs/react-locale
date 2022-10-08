import * as React from 'react'
import { HTMLAttributes } from 'react'
import { LocaleResourceLoader, useContextLocaleTrans, useLocaleTrans } from './hooks'
import { MessageDefinitions, PluginFunction } from './message'
import { LocaleContext } from './context'

type HTMLTagName = keyof HTMLElementTagNameMap

interface RendererVFCProps<T extends HTMLTagName = HTMLTagName>
  extends Omit<
    HTMLAttributes<HTMLElementTagNameMap[T]>,
    'id' | 'children' | 'dangerouslySetInnerHTML'
  > {
  // 需要渲染的内容
  content: string
  // 是否启用HTML内容支持
  enableHTML?: boolean
  // 输出HTML内容时，包裹内容的标签名称。默认为span。
  tagName?: T
}

interface LocaleTransProps extends Omit<RendererVFCProps, 'content'> {
  // 消息键名
  id: string
  // 插件数组
  plugins?: PluginFunction | PluginFunction[] | null
  // 插件参数。
  data?: any
  // 备选语言
  fallback?: string
  // 消息内容定义对象
  definitions?: MessageDefinitions | LocaleResourceLoader
}

type TransVFC = React.VoidFunctionComponent<LocaleTransProps>

type ContextTransVFC = React.VoidFunctionComponent<
  { contextType: React.Context<string> } & LocaleTransProps
>

/**
 * 语言内容转译组件属性定义类型。
 */
export type TranslateProps = React.PropsWithoutRef<Omit<LocaleTransProps, 'definitions'>>

/**
 * 语言内容转译组件定义类型。
 */
export type TranslateType = ReturnType<typeof withDefinitionsComponent>

/**
 * 判断文本是否包含标签。
 * @param text
 */
function isTHMLText(text: string) {
  return !/^<key>.*<\/key>$/.test(text) && /<.*?\/?>/.test(text)
}

function RenderTextOrHTML({ tagName, content, enableHTML, ...props }: RendererVFCProps) {
  if (enableHTML && isTHMLText(content)) {
    return React.createElement(tagName || 'span', {
      ...props,
      dangerouslySetInnerHTML: {
        __html: content,
      },
    })
  }
  if (tagName) {
    return React.createElement(tagName, props, content)
  }
  return content
}

/**
 * 语言内容转译组件。
 */
const LocaleTrans: TransVFC = ({
  id,
  fallback,
  plugins,
  data,
  definitions,
  enableHTML,
  tagName,
}) => {
  const [translate] = useLocaleTrans(plugins, fallback, definitions)
  return (
    // @ts-ignore
    <RenderTextOrHTML content={translate(id, data)} enableHTML={enableHTML} tagName={tagName} />
  )
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
  enableHTML,
  tagName,
}) => {
  const [translate] = useContextLocaleTrans(contextType, plugins, fallback, definitions)
  return (
    // @ts-ignore
    <RenderTextOrHTML content={translate(id, data)} enableHTML={enableHTML} tagName={tagName} />
  )
}

/**
 * 注入消息定义至转译消息组件。
 * @param definitions 消息定义数据对象。
 */
export function withDefinitionsComponent(definitions?: MessageDefinitions | LocaleResourceLoader) {
  return class TranslateComponent extends React.PureComponent<TranslateProps> {
    // 默认使用内部的全局 LocaleContext
    static contextType = LocaleContext
    // 全局设置默认的是否允许输出HTML内容
    static enableDangerouslySetInnerHTML = false

    render() {
      // 如果使用了上下文绑定，则使用绑定上下文的转译组件
      const { contextType, enableDangerouslySetInnerHTML: globalEnableHTML } = TranslateComponent
      // 因为不能保证所有使用者都开启了ts校验，这里仍然检查下是否包含子组件
      const { children, enableHTML = globalEnableHTML, ...rest } = this.props as any
      if (children && !(typeof children === 'string' && !children.trim())) {
        // 存在非空字符串的子组件时，则抛异常，因为子组件不会被渲染
        throw new Error(
          'The <Translate> component must be an empty component, but got some children within it.'
        )
      }
      return contextType ? (
        <ContextLocaleTrans
          {...rest}
          enableHTML={enableHTML}
          contextType={contextType}
          definitions={definitions}
        />
      ) : (
        <LocaleTrans {...rest} enableHTML={enableHTML} definitions={definitions} />
      )
    }
  }
}
