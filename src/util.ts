export function noop() {}

export function definePrivateProp(obj: any, key: string, value?: any) {
  Object.defineProperty(obj, key, {
    value,
    writable: true,
    configurable: false,
    enumerable: false
  })
}

export const transformOnName = (name: string) =>
  `on${name.replace(/\w/, s => s.toUpperCase())}`

const isType = (type: string) => (val: any) =>
  Object.prototype.toString.call(val) === `[object ${type}]`

export const isArray = isType('Array')

export const isObject = isType('Object')

export const isFunction = isType('Function')

export const isSymbol = isType('Symbol')

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
