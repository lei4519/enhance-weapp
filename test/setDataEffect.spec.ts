import { Epage } from '@/Epage'
import { handlerSetup } from '@/reactive'
import { nextTick, setData } from '@/setDataEffect'
import { readonly, reactive, ref } from '../fork/fork-reactive.js'
describe('setData', () => {
  // test('setData下一微任务执行', done => {
  //   const fn1 = jest.fn()
  //   const fn2 = jest.fn()
  //   const fn3 = jest.fn()
  //   setData({ setData() {} } as any, fn1)
  //   setData({ setData() {} } as any, fn2)
  //   setData({ setData() {} } as any, fn3)
  //   expect(fn1.mock.calls.length).toBe(0)
  //   expect(fn2.mock.calls.length).toBe(0)
  //   expect(fn3.mock.calls.length).toBe(0)
  //   Promise.resolve().then(() => {
  //     expect(fn1.mock.calls.length).toBe(1)
  //     expect(fn2.mock.calls.length).toBe(1)
  //     expect(fn3.mock.calls.length).toBe(1)
  //     done()
  //   })
  // })
  // test('nextTick传入函数', done => {
  //   const fn = jest.fn()
  //   const page = Epage({})
  //   page.data.a = 1
  //   page.$nextTick(fn)
  //   page.$nextTick(() => {
  //     expect(fn.mock.calls.length).toBe(1)
  //     done()
  //   })
  //   expect(fn.mock.calls.length).toBe(0)
  // })
  // test('nextTick Promise', done => {
  //   const fn = jest.fn()
  //   const page = Epage({})
  //   page.data.a = 1
  //   page.$nextTick().then(() => {
  //     fn()
  //   })
  //   page.$nextTick().then(() => {
  //     expect(fn.mock.calls.length).toBe(1)
  //     done()
  //   })
  //   expect(fn.mock.calls.length).toBe(0)
  // })
  // test('nextTick Promise和函数同时使用，可以顺序执行', done => {
  //   const fn = jest.fn()
  //   const page = Epage({})
  //   page.data.a = 1
  //   page.$nextTick().then(() => {
  //     fn()
  //   })
  //   page.$nextTick(() => {
  //     expect(fn.mock.calls.length).toBe(1)
  //     done()
  //   })
  //   expect(fn.mock.calls.length).toBe(0)
  // })
  // test('data', () => {
  //   const page: any = {
  //     data: {
  //       d: 1
  //     },
  //     setup() {
  //       let a = ref(1)
  //       let e = reactive({
  //         f: [
  //           {
  //             g: 1
  //           }
  //         ]
  //       })
  //       const c = readonly({})
  //       return {
  //         a,
  //         b: {},
  //         c,
  //         e
  //       }
  //     }
  //   }
  //   handlerSetup(page, {}, 'page')
  //   page.data.e.f.push(3)
  //   page.data.e.f[0].g = 2
  //   page.data.a = 2
  //   page.data.d = 4
  //   page.data.o = ref(4)
  //   page.data.d = reactive({})
  // })
})
