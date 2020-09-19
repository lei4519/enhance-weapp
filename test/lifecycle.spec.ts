import { Epage } from '@/Epage'
import { Ecomponent } from '@/Ecomponent'
import { onLoad, onCreated } from '@/lifecycle'
import { setTimeoutResolve } from '@/util'
describe('装饰生命周期函数', () => {
  test('__hooks__属性不可遍历', () => {
    const pageOptions = {}
    Epage(pageOptions)
    expect(Object.keys(pageOptions).findIndex(k => k === '__hooks__')).toBe(-1)
  })

  test('Page装饰后生命周期函数不再是之前的函数', () => {
    const onLoad = () => {}
    const onShow = () => {}
    const pageOptions = {
      onLoad,
      onShow
    }
    Epage(pageOptions)
    expect(pageOptions.onLoad).not.toEqual(onLoad)
    expect(pageOptions.onShow).not.toEqual(onShow)
  })

  test('Component装饰后的函数应该在lifetimes上', () => {
    const created = () => {}
    const attached = () => {}
    const componentOptions: any = {
      created,
      attached
    }
    Ecomponent(componentOptions)
    expect(componentOptions.lifetimes.created).toBeTruthy()
    expect(componentOptions.lifetimes.attached).toBeTruthy()
    expect(componentOptions.lifetimes.created).not.toEqual(created)
    expect(componentOptions.lifetimes.attached).not.toEqual(attached)
  })

  test('装饰后选项上的生命周期函数可以是数组', done => {
    const onLoad1 = jest.fn()
    const onLoad2 = jest.fn()
    const onLoad3 = jest.fn()
    const onLoad4 = jest.fn()
    const pageOptions: any = {
      onLoad: [onLoad1, onLoad2, onLoad3, onLoad4]
    }
    const page: any = Epage(pageOptions)
    page.$once('onLoad:done', () => {
      expect(onLoad1.mock.calls.length).toBe(1)
      expect(onLoad2.mock.calls.length).toBe(1)
      expect(onLoad3.mock.calls.length).toBe(1)
      expect(onLoad4.mock.calls.length).toBe(1)
      done()
    })
  })

  test('装饰后生命周期可以正常执行, 并通过监听xxx:done来判断执行完成', () => {
    const onLoad = jest.fn()
    const page: any = Epage({
      onLoad
    })
    const pageDone = () => {
      return new Promise(r => {
        page.$once('onLoad:done', r)
      })
    }
    const created = jest.fn()
    const comp: any = Ecomponent({
      created
    })
    const compDone = () => {
      return new Promise(r => {
        comp.$once('created:done', r)
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
    const page: any = Epage({
      onLoad() {
        onLoad(onLoad1)
      }
    })
    page.$once('onLoad:done', () => {
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
    const page: any = Epage({
      onLoad() {
        onLoad(onLoad1)
        onLoad(onLoad2)
        onLoad(onLoad3)
      }
    })
    page.$once('onLoad:done', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('使用onX添加的生命周期函数, 返回Promise，会阻塞后续代码执行', done => {
    const queue: number[] = []
    const onLoad1 = function () {
      return new Promise(r => {
        queue.push(1)
        setTimeout(() => r(2), 1000)
      })
    }
    const onLoad2 = function (i: number) {
      return new Promise(r => {
        queue.push(i)
        setTimeout(() => r(3), 1000)
      })
    }
    const onLoad3 = function (i: number) {
      return new Promise(r => {
        setTimeout(() => {
          queue.push(i)
          r()
        }, 1000)
      })
    }
    const page: any = Epage({
      onLoad() {
        onLoad(onLoad1)
        onLoad(onLoad2)
        onLoad(onLoad3)
      }
    })
    page.$once('onLoad:done', () => {
      expect(queue).toEqual([1, 2, 3])
      done()
    })
  })

  test('多个实例生命周期异步穿插运行，动态添加的钩子可以正确指向对应实例', () => {
    let res: any = null
    const onCreated1 = function (this: any) {
      res = this.flag
    }
    const onCreated2 = function () {
      onCreated(onCreated1)
      return setTimeoutResolve(null, 1000)
    }
    const comp1: any = Ecomponent({
      created() {
        onCreated(onCreated2)
        return setTimeoutResolve(null, 1000)
      }
    })
    comp1.flag = 123
    const onCreated3 = function (this: any) {
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
      comp1.$once('created:done', () => {
        expect(res).toEqual(123)
        r()
      })
    })
  })
})
