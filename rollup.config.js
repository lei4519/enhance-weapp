// rollup.config.js
// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';@rollup/plugin-commonjs
import terser from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2'
export default {
  input: 'src/main.js',
  output: {
    file: 'enhancemp.min.js',
    format: 'cjs',
    plugins: [terser()]
  },
  plugins: [ typescript(), commonjs(), resolve() ]
};