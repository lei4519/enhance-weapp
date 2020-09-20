import { handlerSetup } from '@/reactive'
import { isReactive, isReadonly, readonly, ref } from '../fork/@vue-reactivity'

describe('响应式处理', () => {
  // test('setup返回值，函数绑定至this(methods)上，其他值绑定到data上', () => {
  //   const fn = function () {}
  //   const page: any = {
  //     setup() {
  //       return {
  //         a: 1,
  //         b: {},
  //         c: fn
  //       }
  //     }
  //   }
  //   handlerSetup(page, {}, 'page')
  //   expect(page.data$.a).toBe(1)
  //   expect(page.data$.b).toEqual({})
  //   expect(page.c).toBe(fn)
  //   const comp: any = {
  //     setup() {
  //       return {
  //         a: 1,
  //         b: {},
  //         c: fn
  //       }
  //     }
  //   }
  //   handlerSetup(comp, {}, 'component')
  //   expect(comp.data$.a).toBe(1)
  //   expect(comp.data$.b).toEqual({})
  //   expect(comp.methods.c).toBe(fn)
  // })
  // test('命名冲突时，setup返回值覆盖data值', () => {
  //   const fn = function () {}
  //   const page: any = {
  //     data: {
  //       a: 1
  //     },
  //     setup() {
  //       return {
  //         a: 2
  //       }
  //     }
  //   }
  //   handlerSetup(page, {}, 'page')
  //   expect(page.data$.a).toBe(2)
  // })
  test('data值是响应式的, setup返回值也是', () => {
    const page: any = {
      data: {
        d: 1,
        e: {}
      },
      setup() {
        const a = ref(1)
        const c = readonly({})
        return {
          a,
          b: {},
          c
        }
      }
    }
    handlerSetup(page, {}, 'page')
    expect(isReactive(page.data$)).toBeTruthy()
    expect(isReactive(page.data$.b)).toBeTruthy()
    expect(isReadonly(page.data$.c)).toBeTruthy()
    expect(isReactive(page.data$.e)).toBeTruthy()
  })
})
