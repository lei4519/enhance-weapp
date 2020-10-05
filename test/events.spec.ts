import { initEvents } from '@/events'

describe('事件通信', () => {
  test('on/once 只有函数才会被放入队列', () => {
    const ctx = initEvents({})
    ctx.$once('test', () => {})
    ctx.$once('test', <LooseFunction>{})
    ctx.$on('test', () => {})
    ctx.$on('test', <LooseFunction>{})

    expect(ctx.__events__.test.length).toBe(2)
  })

  test('emit一个没有被监听的事件，什么都不会发生', done => {
    const ctx = initEvents()
    ctx.$emit('test')
    done()
  })

  test('once 回调只会执行一次', () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const ctx = initEvents()
    ctx.$on('test', fn1)
    ctx.$once('test', fn2)
    ctx.$emit('test')
    ctx.$emit('test')
    ctx.$emit('test')
    expect(fn1.mock.calls.length).toBe(3)
    expect(fn2.mock.calls.length).toBe(1)
  })

  test('off 取消事件监听', () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const fn3 = jest.fn()
    const ctx = initEvents()
    ctx.$on('test', fn1)
    ctx.$on('test', fn2)
    ctx.$on('test', fn3)
    ctx.$emit('test')
    ctx.$off('test', fn2)
    ctx.$emit('test')
    expect(fn1.mock.calls.length).toBe(2)
    expect(fn2.mock.calls.length).toBe(1)
    expect(fn3.mock.calls.length).toBe(2)
  })

  test('off 只能取消已监听的事件，引用相等时才会能取消', () => {
    const ctx = initEvents()
    ctx.$on('test', () => {})
    ctx.$off('test', () => {})
    ctx.$off('test1', () => {})
    expect(ctx.__events__.test.length).toBe(1)
  })
})
