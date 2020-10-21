import { LooseFunction, Interceptors, AjaxOptions } from '../types'
import { isFunction } from './util'
const request: [LooseFunction, LooseFunction][] = []
const response: [LooseFunction, LooseFunction][] = []

export const interceptors: Interceptors = {
  request: {
    use(onFulfilled, onRejected) {
      onFulfilled = isFunction(onFulfilled)
        ? onFulfilled
        : (config: any) => config
      onRejected = isFunction(onRejected)
        ? onRejected
        : (error: any) => Promise.reject(error)
      request.push([onFulfilled!, onRejected!])
    }
  },
  response: {
    use(onFulfilled, onRejected) {
      onFulfilled = isFunction(onFulfilled)
        ? onFulfilled
        : (config: any) => config
      onRejected = isFunction(onRejected)
        ? onRejected
        : (error: any) => Promise.reject(error)
      response.push([onFulfilled!, onRejected!])
    }
  }
}

export function requestMethod<T = any>(options: AjaxOptions): Promise<T> {
  const _request = (options: AjaxOptions) =>
    new Promise<T>((resolve, reject) => {
      options.success = response => resolve({ options, response } as any)
      options.fail = response => reject({ options, response } as any)
      wx.request(options)
    })
  const chain = [[_request, void 0]]
  request.forEach((block: any) => {
    chain.unshift(block)
  })
  response.forEach((block: any) => {
    chain.push(block)
  })
  let promise = Promise.resolve<any>(options)
  chain.forEach(([onFulfilled, onRejected]) => {
    promise = promise.then(onFulfilled, onRejected)
  })
  return promise
}

requestMethod.interceptors = interceptors