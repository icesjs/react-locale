import typescript from '@rollup/plugin-typescript'
import externals from 'rollup-plugin-node-externals'
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
  ]
}

const input = 'src/index.ts'

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: !isEnvDevelopment || 'inline',
    },
    plugins: getPlugins('es'),
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: !isEnvDevelopment || 'inline',
    },
    plugins: getPlugins('cjs'),
  },
]
