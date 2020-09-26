import { Eapp } from '@/Eapp'
import { Epage } from '@/Epage'
import { Ecomponent } from '@/Ecomponent'
import { onLoad, onCreated, onLaunch } from '@/lifecycle'
import { setTimeoutResolve } from '@/util'
describe('装饰生命周期函数', () => {
  test('装饰后生命周期函数不再是之前的函数', () => {
    const onLaunch = () => {}
    const appOptions = {
      onLaunch
    }
    Eapp(appOptions)
    expect(appOptions.onLaunch).not.toEqual(onLaunch)

    const onLoad = () => {}
    const pageOptions = {
      onLoad
    }
    Epage(pageOptions)
    expect(pageOptions.onLoad).not.toEqual(onLoad)

    const created = () => {}
    const componentOptions = {
      created
    }
    const comp = Ecomponent(componentOptions)
    expect(comp.lifetimes.created).not.toEqual(created)
  })

  test('Component装饰后的函数应该在lifetimes上', () => {
    const created = () => {}
    const attached = () => {}
    const componentOptions: LooseObject = {
      created,
      attached
    }
    Ecomponent(componentOptions)
    expect(componentOptions.lifetimes.created).toBeTruthy()
    expect(componentOptions.lifetimes.attached).toBeTruthy()
  })

  test('装饰后选项上的生命周期函数可以是数组', done => {
    const fn1 = jest.fn()
    const fn2 = jest.fn()
    const fn3 = jest.fn()
    const fn4 = jest.fn()
    const pageOptions: LooseObject = {
      onLoad: [fn1, fn2, fn3, fn4]
    }
    const page = Epage(pageOptions)
    page.$once('onLoad:resolve', () => {
      expect(fn1.mock.calls.length).toBe(1)
      expect(fn2.mock.calls.length).toBe(1)
      expect(fn3.mock.calls.length).toBe(1)
      expect(fn4.mock.calls.length).toBe(1)
      done()
    })
  })

  test('在onLaunch、onLoad、created中初始化events, __events__不可遍历', () => {
    const app = Eapp({})
    const page = Epage({})
    const comp = Ecomponent({})
    expect(app.__events__).toBeTruthy()
    expect(page.__events__).toBeTruthy()
    expect(comp.__events__).toBeTruthy()
    expect(Object.keys(app).findIndex(k => k === '__events__')).toBe(-1)
    expect(Object.keys(page).findIndex(k => k === '__events__')).toBe(-1)
    expect(Object.keys(comp).findIndex(k => k === '__events__')).toBe(-1)
  })

  test('在onLaunch、onLoad、created中初始化钩子队列, __hooks__属性不可遍历', () => {
    const app = Eapp({})
    const page = Epage({})
    const comp = Ecomponent({})
    expect(app.__hooks__).toBeTruthy()
    expect(page.__hooks__).toBeTruthy()
    expect(comp.__hooks__).toBeTruthy()
    expect(Object.keys(app).findIndex(k => k === '__hooks__')).toBe(-1)
    expect(Object.keys(page).findIndex(k => k === '__hooks__')).toBe(-1)
    expect(Object.keys(comp).findIndex(k => k === '__hooks__')).toBe(-1)
  })

  test('App 中不处理 setup、data', () => {
    const app = Eapp({})
    expect(app.$nextTick).toBeFalsy()
    expect(app.data$).toBeFalsy()
  })

  test('如果没有传入setup，将不会对data、响应式等做增强', () => {
    const page = Epage({})
    const comp = Ecomponent({})
    expect(page.$nextTick).toBeFalsy()
    expect(page.data$).toBeFalsy()
    expect(comp.$nextTick).toBeFalsy()
    expect(comp.data$).toBeFalsy()
  })

  test('选项中定义的生命周期，最后执行', done => {
    const queue: number[] = []
    Eapp({})
    const page = Epage({
      setup() {
        onLoad(() => {
          queue.push(1)
        })
      },
      onLoad() {
        queue.push(2)
      }
    })
    const comp = Ecomponent({
      setup() {
        onCreated(() => {
          queue.push(3)
        })
      },
      created() {
        queue.push(4)
      }
    })
    comp.$once('created:resolve', () => {
      expect(queue).toEqual([1, 2, 3, 4])
      done()
    })
  })

  test('装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成', () => {
    const onLoad = jest.fn()
    Eapp({})
    const page = Epage({
      onLoad
    })
    const pageDone = () => {
      return new Promise(r => {
        page.$once('onLoad:resolve', r)
      })
    }
    const created = jest.fn()
    const comp = Ecomponent({
      created
    })
    const compDone = () => {
      return new Promise(r => {
        comp.$once('created:resolve', r)
      })
    }
    return Promise.all([pageDone(), compDone()]).then(() => {
      expect(onLoad.mock.calls.length).toBe(1)
      expect(created.mock.calls.length).toBe(1)
    })
  })

  test('生命周期中可以使用onX添加生命周期函数, 可以如此递归', done => {
    const onLoad2 = jest.fn()
    const onLoad1 = function () {
      onLoad(onLoad2)
    }
    Eapp({})
    const page = Epage({
      onLoad() {
        onLoad(onLoad1)
      }
    })
    page.$once('onLoad:resolve', () => {
      expect(onLoad2.mock.calls.length).toBe(1)
      done()
    })
  })

  test('使用onX添加的生命周期函数, 会依次执行', done => {
    Eapp({})
    const queue: number[] = []
    const onLoad1 = function () {
      queue.push(1)
    }
    const onLoad2 = function () {
      queue.push(2)
    }
    const onLoad3 = function () {
      queue.push(3)
    }
    const page = Epage({
      onLoad() {
        onLoad(onLoad1)
        onLoad(onLoad2)
        onLoad(onLoad3)
      }
    })
    page.$once('onLoad:resolve', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('使用onX添加的生命周期函数, 返回Promise，会阻塞后续代码执行', done => {
    const queue: number[] = []
    const onLoad1 = function () {
      return new Promise(r => {
        queue.push(1)
        setTimeout(() => r(queue), 1000)
      })
    }
    const onLoad2 = function (queue: number[]) {
      return new Promise(r => {
        queue.push(2)
        setTimeout(() => r(queue), 1000)
      })
    }
    const onLoad3 = function (queue: number[]) {
      return new Promise(r => {
        setTimeout(() => {
          queue.push(3)
          r()
        }, 1000)
      })
    }
    const page = Epage({
      onLoad() {
        onLoad(onLoad1)
        onLoad(onLoad2)
        onLoad(onLoad3)
      }
    })
    page.$once('onLoad:resolve', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('多个实例生命周期异步穿插运行，动态添加的钩子可以正确指向对应实例', () => {
    let res: LooseObject
    const onCreated1 = function (this: LooseObject) {
      res = this.flag
    }
    const onCreated2 = function () {
      onCreated(onCreated1)
      return setTimeoutResolve(null, 1000)
    }
    const comp1 = Ecomponent({
      created() {
        onCreated(onCreated2)
        return setTimeoutResolve(null, 1000)
      }
    })
    comp1.flag = 123
    const onCreated3 = function () {
      onCreated(function () {
        //
      })
    }
    const onCreated4 = function () {
      onCreated(onCreated3)
      return setTimeoutResolve(null, 999)
    }
    Ecomponent({
      created() {
        onCreated(onCreated4)
        return setTimeoutResolve(null, 999)
      }
    })
    return new Promise(r => {
      comp1.$once('created:resolve', () => {
        expect(res).toEqual(123)
        r()
      })
    })
  })

  test('生命周期应该按照顺序执行: 初始化 - 同步情况', done => {
    // 生命周期执行顺序
    // 初始化
    // ⬇️ onLaunch App
    // ⬇️ onShow App
    // App的onShow，应该在App onLaunch执行完成之后执行

    // ⬇️ created Comp
    // Component的created，应该在App onShow执行完成之后执行

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

    const queue: any[] = []
    const genFn = (names: string[]) =>
      names.reduce(
        (res, name) => ((res[name] = () => queue.push(name)), res),
        {} as any
      )
    const app = Eapp(genFn(['onLaunch', 'onShow']))
    const page = Epage(genFn(['onLoad', 'onShow', 'onReady']))
    const comp = Ecomponent(genFn(['created', 'attached', 'ready']))
    comp.$once('ready:resolve', () => {
      expect(queue).toEqual([
        'onLaunch',
        'onShow',
        'onLoad',
        'created',
        'onShow',
        'onReady',
        'attached',
        'ready'
      ])
      done()
    })
  })

  test('生命周期应该按照顺序执行: 切后台 - 同步情况', done => {
    // 生命周期执行顺序
    // 切后台
    // ⬇️ onHide Page
    // ⬇️ onHide App
    // App的onHide，应该在Page onHide执行完成之后执行

    const queue: any[] = []
    const genFn = (names: string[]) => ({
      [names[0]]: () => queue.push(names[1])
    })
    const app = Eapp(genFn(['onHide', 'onHide:app']))
    const page = Epage(genFn(['onHide', 'onHide:page']))
    app.$once('onHide:resolve', () => {
      expect(queue).toEqual(['onHide:page', 'onHide:app'])
      done()
    })
  })

  test('生命周期应该按照顺序执行: 切前台 - 同步情况', done => {
    // 生命周期执行顺序
    // 切前台
    // ⬇️ onShow App
    // ⬇️ onShow Page
    // Page的onShow  应该在App onShow执行完成之后执行

    const queue: any[] = []
    const genFn = (names: string[]) => ({
      [names[0]]: () => queue.push(names[1])
    })
    const app = Eapp(genFn(['onShow', 'onShow:app']))
    const page = Epage(genFn(['onShow', 'onShow:page']))
    page.$once('onShow:resolve', () => {
      expect(queue).toEqual(['onShow:app', 'onShow:page'])
      done()
    })
  })

  test('生命周期应该按照顺序执行: 初始化 - 异步情况', done => {
    // 生命周期执行顺序
    // 初始化
    // ⬇️ onLaunch App
    // ⬇️ onShow App
    // App的onShow，应该在App onLaunch执行完成之后执行

    // ⬇️ created Comp
    // Component的created，应该在App onShow执行完成之后执行

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

    const queue: any[] = []
    let ms = 100
    const setTimeoutResolveFn = (fn: any) => {
      return new Promise(r => {
        setTimeout(() => {
          fn()
          r()
        }, (ms = ms - 10))
      })
    }
    const genFn = (names: string[]) =>
      names.reduce(
        (res, name) => (
          (res[name] = () => setTimeoutResolveFn(() => queue.push(name))), res
        ),
        {} as any
      )
    const app = Eapp(genFn(['onLaunch', 'onShow']))
    const page = Epage(genFn(['onLoad', 'onShow', 'onReady']))
    const comp = Ecomponent(genFn(['created', 'attached', 'ready']))

    let r1: any, r2: any
    const p1 = new Promise(r => (r1 = r))
    const p2 = new Promise(r => (r2 = r))
    page.$once('onReady:resolve', r1)
    comp.$once('ready:resolve', r2)
    Promise.all([p1, p2]).then(() => {
      expect(queue).toEqual([
        'onLaunch',
        'onShow',
        'created',
        'onLoad',
        'onShow',
        'attached',
        'ready',
        'onReady'
      ])
      done()
    })
  })

  test('生命周期应该按照顺序执行: 切后台 - 异步情况', done => {
    // 生命周期执行顺序
    // 切后台
    // ⬇️ onHide Page
    // ⬇️ onHide App
    // App的onHide，应该在Page onHide执行完成之后执行

    const queue: any[] = []
    let ms = 100
    const setTimeoutResolveFn = (fn: any) => {
      return new Promise(r => {
        setTimeout(() => {
          fn()
          r()
        }, (ms = ms - 50))
      })
    }
    const genFn = (names: string[]) => ({
      [names[0]]: () => setTimeoutResolveFn(() => queue.push(names[1]))
    })
    const app = Eapp(genFn(['onHide', 'onHide:app']))
    const page = Epage(genFn(['onHide', 'onHide:page']))
    app.$once('onHide:resolve', () => {
      expect(queue).toEqual(['onHide:page', 'onHide:app'])
      done()
    })
  })

  test('生命周期应该按照顺序执行: 切前台 - 异步情况', done => {
    // 生命周期执行顺序
    // 切前台
    // ⬇️ onShow App
    // ⬇️ onShow Page
    // Page的onShow  应该在App onShow执行完成之后执行

    const queue: any[] = []
    let ms = 100
    const setTimeoutResolveFn = (fn: any) => {
      return new Promise(r => {
        setTimeout(() => {
          fn()
          r()
        }, (ms = ms - 50))
      })
    }
    const genFn = (names: string[]) => ({
      [names[0]]: () => setTimeoutResolveFn(() => queue.push(names[1]))
    })
    const app = Eapp(genFn(['onShow', 'onShow:app']))
    const page = Epage(genFn(['onShow', 'onShow:page']))
    page.$once('onShow:resolve', () => {
      expect(queue).toEqual(['onShow:app', 'onShow:page'])
      done()
    })
  })
})
