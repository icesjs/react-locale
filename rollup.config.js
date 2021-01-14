import typescript from '@rollup/plugin-typescript'
import externals from 'rollup-plugin-node-externals'
import * as cp from 'child_process'
import pkg from './package.json'

const isEnvDevelopment = process.env.NODE_ENV === 'development'

function getPlugins(format) {
  return [
    externals({
      builtins: true,
      deps: true,
      peerDeps: true,
    }),
    typescript({
      removeComments: !isEnvDevelopment,
      noUnusedLocals: !isEnvDevelopment,
      target: format === 'es' ? 'esnext' : 'es5',
    }),
    isEnvDevelopment &&
      format === 'es' && {
        generateBundle: () => cp.execSync('yarn types', { stdio: 'ignore' }),
      },
  ].filter(Boolean)
}

const input = 'src/index.ts'
const sourcemap = !isEnvDevelopment || 'inline'

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap,
    },
    plugins: getPlugins('es'),
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap,
    },
    plugins: getPlugins('cjs'),
  },
  {
    input: 'src/loader.ts',
    output: {
      file: 'lib/loader.js',
      format: 'cjs',
      sourcemap,
    },
    plugins: getPlugins('cjs'),
  },
]
