export function noop () {}

const isType = (type: string) => (val: any) => Object.prototype.toString.call(val) === `[object ${type}]`
export const isArray = isType('Array')
export const isObject = isType('Object')
export const isFunction = isType('Function')