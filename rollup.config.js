import typescript from '@rollup/plugin-typescript'
import externals from 'rollup-plugin-node-externals'
import pkg from './package.json'

function getPlugins() {
  return [
    typescript(),
    externals({
      builtins: true,
      deps: true,
      peerDeps: true,
    }),
  ]
}

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.module, format: 'es', sourcemap: true },
      { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    ],
    plugins: getPlugins(),
  },
  {
    input: 'src/webpack/localeLoader.ts',
    output: { file: 'lib/locale-loader.js', format: 'cjs', sourcemap: true, exports: 'auto' },
    plugins: getPlugins(),
  },
]
