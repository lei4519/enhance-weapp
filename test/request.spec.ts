import { interceptors, requestMethod } from '@/request'
describe('requestMethod、拦截器 测试', () => {
  test('requestMethod 返回promise', done => {
    requestMethod({ url: '' }).then(() => {
      done()
    })
  })
  test('请求拦截器 resolve', done => {
    const queue: number[] = []
    interceptors.request.use(void 0, void 0)
    interceptors.request.use(config => {
      config.a = 1
      queue.push(1)
      return config
    })
    interceptors.request.use(config => {
      config.b = 2
      queue.push(2)
      return config
    })
    interceptors.request.use(config => {
      config.c = 3
      queue.push(3)
      return config
    })
    const config: any = { url: '' }
    requestMethod(config).then(() => {
      expect(queue).toEqual([3, 2, 1])
      expect(config.c).toBe(3)
      expect(config.b).toBe(2)
      expect(config.a).toBe(1)
      done()
    })
  })
  test('请求拦截器reject', done => {
    const queue: number[] = []
    interceptors.request.use(void 0, void 0)
    interceptors.request.use(void 0, config => {
      config.a = 1
      queue.push(1)
      return config
    })
    interceptors.request.use(void 0, config => {
      config.b = 2
      queue.push(2)
      return Promise.reject(config)
    })
    interceptors.request.use(config => {
      config.c = 3
      queue.push(3)
      return Promise.reject(config)
    }, void 0)
    const config: any = { url: '' }
    requestMethod(config).then(() => {
      expect(queue).toEqual([3, 2, 1])
      expect(config.c).toBe(3)
      expect(config.b).toBe(2)
      expect(config.a).toBe(1)
      done()
    })
  })
  test('响应拦截器resolve', done => {
    interceptors.response.use((res = {}) => {
      res.a = 1
      return res
    })
    interceptors.response.use(res => {
      res.b = 2
      return res
    })
    interceptors.response.use(res => {
      res.c = 3
      return res
    })
    interceptors.response.use(void 0, void 0)
    const config: any = { url: '' }
    requestMethod(config).then((res: any) => {
      expect(res.a).toBe(1)
      expect(res.b).toBe(2)
      expect(res.c).toBe(3)
      done()
    })
  })
  test('响应拦截器reject', done => {
    interceptors.response.use((res = {}) => {
      res.a = 1
      return Promise.reject(res)
    })
    interceptors.response.use(void 0, res => {
      res.b = 2
      return Promise.reject(res)
    })
    interceptors.response.use(void 0, res => {
      res.c = 3
      return Promise.reject(res)
    })
    interceptors.response.use(void 0, void 0)
    const config: any = { url: '' }
    requestMethod(config).then(void 0, (res: any) => {
      expect(res.a).toBe(1)
      expect(res.b).toBe(2)
      expect(res.c).toBe(3)
      done()
    })
  })
})
