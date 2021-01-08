import { withDefinitionsHook } from './hooks'
import { withDefinitionsComponent } from './Translate'
export { LocaleContext, setLocale, getLocale } from './context'
export { withDefinitionsHook, withDefinitionsComponent }
export const useLocale = withDefinitionsHook({})
export const Translate = withDefinitionsComponent({})
export const Trans = Translate
