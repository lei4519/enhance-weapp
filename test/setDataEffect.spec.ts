import { Epage } from '@/Epage'
import { setDataQueueJob } from '@/setDataEffect'
import { notControlLifecycle } from '@/lifecycle'

describe('setData', () => {
  test('setData下一微任务执行', done => {
    const setData = jest.fn()
    const page: any = Epage({
      setData,
      setup() {
        return {
          a: 1
        }
      }
    })
    page.data$.a = 2
    setDataQueueJob(page)
    setDataQueueJob(page)
    const setData1 = jest.fn()
    const page1: any = Epage({
      setData: setData1,
      setup() {
        return {
          a: 1
        }
      }
    })
    page1.data$.a = 2
    setDataQueueJob(page1)
    // 初始化会调用一次
    expect(setData.mock.calls.length).toBe(1)
    expect(setData1.mock.calls.length).toBe(1)
    Promise.resolve().then(() => {
      expect(setData.mock.calls.length).toBe(2)
      expect(setData1.mock.calls.length).toBe(2)
      done()
    })
  })
  test('setData下一微任务执行2', done => {
    notControlLifecycle()
    const setData = jest.fn()
    const page: any = Epage({
      setData,
      setup() {
        return {
          a: 1
        }
      }
    })

    page.$once('onShow:resolve', () => {
      page.data$.a = 3
      page.data$.a = 2
      page.data$.a = 5
      setDataQueueJob(page)
      // 初始化会调用一次
      expect(setData.mock.calls.length).toBe(1)
      setTimeout(() => {
        expect(setData.mock.calls.length).toBe(2)
        done()
      })
    })
  })
  test('nextTick传入函数', done => {
    const nextTick = jest.fn()
    const page: any = Epage({
      setData(a: any, fn: LooseFunction) {
        fn?.()
      },
      setup() {
        return {
          a: 1
        }
      }
    })
    page.data$.a = 2
    setDataQueueJob(page)
    page.$nextTick(nextTick)
    page.$nextTick(() => {
      expect(nextTick.mock.calls.length).toBe(1)
      done()
    })
    expect(nextTick.mock.calls.length).toBe(0)
  })

  test('nextTick Promise', done => {
    const fn = jest.fn()
    const page: any = Epage({
      setData(a: any, fn: LooseFunction) {
        fn?.()
      },
      setup() {
        return {
          a: 1
        }
      }
    })
    page.data$.a = 2
    setDataQueueJob(page)
    page.$nextTick().then(() => {
      fn()
    })
    page.$nextTick().then(() => {
      expect(fn.mock.calls.length).toBe(1)
      done()
    })
    expect(fn.mock.calls.length).toBe(0)
  })

  test('nextTick Promise和函数同时使用，可以顺序执行', done => {
    const fn = jest.fn()
    const page: any = Epage({
      setData(a: any, fn: LooseFunction) {
        fn?.()
      },
      setup() {
        return {
          a: 1
        }
      }
    })
    page.data$.a = 2
    setDataQueueJob(page)
    page.$nextTick().then(() => {
      fn()
    })
    page.$nextTick(() => {
      expect(fn.mock.calls.length).toBe(1)
      done()
    })
    expect(fn.mock.calls.length).toBe(0)
  })

  test('两次值没有变化，不会触发setData', done => {
    const setData = jest.fn()
    const page: any = Epage({
      setData,
      setup() {
        return {
          a: 1
        }
      }
    })
    setDataQueueJob(page)
    page.$nextTick(() => {
      expect(setData.mock.calls.length).toBe(1)
      done()
    })
    expect(setData.mock.calls.length).toBe(1)
  })
})
