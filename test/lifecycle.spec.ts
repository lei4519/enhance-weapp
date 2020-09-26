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

  test('选项中定义的生命周期，最后执行', () => {
    const queue: number[] = []
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
    expect(queue).toEqual([1, 2, 3, 4])
  })

  test('Page 生命周期onShow、onReady，应该在onLoad执行完成之后才执行: 同步情况', done => {
    const queue: number[] = []
    const page = Epage({
      onLoad: [() => queue.push(1)],
      onShow: [() => queue.push(2)],
      onReady: [() => queue.push(3)]
    })
    page.$once('onReady:resolve', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('Page 生命周期onShow、onReady，应该在onLoad执行完成之后才执行: 异步情况', done => {
    const setTimeoutResolve = (time: number) =>
      new Promise(resolve => setTimeout(resolve, time))
    const queue: number[] = []
    const page = Epage({
      onLoad: [
        () => setTimeoutResolve(500),
        () => setTimeoutResolve(500),
        () => setTimeoutResolve(500),
        () => queue.push(1)
      ],
      onShow: [() => queue.push(2)],
      onReady: [() => queue.push(3)]
    })
    page.$once('onReady:resolve', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成', () => {
    const onLoad = jest.fn()
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
})
