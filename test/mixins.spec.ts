import { Ecomponent } from '@/Ecomponent'
import { Epage } from '@/Epage'
import { initEvents } from '@/events'
import { globalMixins } from '@/mixins'

describe('全局混入', () => {
  test('Page混入钩子、data、其他属性', () => {
    globalMixins({
      hooks: {
        page: {
          onLoad: [() => {}],
          onShow: [() => {}]
        }
      },
      data: {
        a: 1
      },
      config: {}
    })
    const page = Epage({})
    expect(page.data$.a).toBe(1)
    expect(page.config).toEqual({})
    expect(page.__hooks__.onLoad.length).toBe(1)
    expect(page.__hooks__.onShow.length).toBe(1)
  })

  test('Component混入钩子、data、其他属性', () => {
    globalMixins({
      hooks: {
        component: {
          created: [() => {}],
          ready: [() => {}]
        }
      },
      data: {
        a: 1
      },
      config: {}
    })
    const comp = Ecomponent({})
    expect(comp.data$.a).toBe(1)
    expect(comp.config).toEqual({})
    expect(comp.__hooks__.created.length).toBe(1)
    expect(comp.__hooks__.ready.length).toBe(1)
  })

  test('mixins 合并优先级最低', () => {
    globalMixins({
      data: {
        a: 1
      },
      config: {},
      c() {}
    })
    const page = Epage({
      data: {
        a: 2
      },
      config: { a: 1 }
    })
    expect(page.data$.a).toBe(2)
    expect(page.config).toEqual({ a: 1 })
    expect(!!page.c).toBeTruthy()
  })
})
