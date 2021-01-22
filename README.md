# @ices/react-locale

## React locale components.

## Install

```
npm install @ices/react-locale

npm install -D @ices/locale-webpack-plugin
```

## Usage

```js
// webpack.config.js
const LocalePlugin = require('@ices/locale-webpack-plugin')

module.exports = {
  plugins: [new LocalePlugin()],
}
```

```tsx
// foo.tsx
import React, { useCallback } from 'react'
import { useTrans } from './lang.yml'

function ToggleLocaleButton() {
  const initialLocale = 'zh-CN' // or () => 'zh-CN'
  const fallback = 'zh'
  const [trans, locale, setLocale] = useTrans([], initialLocale, fallback)

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en-US' ? 'zh-CN' : 'en-US')
  }, [locale, setLocale])

  return <button onClick={toggleLocale}>{trans('ToggleLocale')}</button>
}
```

```tsx
// boo.tsx
import React from 'react'
import { Trans, setLocale, setFallbackLocale, getLocale } from './lang.yml'

setLocale('zh-CN')
setFallbackLocale('zh')

class ToggleLocaleButton extends React.Component<any, any> {
  //
  toggleLocale() {
    setLocale(getLocale() === 'en-US' ? 'zh-CN' : 'en-US')
  }

  render() {
    return (
      <button onClick={this.toggleLocale}>
        <Trans id="ClickMe" />
      </button>
    )
  }
}
```

```yaml
# lang.yml

#include zh-CN
#include en-US

zh-CN:
  ToggleLocale: 切换语言

en-US:
  ToggleLocale: Change Locale
```

```yaml
# zh-CN.yml

#include "../some/relative/path/foo.yml"

ClickMe: 快点我！
```

```yaml
# en-US.yml

#include <some-module-from-node-modules/boo.yml>

ClickMe: Click Me!
```

## Others

```tsx
// foo.tsx
import React from 'react'

// Import a language module bound to the current module
import { Trans, useTrans, useContextTrans, setLocale, getLocale, utils } from './lang.yml'
import { somePlugin } from './plugins.ts'

function MyButton() {
  const plugins = [somePlugin]
  const fallback = 'zh'
  // Hooks that not bind a locale context will use the global locale state
  // You can use some plugins (optional) to format localized message
  // Default plugin will process variable placeholder for "{ var }"
  // Fallback (optional) is the alternate language in this bound trans
  const [trans] = useTrans(plugins, fallback)
  return <button>{trans('message-key', { foo: true }, 'pluginArgTwo')}</button>
}

const LocaleContext = React.createContext(
  utils.determineLocale({
    urlLocaleKey: 'lang',
    cookieLocaleKey: 'lang',
    storageLocaleKey: 'lang',
    fallbackLocale: 'zh-CN',
  })
)

function ContextButton() {
  const plugins = []
  const fallback = 'zh'
  // You can bind the locale state to some context
  // Hooks that bound to some locale context will independent of others hook
  // plugins and fallback are optional args
  const [trans] = useContextTrans(LocaleContext, plugins, fallback)
  return <button>{trans('message-key')}</button>
}

// Bind the context to the Trans Component
Trans.contextType = LocaleContext

class ContextButtonComponent extends React.Component<any, any> {
  render() {
    return (
      <LocaleContext.Provider value={'zh-CN'}>
        <button>
          <Trans id="message-key" plugins={somePlugin} data={[{ foo: true }, 'pluginArgTwo']} />
        </button>
        {/* The Function component ContextButton will bind the locale to the LocaleContext */}
        <ContextButton />
      </LocaleContext.Provider>
    )
  }
}
```

```ts
// plugins.ts

// You can import a language module for plug-ins
import { definitions } from './plugin-lang.yml'

// some plugin
export function somePlugin(message, [{ foo }, pluginArgTwo], translate) {
  // Plugins can also use the translate function
  return `${message}-processed by ${translate('message-key', definitions)}`
}
```

```ts
// boo.ts

import {
  withDefinitionsHook,
  withDefinitionsContextHook,
  withDefinitionsComponent,
} from '@ices/react-locale'
import localeData from 'other-locale-data-module'

// You can use hook or component with customize locale data
const useTransHook = withDefinitionsHook(localeData)
const useContextTransHook = withDefinitionsContextHook(localeData)
const TranslateComponent = withDefinitionsComponent(localeData)
```

## #include

```yaml
# lang.yml

# You can use "#include" annotation to "import" other locale module to the current module

# -----------------------------------------------------------------------------------------
# Using quotes( ' or " ) or non-quotes will include files relative to the current module
# This will merge "./zh-CN.yml" or "./zh-CN.yaml" module to the current module:
# -----------------------------------------------------------------------------------------

#include zh-CN
#include ./zh-CN.yml
#include "zh-CN"
#include "./zh-CN"
#include "./zh-CN.yml"
#include 'zh-CN'
#include './zh-CN'
#include './zh-CN.yml'

# -----------------------------------------------------------------------------------------
# This will merge "./dir/index.yml" or "./dir/index.yaml" module to the current module:
# -----------------------------------------------------------------------------------------

#include dir
#include "dir"
#include 'dir'
#include "./dir"
#include './dir'

# -----------------------------------------------------------------------------------------
# Using angle bracket( < > ) will include files from node_modules
# This will merge "node_modules/foo/boo.yml" or "node_modules/foo/boo.yaml" module to the current module:
# -----------------------------------------------------------------------------------------

#include <foo/boo>
#include <foo/boo.yml>
#include <foo/boo.yaml>

# -----------------------------------------------------------------------------------------
```

## Notice

```tsx
import { Trans as ZhTrans, useTrans as useZhTrans } from './zh.yml'
import { Trans as EnTrans, useTrans as useEnTrans } from './en.yml'

console.log(ZhTrans !== EnTrans) // true
console.log(useZhTrans !== useEnTrans) // true

const [enTrans] = useEnTrans()
enTrans('message-key-from-zh.yml') // throw not found message error

function Button() {
  return (
    <button>
      {/* throw not found message error */}
      <EnTrans id="message-key-from-zh.yml" />
    </button>
  )
}

// So, the imported language module is independent of the other language modules
```

## Data Merge

```yaml
# ----------------------------
# lang.yml
# ----------------------------

zh:
  foo: 一些东西

en:
  foo: Something

# ----------------------------
# This will be exported like:
# ----------------------------
#  {
#     zh: {
#       foo: '一些东西'
#     },
#     en: {
#       foo: 'Something'
#     }
#  }
```

```yaml
# ----------------------------
# zh.yml
# ----------------------------

foo: 一些东西
boo: 什么东西

# ----------------------------
# en-US.yml
# ----------------------------

foo: Some thing
boo: Things

# ----------------------------
# lang.yml
# ----------------------------

#include zh
#include en-US

zh:
  boo: 另一些东西

en:
  boo: Another thing

# ----------------------------
# This will be exported like:
# ----------------------------
#  {
#     zh: {
#       foo: '一些东西',
#       boo: '另一些东西'
#     },
#     en-US: {
#       foo: 'Some thing',
#       boo: 'Things'
#     },
#     en: {
#       boo: 'Another thing'
#     }
#  }
```

## Build Env

```dotenv
REACT_APP_DEFAULT_LOCALE=zh
REACT_APP_FALLBACK_LOCALE=zh
REACT_APP_SUSPEND_LOCALE_WARNING=false
REACT_APP_LANG_QUERY_KEY=lang
```
