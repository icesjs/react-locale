import useLocale, { MessageValue } from './hooks'
import { MessageDefinitions, PluginFunction } from './message'

interface TranslateProps<PluginArgs> {
  id: string
  fallback?: string
  plugins?:
    | PluginFunction<MessageValue, PluginArgs>
    | PluginFunction<MessageValue, PluginArgs>[]
    | null
  data?: PluginArgs | PluginArgs[]
  definitions?: MessageDefinitions<MessageValue>
}

/**
 * 用于获取本地消息内容的函数组件
 * @param id
 * @param fallback
 * @param plugins
 * @param data
 * @param definitions
 * @constructor
 */
function Translate<PluginArgs>({
  id,
  fallback,
  plugins,
  data,
  definitions,
}: TranslateProps<PluginArgs>) {
  const [translate] = useLocale(plugins, fallback, definitions)
  let args: PluginArgs[]
  if (Array.isArray(data)) {
    args = data
  } else if (typeof data !== 'undefined') {
    args = [data]
  } else {
    args = []
  }
  return translate(id, ...args)
}

export default Translate
