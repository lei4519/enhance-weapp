import { isRef, toRaw, unref } from '@vue/reactivity'
import { LooseObject } from '../types'

export function noop() {}

/**
 * @description 定义属性，不可修改，不可遍历，不可删除
 */
export function defineReadonlyProp(
  obj: any,
  key: string | symbol | number,
  value?: any
) {
  const descriptor = {
    value,
    writable: false,
    configurable: false,
    enumerable: process.env.NODE_ENV === 'production'
  }
  return Object.defineProperty(obj, key, descriptor)
}

/**
 * @description 定义不可遍历属性
 */
export function disabledEnumerable(obj: any, key: string, value?: any) {
  const descriptor = {
    value,
    writable: true,
    configurable: true,
    enumerable: process.env.NODE_ENV === 'production'
  }
  return Object.defineProperty(obj, key, descriptor)
}

export const transformOnName = (name: string) =>
  `on${name.replace(/\w/, s => s.toUpperCase())}`

const isType = (type: string) => (val: any) =>
  Object.prototype.toString.call(val) === `[object ${type}]`

export const isArray = isType('Array')

export const isObject = isType('Object')

export const isFunction = isType('Function')

export const isSymbol = isType('Symbol')

// 是否是基本类型的值
export const isPrimitive = (val: any) => typeof val !== 'object' || val === null

export const isLooseObject = (obj: any) => obj && typeof obj === 'object'

/**
 * @description 返回promise，超时后resolve promise
 * @param resolveData promise.resolve 的数据
 * @param timeout 超时时间
 */
export function setTimeoutResolve(resolveData: any, timeout = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(resolveData)
    }, timeout)
  })
}

export function getType(val: any): string {
  return Object.prototype.toString.call(val).match(/\s(\w+)/)![1]
}

export function getRawData(data: LooseObject): LooseObject {
  return isPrimitive(data)
    ? data
    : isRef<LooseObject>(data)
    ? unref(data)
    : toRaw(data)
}

export function cloneDeepRawData(data: LooseObject): LooseObject {
  let res
  return isPrimitive(data)
    ? data
    : (res = JSON.stringify(data, (key, val) => {
        return getRawData(val)
      }))
    ? JSON.parse(res)
    : void 0
}

export function cloneDeep(data: LooseObject): LooseObject {
  return JSON.parse(JSON.stringify(data))
}
