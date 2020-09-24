import { Eapp } from '@/Eapp'
import { Ecomponent } from '@/Ecomponent'
import { Epage } from '@/Epage'
import { initEvents } from '@/events'
import { globalMixins } from '@/mixins'

describe('全局混入', () => {
  test('App混入钩子、其他属性', () => {
    globalMixins({
      app: {
        hooks: {
          onLaunch: [
            () => {}
          ]
        },
        data: {
          a: 1
        },
        config: {}
      }
    })
    const app = Eapp({})
    expect(app.data.a).toBe(1)
    expect(app.config).toEqual({})
    expect(app.__hooks__.onLaunch.length).toBe(1)
  })

  test('Page混入钩子、data、其他属性', () => {
    globalMixins({
      page: {
        hooks: {
          onLoad: [() => {}],
          onShow: [() => {}]
        },
        data: {
          a: 1
        },
        config: {}
      }
    })

    const page = Epage({})
    expect(page.data.a).toBe(1)
    expect(page.data$.a).toBe(1)
    expect(page.config).toEqual({})
    expect(page.__hooks__.onLoad.length).toBe(1)
    expect(page.__hooks__.onShow.length).toBe(1)
  })

  test('Component混入钩子、data、其他属性', () => {
    globalMixins({
      component: {
        hooks: {
          created: [() => {}],
          ready: [() => {}]
        },
        data: {
          a: 1
        },
        config: {}
      }
    })
    const comp = Ecomponent({})
    expect(comp.data.a).toBe(1)
    expect(comp.data$.a).toBe(1)
    expect(comp.config).toEqual({})
    expect(comp.__hooks__.created.length).toBe(1)
    expect(comp.__hooks__.ready.length).toBe(1)
  })


  test('公用属性混入', () => {
    globalMixins({
      app: {
        data: {
          a: 1
        }
      },
      page: {
        data: {
          a: 1
        }
      },
      component: {
        data: {
          a: 1
        }
      },
      data: {
        b: 2
      }
    })
    const app = Eapp({})
    const page = Epage({})
    const comp = Ecomponent({})
    expect(app.data.a).toBe(1)
    expect(page.data.a).toBe(1)
    expect(comp.data.a).toBe(1)
    expect(app.data.b).toBe(2)
    expect(page.data.b).toBe(2)
    expect(comp.data.b).toBe(2)
  })

  test('命名空间 mixins 合并优先级比页面低', () => {
    globalMixins({
      page: {
        data: {
          a: 1
        }
      }
    })
    const page = Epage({
      data: {
        a: 2
      }
    })
    expect(page.data.a).toBe(2)
  })

  test('公用 mixins 合并优先级最低', () => {
    globalMixins({
      page: {
        data: {
          a: 1
        },
      },
      data: {
        a: 2
      }
    })
    const page = Epage({})
    expect(page.data.a).toBe(1)
  })
})
