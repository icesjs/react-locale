import cp from 'child_process'
import path from 'path'
import fs from 'fs'
import typescript from '@rollup/plugin-typescript'
import externals from 'rollup-plugin-node-externals'
import pkg from './package.json'

const isEnvDevelopment = process.env.NODE_ENV === 'development'
const input = 'src/index.ts'
const sourcemap = !isEnvDevelopment || 'inline'

function ensureDir(filePath) {
  const unExistsDirs = []
  let file = filePath
  while (!fs.existsSync((file = path.dirname(file)))) {
    unExistsDirs.unshift(file)
  }
  for (const dir of unExistsDirs) {
    fs.mkdirSync(dir)
  }
}

function makeTypesFile() {
  cp.execSync('yarn types', { stdio: 'ignore' })
  const paths = ['types/loader.d.ts']
  for (const p of paths) {
    const file = path.resolve(p)
    if (fs.existsSync(file)) {
      const target = path.resolve(p.replace(/^types\//, 'lib/'))
      ensureDir(target)
      fs.renameSync(file, target)
    }
  }
}

function getPlugins(format, target, makeTypes = false) {
  return [
    externals({
      builtins: true,
      deps: true,
      peerDeps: true,
    }),
    typescript({
      removeComments: true,
      noUnusedLocals: !isEnvDevelopment,
      target,
    }),
    makeTypes && {
      name: 'make-types',
      generateBundle: makeTypesFile,
    },
  ].filter(Boolean)
}

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap,
    },
    plugins: getPlugins('es', 'esnext'),
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap,
    },
    plugins: getPlugins('cjs', 'es5'),
  },
  {
    input: 'src/loader.ts',
    output: {
      file: 'lib/loader.js',
      format: 'cjs',
      sourcemap,
    },
    plugins: getPlugins('cjs', 'es6', true),
  },
]
