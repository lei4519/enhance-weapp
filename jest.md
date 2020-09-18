# 为项目加入jest

## 安装
```
cnpm i --save-dev jest
```
创建配置文件，通过问答形式进行创建
```
npx jest --init
```
支持ts
ts依赖babel
安装依赖
```
cnpm i babel-jest @babel/core @babel/preset-env @babel/preset-typescript jest typescript ts-jest @types/jest --save-dev
```
修改`jest.config.js`配置文件
```
{
  preset: 'ts-jest'
}
```
运行
```
npx jest
```