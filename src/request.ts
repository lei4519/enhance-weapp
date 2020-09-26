import { isFunction } from './util'
const request: any[] = []
const response: any[] = []

export const interceptors: Interceptors = {
  request: {
    use(onFulfilled, onRejected) {
      const block = []
      block.push(
        isFunction(onFulfilled) ? onFulfilled : (config: any) => config
      )
      block.push(isFunction(onRejected) ? onRejected : (error: any) => error)
      request.push(block)
    }
  },
  response: {
    use(onFulfilled, onRejected) {
      const block = []
      isFunction(onFulfilled) && block.push(onFulfilled)
      isFunction(onRejected) && block.push(onRejected)
      block.length && response.push(block)
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
