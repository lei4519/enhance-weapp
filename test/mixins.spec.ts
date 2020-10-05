import { globalMixins, handlerMixins } from '@/mixins'
import { initHooks } from '@/lifecycle'

describe('全局混入', () => {
  test('全局混入必须是对象才会被处理', () => {
    globalMixins(<GlobalMixinsOptions>[])
    const ctx = handlerMixins('page', <EnhanceRuntime>{})
    expect(ctx).toEqual({})
  })
  test('命名空间的 mixins，必须是对象才会被处理', () => {
    globalMixins({
      page: []
    })
    const ctx = handlerMixins('page', <EnhanceRuntime>{})
    expect(ctx).toEqual({})
  })

  test('命名空间 mixins 合并优先级比页面低', () => {
    globalMixins({
      page: {
        data: {
          a: 1
        }
      }
    })
    const page = handlerMixins('page', <any>{
      data: {
        a: 2
      }
    })
    expect(page.data.a).toBe(2)
  })

  test('公用 mixins, 合并优先级最低', () => {
    globalMixins({
      page: {
        data: {
          a: 1
        },
        b: 1
      },
      data: {
        a: 2
      },
      b: 2
    })
    const ctx = handlerMixins('page', <EnhanceRuntime>{})
    expect(ctx.data.a).toBe(1)
    expect(ctx.b).toBe(1)
  })

  test('data值必须是对象才会被处理', () => {
    globalMixins({
      page: {
        data: []
      }
    })
    const page = handlerMixins('page', initHooks('page', <EnhanceRuntime>{}))
    expect(page.data).toBeFalsy()
  })

  test('生命周期函数必须是生命周期列表中的值，否则不会被处理', () => {
    globalMixins({
      page: {
        hooks: {
          onSomething: []
        } as any
      }
    })
    const page = handlerMixins('page', initHooks('page', <EnhanceRuntime>{}))
    expect(page.__hooks__.onSomething).toBeFalsy()
  })

  test('生命周期函数可以传入函数，但最终还是会被处理成数组混入', () => {
    globalMixins({
      page: {
        hooks: {
          onLoad() {}
        }
      }
    })
    const page = handlerMixins('page', initHooks('page', <EnhanceRuntime>{}))
    expect(page.__hooks__.onLoad.length).toBe(1)
  })

  test('App混入钩子、其他属性', () => {
    globalMixins({
      app: {
        hooks: {
          onLaunch: [() => {}]
        },
        data: {
          a: 1
        },
        config: {}
      }
    })
    const app = handlerMixins('app', initHooks('app', <EnhanceRuntime>{}))
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

    const page = handlerMixins('page', initHooks('page', <EnhanceRuntime>{}))
    expect(page.data.a).toBe(1)
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
    const comp = handlerMixins(
      'component',
      initHooks('component', <EnhanceRuntime>{})
    )
    expect(comp.data.a).toBe(1)
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
    const app = handlerMixins('app', <EnhanceRuntime>{})
    const page = handlerMixins('page', <EnhanceRuntime>{})
    const comp = handlerMixins('component', <EnhanceRuntime>{})
    expect(app.data.a).toBe(1)
    expect(page.data.a).toBe(1)
    expect(comp.data.a).toBe(1)
    expect(app.data.b).toBe(2)
    expect(page.data.b).toBe(2)
    expect(comp.data.b).toBe(2)
  })
})
