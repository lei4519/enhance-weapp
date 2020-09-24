import { Epage } from '@/main'
import { interceptors } from '@/request'
describe('$ajax 测试', () => {
  test('$ajax 返回promise', done => {
    const page = Epage({})
    page.$ajax({ url: '' }).then(done)
  })
  test('请求拦截器resolve', done => {
    const queue: number[] = []
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
    const page = Epage({})
    page.$ajax(config).then(() => {
      expect(queue).toEqual([3, 2, 1])
      expect(config.c).toBe(3)
      expect(config.b).toBe(2)
      expect(config.a).toBe(1)
      done()
    })
  })
  test('请求拦截器reject', done => {
    const queue: number[] = []
    interceptors.request.use(void 0, config => {
      config.a = 1
      queue.push(1)
      return Promise.reject(config)
    })
    interceptors.request.use(
      void 0,
      config => {
        config.b = 2
        queue.push(2)
        return Promise.reject(config)
      }
    )
    interceptors.request.use(config => {
      config.c = 3
      queue.push(3)
      return Promise.reject(config)
    })
    const config: any = { url: '' }
    const page = Epage({})
    page.$ajax(config).then(() => {
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
    const config: any = { url: '' }
    const page = Epage({})
    page.$ajax(config).then((res: any) => {
      const options = res.options
      expect(options.a).toBe(1)
      expect(options.b).toBe(2)
      expect(options.c).toBe(3)
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
    const config: any = { url: '' }
    const page = Epage({})
    page.$ajax(config).then(void 0, (res: any) => {
      const options = res.options
      expect(options.a).toBe(1)
      expect(options.b).toBe(2)
      expect(options.c).toBe(3)
      done()
    })
  })
})
