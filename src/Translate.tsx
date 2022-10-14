import * as React from 'react'
import { HTMLAttributes } from 'react'
import { LocaleContext, LocaleResourceLoader } from './context'
import { useContextLocaleTrans, useLocaleTrans } from './hooks'
import { MessageDefinitions, PluginFunction } from './message'

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
  // 转发的元素引用
  forwardedRef?: React.Ref<any>
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

function RenderTextOrHTML({
  tagName,
  content,
  enableHTML,
  forwardedRef,
  ...props
}: RendererVFCProps) {
  if (enableHTML && isTHMLText(content)) {
    return React.createElement(tagName || 'span', {
      ...props,
      ref: forwardedRef,
      dangerouslySetInnerHTML: {
        __html: content,
      },
    })
  }
  if (tagName) {
    return React.createElement(tagName, { ...props, ref: forwardedRef }, content)
  }
  return content
}

/**
 * 语言内容转译组件。
 */
function LocaleTrans(props: LocaleTransProps) {
  const { id, fallback, plugins, data, definitions, ...rest } = props
  const [translate] = useLocaleTrans(plugins, fallback, definitions)
  return (
    // @ts-ignore
    <RenderTextOrHTML {...rest} content={translate(id, data)} />
  )
}

/**
 * 绑定了上下文的语言内容转译组件。
 */
function ContextLocaleTrans(props: LocaleTransProps & { contextType: React.Context<string> }) {
  const { id, fallback, plugins, data, definitions, contextType, ...rest } = props
  const [translate] = useContextLocaleTrans(contextType, plugins, fallback, definitions)
  return (
    // @ts-ignore
    <RenderTextOrHTML {...rest} content={translate(id, data)} />
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
      const { enableHTML = globalEnableHTML, ...rest } = this.props
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
