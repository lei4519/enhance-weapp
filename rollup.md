# rollup配置

安装
```
cnpm i rollup --save-dev
```
解析npm包
```
cnpm i @rollup/plugin-node-resolve --save-dev
```
将npm包打包成commonjs规范
```
cnpm i @rollup/plugin-commonjs --save-dev
```
压缩代码
```
cnpm i rollup-plugin-terser --save-dev
```
支持ts
```
cnpm i rollup-plugin-typescript2 --save-dev
```

加入 prettier 格式化代码
```
cnpm i prettier --save-dev
```
提交前格式化
```
{
  "**/*": "prettier --write --ignore-unknown"
}
```

eslint
```
cnpm i eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier --save-dev
```
```js
module.exports = {
  root: true,
  env: {
    node: true
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
```