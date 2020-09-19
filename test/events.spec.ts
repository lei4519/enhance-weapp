import { initEvents } from '@/events'

describe('事件通信', () => {
  test('on 监听多个函数并使用emit触发', () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const fn3 = jest.fn()
    const ctx: any = {}
    initEvents(ctx)
    ctx.$on('test', fn1)
    ctx.$on('test', fn2)
    ctx.$on('test', fn3)
    ctx.$emit('test')
    expect(fn1.mock.calls.length).toBe(1)
    expect(fn2.mock.calls.length).toBe(1)
    expect(fn3.mock.calls.length).toBe(1)
  })

  test('off 取消事件监听', () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const fn3 = jest.fn()
    const ctx: any = {}
    initEvents(ctx)
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

  test('once 回调只会执行一次', () => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const ctx: any = {}
    initEvents(ctx)
    ctx.$on('test', fn1)
    ctx.$once('test', fn2)
    ctx.$emit('test')
    ctx.$emit('test')
    ctx.$emit('test')
    expect(fn1.mock.calls.length).toBe(3)
    expect(fn2.mock.calls.length).toBe(1)
  })
})
