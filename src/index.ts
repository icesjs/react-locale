import { LocaleContext, getCurrentLocale, setCurrentLocale } from './context'
import useLocale from './hooks'
import Translate from './Translate'

// @ts-ignore
declare module '*.yml' {
  export {
    useLocale,
    setCurrentLocale as setLocale,
    getCurrentLocale as getLocale,
    Translate,
    Translate as Trans,
    LocaleContext,
  }
  export default useLocale
}

// @ts-ignore
declare module '*.yaml' {
  export {
    useLocale,
    setCurrentLocale as setLocale,
    getCurrentLocale as getLocale,
    Translate,
    Translate as Trans,
    LocaleContext,
  }
  export default useLocale
}

export {
  getCurrentLocale as getLocale,
  setCurrentLocale as setLocale,
  useLocale,
  Translate,
  LocaleContext,
}
