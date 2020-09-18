import { decoratorPage } from '@/decorator'

describe('装饰Page函数', () => {
  test('装饰后Page函数是个新的函数', () => {
    const $Page = Page
    decoratorPage()
    expect($Page).not.toEqual(Page)
  })
  test('装饰后Page函数生命周期可以正常执行', () => {
    const onLoad = jest.fn()
    const onShow = jest.fn()
    decoratorPage()
    Page({
      onLoad,
      onShow
    })
    expect(onLoad.mock.calls.length).toBe(1);
    expect(onShow.mock.calls.length).toBe(1);
  })
})