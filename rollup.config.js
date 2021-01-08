import typescript from '@rollup/plugin-typescript'
import externals from 'rollup-plugin-node-externals'
import pkg from './package.json'

function getCommonsPlugin() {
  return [
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
    output: [{ file: pkg.module, format: 'es', sourcemap: true, exports: 'auto' }],
    plugins: [
      typescript({
        removeComments: true,
      }),
      ...getCommonsPlugin(),
    ],
  },
  {
    input: 'src/index.ts',
    output: { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    plugins: [
      typescript({
        removeComments: true,
        target: 'es5',
      }),
      ...getCommonsPlugin(),
    ],
  },
]
