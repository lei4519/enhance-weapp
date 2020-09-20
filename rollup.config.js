// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
const env = process.env.NODE_ENV

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/enhancemp.js',
      format: 'cjs'
    },
    {
      file: 'dist/enhancemp.min.js',
      format: 'cjs',
      plugins: [terser()]
    }
  ],
  plugins: [
    commonjs(),
    typescript(),
    nodeResolve(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
    // commonjs(),
  ]
}
