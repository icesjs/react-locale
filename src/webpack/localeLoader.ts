import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import loaderUtils from 'loader-utils'
import * as webpack from 'webpack'
import LoaderContext = webpack.loader.LoaderContext

const cwd = process.cwd()
function getModuleMain(dir: string): string {
  if (dir === cwd) {
    return ''
  }
  const pkgPath = path.join(dir, 'package.json')
  if (fs.existsSync(pkgPath)) {
    return path.join(dir, require(pkgPath).module)
  }
  return getModuleMain(path.dirname(dir))
}

const moduleMain: string = getModuleMain(__dirname) || path.join(__dirname, 'index.esm.js')

export default function localeLoader(this: LoaderContext, source: string) {
  // 解析语言配置
  let definitions = yaml.load(source, {
    json: true,
    onWarning: (err) => {
      const warning = new Error(err.message)
      warning.name = 'Warning'
      warning.stack = ''
      this.emitWarning(warning)
    },
  })
  if (!definitions || typeof definitions !== 'object') {
    definitions = {}
  }

  // 导出模块定义
  return `
    import React from 'react'
    import {
      useLocale,
      getLocale,
      setLocale,
      Translate,
      LocaleContext
    } from ${loaderUtils.stringifyRequest(this, moduleMain)}
    const definitions = ${JSON.stringify(definitions)}
    const useLocaleMessage = (plugins, fallback) => useLocale(plugins, fallback, definitions)
    const TranslateMessage = function(props) {     
      return React.createElement(
        Translate,
        Object.assign({},props, {definitions})
      )
    }
    export {
      useLocaleMessage as useLocale,
      setLocale,
      getLocale,
      TranslateMessage as Translate,
      TranslateMessage as Trans,
      LocaleContext
    }
    export default useLocaleMessage
  `
}
