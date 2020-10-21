import automator from 'miniprogram-automator'
import path from 'path'
import { Eapp } from '@/Eapp'
import { Epage } from '@/Epage'
import { Ecomponent } from '@/Ecomponent'
import { setTimeoutResolve } from '@/util'
import { customControlLifecycle, notControlLifecycle } from '@/lifecycle'
import { isReactive, isReadonly, reactive, ref } from '@vue/reactivity'
import { getCurrentCtx } from '@/createPushHooks'

/**
 * 对传给小程序原生函数的选项处理是否正确？
 * 运行期间的逻辑是否正确？
 * */
describe('装饰生命周期函数', () => {
  let miniProgram: any
  // beforeAll(async () => {
  //   miniProgram = await automator.launch({
  //     projectPath: path.resolve(__dirname, '../testProject')
  //   })
  // }, 40000)
  //
  // afterAll(async () => {
  //   await miniProgram.close()
  // })

  beforeAll(async () => {
    miniProgram = await automator.connect({
      wsEndpoint: 'ws://localhost:9420'
    })
  }, 40000)

  afterAll(async () => {
    await miniProgram.disconnect()
  })

  // reactive
  test('初始的data值会复制给data$, 但是两者引用并不相等', () => {
    const page: any = Epage({
      data: {
        e: {}
      },
      setup() {
        return {}
      }
    })
    expect(page.data !== page.data$).toBeTruthy()
    expect(page.data.e !== page.data$.e).toBeTruthy()
  })

  test('获取运行期间的实例', () => {
    let page, ctx
    Epage({
      onLoad() {
        ctx = getCurrentCtx()
        page = this
      }
    })
    expect(page).toBe(ctx)
  })

  test('setup返回值是Object时才会做处理', () => {
    const page: any = Epage({
      data: {
        d: 1,
        e: {}
      },
      setup() {
        return []
      }
    })
    expect(page.data).toEqual({
      d: 1,
      e: {}
    })
  })

  test('setup返回值合并时，合并给data的是普通值，合并给data$的是响应式值', () => {
    const page: any = Epage({
      data: {
        d: 1,
        e: {}
      },
      setup() {
        const a = ref(1)
        const c = reactive({})
        return {
          a,
          b: {},
          c
        }
      }
    })
    expect(isReactive(page.data)).toBeFalsy()
    expect(isReactive(page.data.b)).toBeFalsy()
    expect(isReactive(page.data.c)).toBeFalsy()
    expect(isReactive(page.data.e)).toBeFalsy()

    expect(isReactive(page.data$)).toBeTruthy()
    expect(isReactive(page.data$.b)).toBeFalsy()
    expect(isReactive(page.data$.c)).toBeTruthy()
    expect(isReactive(page.data$.e)).toBeTruthy()

    const comp: any = Ecomponent({
      data: {
        d: 1,
        e: {}
      },
      setup() {
        const a = ref(1)
        const c = reactive({})
        return {
          a,
          b: {},
          c
        }
      }
    })
    expect(isReactive(comp.data)).toBeFalsy()
    expect(isReactive(comp.data.b)).toBeFalsy()
    expect(isReadonly(comp.data.c)).toBeFalsy()
    expect(isReactive(comp.data.e)).toBeFalsy()

    expect(isReactive(comp.data$)).toBeTruthy()
    expect(isReactive(comp.data$.b)).toBeFalsy()
    expect(isReactive(comp.data$.c)).toBeTruthy()
    expect(isReactive(comp.data$.e)).toBeTruthy()
  })

  test('setup返回值，函数绑定至this(methods)上，其他值绑定到data上', () => {
    const c = () => {}
    const page: any = Epage({
      setup() {
        const a = ref(1)
        return {
          a,
          b: {},
          c
        }
      }
    })
    const comp: any = Ecomponent({
      setup() {
        const a = ref(1)
        return {
          a,
          b: {},
          c
        }
      }
    })
    expect(page.data.a).toBe(1)
    expect(page.data.b).toEqual({})
    expect(page.c).toBe(c)
    expect(comp.data.a).toBe(1)
    expect(comp.data.b).toEqual({})
    expect(comp.c).toBe(c)
  })

  test('reactive and watching', async () => {
    {
      /**
       * setup返回值，函数绑定至this(methods)上，其他值绑定到data上
       * 命名冲突时，setup返回值覆盖data值
       * ref值修改会同步至data和data$
       * reactive值修改会同步至data和data$
       * reactive数组值通过方法修改会同步至data和data$
       * data$修改会同步至data、reactive和ref
       */
      await miniProgram.reLaunch('/pages/reactive/reactive')
      {
        // 页面
        let page = await miniProgram.evaluate(() => {
          return getCurrentPages()[0]
        })
        // setup返回值，函数绑定至this(methods)上，其他值绑定到data上
        expect(page.data.a).toBe(1)
        expect(page.data.b).toEqual({})
        expect(page.c).toBe('function:c')

        const curPage = await miniProgram.currentPage()
        const changeRef = await curPage.$('#changeRef')
        const changeReactiveVal = await curPage.$('#changeReactiveVal')
        const changeReactiveArr = await curPage.$('#changeReactiveArr')
        const changeData = await curPage.$('#changeData')
        let changeRefWxml = await changeRef.text()
        let changeReactiveValWxml = await changeReactiveVal.text()
        let changeReactiveArrWxml = await changeReactiveArr.text()
        let changeDataWxml = await changeData.text()
        let data = await miniProgram.evaluate(() => {
          return getCurrentPages()[0].getData()
        })

        expect(changeRefWxml).toBe('1')
        expect(page.data$.refVal).toBe(1)

        expect(changeReactiveValWxml).toBe('1')
        expect(page.data$.reactiveVal.value).toBe(1)

        expect(changeReactiveArrWxml).toBe('1,2,3')
        expect(page.data$.reactiveVal.array).toEqual([1, 2, 3])

        expect(changeDataWxml).toBe('1 1 1,2,3')
        expect(data[0]).toBe(1)
        expect(data[1].value).toBe(1)
        expect(data[1].array).toEqual([1, 2, 3])
        expect(page.data$.dataRef).toBe(1)
        expect(page.data$.dataReactive.value).toEqual(1)
        expect(page.data$.dataReactive.array).toEqual([1, 2, 3])

        await changeRef.tap()
        await changeReactiveVal.tap()
        await changeReactiveArr.tap()
        await changeData.tap()
        page = await miniProgram.evaluate(() => {
          return getCurrentPages()[0]
        })
        changeRefWxml = await changeRef.text()
        changeReactiveValWxml = await changeReactiveVal.text()
        changeReactiveArrWxml = await changeReactiveArr.text()
        changeDataWxml = await changeData.text()
        data = await miniProgram.evaluate(() => {
          return getCurrentPages()[0].getData()
        })

        expect(changeRefWxml).toBe('2')
        expect(page.data$.refVal).toBe(2)

        expect(changeReactiveValWxml).toBe('2')
        expect(page.data$.reactiveVal.value).toBe(2)

        expect(changeReactiveArrWxml).toBe('1,2')
        expect(page.data$.reactiveVal.array).toEqual([1, 2])

        expect(changeDataWxml).toBe('2 2 1,2')
        expect(data[0]).toBe(2)
        expect(data[1].value).toBe(2)
        expect(data[1].array).toEqual([1, 2])
        expect(page.data$.dataRef).toBe(2)
        expect(page.data$.dataReactive.value).toEqual(2)
        expect(page.data$.dataReactive.array).toEqual([1, 2])
      }

      {
        // 组件
        let comp = await miniProgram.evaluate(() => {
          return getCurrentPages()[0].selectComponent('#test')
        })
        // setup返回值，函数绑定至this(methods)上，其他值绑定到data上
        expect(comp.data.a).toBe(1)
        expect(comp.data.b).toEqual({})
        expect(comp.c).toBe('function:c')

        const curPage = await miniProgram.currentPage()
        const curComp = await curPage.$('#test')
        let [changeRefWxml, changeReactiveValWxml, changeReactiveArrWxml] = (
          await curComp.text()
        ).split('\n')

        expect(changeRefWxml).toBe('1')
        expect(comp.data$.refVal).toBe(1)

        expect(changeReactiveValWxml).toBe('1')
        expect(comp.data$.reactiveVal.value.a.b).toBe(1)

        expect(changeReactiveArrWxml).toBe('1,2,3')
        expect(comp.data$.reactiveVal.array).toEqual([1, 2, 3])

        const buttons = await curComp.$$('button')
        await buttons[0].tap()
        await buttons[1].tap()
        await buttons[2].tap()

        comp = await miniProgram.evaluate(() => {
          return getCurrentPages()[0].selectComponent('#test')
        })
        ;[changeRefWxml, changeReactiveValWxml, changeReactiveArrWxml] = (
          await curComp.text()
        ).split('\n')

        expect(changeRefWxml).toBe('2')
        expect(comp.data$.refVal).toBe(2)

        expect(changeReactiveValWxml).toBe('2')
        expect(comp.data$.reactiveVal.value.a.b).toBe(2)

        expect(changeReactiveArrWxml).toBe('1,2')
        expect(comp.data$.reactiveVal.array).toEqual([1, 2])
      }
    }
    {
      /**
       * 组件的首次setData在attached调用，调用后会移除此函数防止多次调用
       * 响应式变更在onHide/onUnload/hide/detached后会移除监听
       * 响应式变更在onLoad/onShow/show/attached时会重新监听
       */
      await miniProgram.reLaunch('/pages/watching/watching')

      const compHooks = await miniProgram.evaluate(() => {
        return getCurrentPages()[0].selectComponent('#test').__hooks__
      })
      expect(
        compHooks.attached.findIndex(
          (name: any) => name === 'function:initComponentSetData'
        )
      ).toBe(-1)

      let page = await miniProgram.evaluate(() => {
        return getCurrentPages()[0]
      })
      let comp = await miniProgram.evaluate(() => {
        return getCurrentPages()[0].selectComponent('#test')
      })
      const curPage = await miniProgram.currentPage()
      let pageText = await (await curPage.$('view')).text()
      let compText = await (await (await curPage.$('#test')).$('view')).text()

      expect(pageText).toBe('1')
      expect(page.data$.value).toBe(1)
      expect(compText).toBe('1')
      expect(comp.data$.value).toBe(1)

      await miniProgram.navigateTo('/pages/reactive/reactive')
      page = await miniProgram.evaluate(() => {
        return getCurrentPages()[0]
      })
      comp = await miniProgram.evaluate(() => {
        return getCurrentPages()[0].selectComponent('#test')
      })
      pageText = await (await curPage.$('view')).text()
      compText = await (await (await curPage.$('#test')).$('view')).text()
      expect(pageText).toBe('1')
      expect(page.data$.value).toBe(2)
      expect(compText).toBe('1')
      expect(comp.data$.value).toBe(2)

      await miniProgram.navigateBack()
      page = await miniProgram.evaluate(() => {
        return getCurrentPages()[0]
      })
      comp = await miniProgram.evaluate(() => {
        return getCurrentPages()[0].selectComponent('#test')
      })
      pageText = await (await curPage.$('view')).text()
      compText = await (await (await curPage.$('#test')).$('view')).text()
      expect(pageText).toBe('3')
      expect(page.data$.value).toBe(3)
      expect(compText).toBe('3')
      expect(comp.data$.value).toBe(3)
    }
  }, 30000)

  // lifecycle
  test('Component会对选项做初始化工作, setup会放在methods中', () => {
    const comp: any = Ecomponent({
      setup() {
        return {}
      }
    })
    expect(comp.pageLifetimes).toBeTruthy()
    expect(comp.lifetimes).toBeTruthy()
    expect(comp.methods).toBeTruthy()
    expect(comp.methods.setup).toBeTruthy()
  })

  test('生命周期钩子会在对应的选项中进行装饰', () => {
    const app: any = Eapp({})
    const page: any = Epage({})
    const comp: any = Ecomponent({})
    expect(Object.keys(app)).toEqual([
      'onLaunch',
      'onShow',
      'onHide',
      'onError',
      'onPageNotFound',
      'onUnhandledRejection',
      'onThemeChange'
    ])
    expect(Object.keys(page)).toEqual([
      'onLoad',
      'onShow',
      'onReady',
      'onHide',
      'onUnload',
      'onPullDownRefresh',
      'onReachBottom',
      'onTabItemTap',
      'onResize',
      'onAddToFavorites',
      'setData'
    ])
    expect(Object.keys(comp.lifetimes)).toEqual([
      'created',
      'attached',
      'ready',
      'moved',
      'detached',
      'error'
    ])
    expect(Object.keys(comp.pageLifetimes)).toEqual(['show', 'hide', 'resize'])
  })

  test('装饰后生命周期函数不再是之前的函数', () => {
    const onLaunch = () => {}
    const app: any = Eapp({
      onLaunch
    })
    expect(app.onLaunch).not.toEqual(onLaunch)

    const onLoad = () => {}
    const pageOptions = {
      onLoad,
      onResize() {}
    }
    Epage(pageOptions)
    expect(pageOptions.onLoad).not.toEqual(onLoad)

    const created = () => {}
    const show = () => {}
    const componentOptions = {
      created,
      pageLifetimes: {
        show
      }
    }
    const comp: any = Ecomponent(componentOptions)
    expect(comp.lifetimes.created).not.toEqual(created)
    expect(comp.pageLifetimes.show).not.toEqual(show)
  })

  test('在onLaunch、onLoad、created中初始化events, __events__不可遍历', () => {
    const app: any = Eapp({})
    const page: any = Epage({})
    const comp: any = Ecomponent({})
    expect(app.__events__).toBeTruthy()
    expect(page.__events__).toBeTruthy()
    expect(comp.__events__).toBeTruthy()
    expect(Object.keys(app).findIndex(k => k === '__events__')).toBe(-1)
    expect(Object.keys(page).findIndex(k => k === '__events__')).toBe(-1)
    expect(Object.keys(comp).findIndex(k => k === '__events__')).toBe(-1)
  })

  test('在onLaunch、onLoad、created中初始化钩子队列, __hooks__属性不可遍历', () => {
    const app: any = Eapp({})
    const page: any = Epage({})
    const comp: any = Ecomponent({})
    expect(app.__hooks__).toBeTruthy()
    expect(page.__hooks__).toBeTruthy()
    expect(comp.__hooks__).toBeTruthy()
    expect(Object.keys(app).findIndex(k => k === '__hooks__')).toBe(-1)
    expect(Object.keys(page).findIndex(k => k === '__hooks__')).toBe(-1)
    expect(Object.keys(comp).findIndex(k => k === '__hooks__')).toBe(-1)
  })

  test('App 中不处理 setup、data', async () => {
    const app: any = Eapp({})
    expect(app.$nextTick).toBeFalsy()
    expect(app.data$).toBeFalsy()
  })

  test('如果没有传入setup，将不会对data、响应式等做增强', () => {
    const page: any = Epage({})
    const comp: any = Ecomponent({})
    expect(page.$nextTick).toBeFalsy()
    expect(page.data$).toBeFalsy()
    expect(comp.$nextTick).toBeFalsy()
    expect(comp.data$).toBeFalsy()
  })

  test('生命周期执行顺序', async done => {
    /**
     * 生命周期执行顺序
     * 装饰后选项上的生命周期函数可以是数组
     * 选项中定义的生命周期，最后执行
     * 生命周期中可以使用onX添加生命周期函数, 可以如此递归
     * 使用onX添加的生命周期函数, 会依次执行
     * 生命周期函数如果返回Promise，会阻塞后续代码执行
     * 装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成
     * 微信传入生命周期的参数为默认值，生命周期函数如果返回值为undefined, 在之后的函数中依然可以接收到默认值
     * 生命周期函数如果有返回值并且不为undefined, 默认值会更新为此值，在之后的函数中可以接收到这个默认值
     * 多个实例生命周期异步穿插运行，动态添加的钩子可以正确指向对应实例
     */
    await miniProgram.reLaunch('/pages/lifecycle/lifecycle')
    const page = await miniProgram.evaluate(() => {
      return getCurrentPages()[0]
    })
    const [comp1, comp2] = await miniProgram.evaluate(() => {
      return [
        getCurrentPages()[0].selectComponent('#test'),
        getCurrentPages()[0].selectComponent('#test1')
      ]
    })
    await setTimeoutResolve(null, 500)
    expect(page.data$.queue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(page.data$.optionsList).toEqual([{}, { a: 1 }])
    expect(comp1.data$.queue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(comp2.data$.queue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    done()
  }, 20000)

  test('捕获生命周期执行错误：同步', async done => {
    await miniProgram.reLaunch('/pages/lifecycleError/lifecycle')
    const page = await miniProgram.evaluate(() => {
      return getCurrentPages()[0]
    })
    await setTimeoutResolve(null, 500)
    expect(page.data$.queue).toEqual([1, 2, 3, 4])

    notControlLifecycle()
    const queue: any = []
    Epage({
      onLoad() {
        queue.push(1)
        throw new Error()
      },
      catchLifeCycleError() {
        queue.push(2)
      }
    })
    await setTimeoutResolve(null, 100)
    expect(queue).toEqual([1, 2])
    done()
  }, 20000)

  test('捕获生命周期执行错误：异步', async done => {
    await miniProgram.reLaunch('/pages/lifecycleError/lifecycle1')
    const page = await miniProgram.evaluate(() => {
      return getCurrentPages()[0]
    })
    await setTimeoutResolve(null, 500)
    expect(page.data$.queue).toEqual([1, 2, 3, 4])

    notControlLifecycle()
    const queue: any = []
    Epage({
      onLoad() {
        queue.push(1)
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error())
          })
        })
      }
    })
    await setTimeoutResolve(null, 100)
    expect(queue).toEqual([1])
    done()
  }, 20000)

  test('异步情况: 生命周期应该按照顺序执行', async done => {
    // 生命周期执行顺序
    // 初始化
    // ⬇️ onLaunch App
    // ⬇️ onShow App
    // App的onShow，应该在App onLaunch执行完成之后执行

    // ⬇️ created Comp
    // Component的created，应该在Page onShow执行完成之后执行

    // ⬇️ attached Comp
    // Component的attached，应该在Component created执行完成之后执行

    // ⬇️ ready Comp
    // Component的ready，应该在Component attached执行完成之后执行

    // ⬇️ onLoad Page
    // Page的onLoad，应该在App onShow执行完成之后执行

    // ⬇️ onShow Page
    // Page的onShow 应该在Page onLoad执行完成之后执行

    // ⬇️ onReady Page
    // Page的onReady，应该在Page onShow执行完成之后执行

    // 切后台
    // ⬇️ onHide Page
    // ⬇️ onHide App
    // App的onHide，应该在Page onHide执行完成之后执行

    // 切前台
    // ⬇️ onShow App
    // ⬇️ onShow Page
    // Page的onShow  应该在App onShow执行完成之后执行

    await miniProgram.reLaunch('/pages/lifecycle/lifecycle')
    await miniProgram.navigateTo('/pages/lcOrderAsync/lcOrder')
    const globalData = await miniProgram.evaluate(() => {
      return getApp().globalData
    })
    expect(globalData.orderAsync).toEqual([
      'onLaunch',
      'onShow',
      'onHide',
      'onLoad',
      'onShow',
      'onReady',
      'created',
      'attached',
      'ready'
    ])
    done()
  }, 20000)

  test('独立分包: 生命周期执行顺序', async done => {
    ;(global as any).getApp = () => false
    await miniProgram.reLaunch('/pages/moduleA/pages/independent')
    const page = await miniProgram.evaluate(() => {
      return getCurrentPages()[0]
    })
    await setTimeoutResolve(null, 500)
    expect(page.data$.queue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(page.data$.optionsList).toEqual([{}, { a: 1 }])
    done()
    ;(global as any).getApp = () => true
  }, 20000)

  test('自定义生命周期控制', async done => {
    customControlLifecycle(({ invokeHooks }: any) => invokeHooks())
    await miniProgram.evaluate(() => {
      getApp().customControlLifecycle(({ invokeHooks }: any) => invokeHooks())
    })
    await miniProgram.reLaunch('/pages/lifecycle/lifecycle')
    await miniProgram.navigateTo('/pages/lcOrderAsync/lcOrder')
    const globalData = await miniProgram.evaluate(() => {
      return getApp().globalData
    })
    expect(globalData.orderAsync).not.toEqual([
      'onLaunch',
      'onShow',
      'onHide',
      'onLoad',
      'onShow',
      'onReady',
      'created',
      'attached',
      'ready'
    ])
    done()
  }, 20000)

  test('解除生命周期控制', async done => {
    await miniProgram.evaluate(() => {
      getApp().notControlLifecycle()
    })
    await miniProgram.reLaunch('/pages/lifecycle/lifecycle')
    await miniProgram.navigateTo('/pages/lcOrderAsync/lcOrder')
    const globalData = await miniProgram.evaluate(() => {
      return getApp().globalData
    })
    expect(globalData.orderAsync).not.toEqual([
      'onLaunch',
      'onShow',
      'onHide',
      'onLoad',
      'onShow',
      'onReady',
      'created',
      'attached',
      'ready'
    ])
    done()
  }, 20000)
})
