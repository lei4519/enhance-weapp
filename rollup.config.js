// rollup.config.js
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
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
  plugins: [typescript(), commonjs(), resolve()]
}
