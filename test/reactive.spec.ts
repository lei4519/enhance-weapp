import {
  isReactive,
  isReadonly,
  reactive,
  readonly,
  ref
} from '../fork/@vue-reactivity.js'
import { Epage } from '@/Epage'
import { Ecomponent } from '@/Ecomponent'

describe('响应式处理', () => {
  test('setup返回值，函数绑定至this(methods)上，其他值绑定到data上', () => {
    const fn = function () {
      //
    }
    const page: any = Epage({
      setup() {
        return {
          a: 1,
          b: {},
          c: fn
        }
      }
    })
    expect(page.data.a).toBe(1)
    expect(page.data.b).toEqual({})
    expect(page.c).toBe(fn)
    const comp: any = Ecomponent({
      setup() {
        return {
          a: 1,
          b: {},
          c: fn
        }
      }
    })
    expect(comp.data.a).toBe(1)
    expect(comp.data.b).toEqual({})
    expect(comp.methods.c).toBe(fn)
  })
  test('命名冲突时，setup返回值覆盖data值', () => {
    const fn = function () {
      //
    }
    const page: any = Epage({
      data: {
        a: 1
      },
      setup() {
        return {
          a: 2
        }
      }
    })
    expect(page.data.a).toBe(2)
  })
  test('setup返回值合并时，合并给data的是普通值，合并给data$的是响应式值', () => {
    const page: any = Epage({
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
    })
    expect(isReactive(page.data)).toBeFalsy()
    expect(isReactive(page.data.b)).toBeFalsy()
    expect(isReadonly(page.data.c)).toBeFalsy()
    expect(isReactive(page.data.e)).toBeFalsy()

    expect(isReactive(page.data$)).toBeTruthy()
    expect(isReactive(page.data$.b)).toBeTruthy()
    expect(isReadonly(page.data$.c)).toBeTruthy()
    expect(isReactive(page.data$.e)).toBeTruthy()
  })

  test('data值会复制给data$, 但是两者引用并不相等', () => {
    const page: any = Epage({
      data: {
        e: {}
      }
    })
    expect(page.data !== page.data$).toBeTruthy()
    expect(page.data.e !== page.data$.e).toBeTruthy()
  })
  test('ref值修改会同步至data和data$', done => {
    let a: any
    const page: any = Epage({
      setup() {
        a = ref(1)
        return {
          a
        }
      }
    })
    a.value = 2
    page.$nextTick().then(() => {
      expect(page.data.a).toBe(2)
      expect(page.data$.a).toBe(2)
      done()
    })
  })
  test('reactive值修改会同步至data和data$', done => {
    let a: any
    const page: any = Epage({
      setup() {
        a = reactive({
          b: 1
        })
        return {
          a
        }
      }
    })
    a.b = 2
    done()
    // page.$nextTick().then(() => {
    //   expect(page.data.a.b).toBe(2)
    //   expect(page.data$.a.b).toBe(2)
    //   done()
    // })
  })
  test('reactive数组值通过方法修改会同步至data和data$', () => {})
  test('初始的data$值修改会同步至至data', () => {})
  test('setup返回的与data$值修改会同步至至data', () => {})
})
