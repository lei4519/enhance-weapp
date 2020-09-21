import { isFunction } from './util'
import {
  reactive,
  onGetterChange,
  onSetterChange,
  isRef,
  toRaw,
  unref
} from '../fork/@vue-reactivity'
import { isSymbol } from '@vue/shared'
import { setData, setDataRunning } from './setDataEffect'
import { watch } from '../fork/@vue-runtime-core'
export function handlerSetup(
  ctx: PageInstance | ComponentInstance,
  options: LooseObject,
  type: DecoratorType
) {
  if (!ctx.data) ctx.data = {}
  ctx.data$ = JSON.parse(JSON.stringify(ctx.data))
  if (isFunction(ctx.setup)) {
    const setupData = ctx.setup(options) || {}
    if (type === 'component' && !ctx.methods) ctx.methods = {}
    Object.keys(setupData).forEach(key => {
      const val = setupData[key]
      if (isFunction(val)) {
        ;(type === 'page' ? ctx : ctx.methods)[key] = val
      } else {
        ctx.data$[key] = val
        const isRefVal = isRef(val)
        ctx.data[key] = isRefVal ? unref(val) : toRaw(val)
        if (isRefVal) {
          // 监听ref值变化
          // 直接修改ref值不会触发data$的getter函数
          // 一个ref定义之后只能当作reactive的值或者在setup中当作ref返回，不然他的响应式就没有意义
          // 所以只需要处理setup返回值中的ref数据
          watch(val, (value: any) => {
            setData(ctx, () => ({ path: key, value }))
          })
        }
      }
    })
  }
  // 同步合并后的值到渲染层
  ctx.setData(ctx.data)
  ctx.data$ = reactive(ctx.data$)
  // 记录getter路径
  let keyPath = ''
  // TODO vue issue
  onGetterChange((target: LooseObject, key: string, receiver: any) => {
    // setData执行过程中触发响应式不需要记录
    if (setDataRunning) return
    // 访问原型方法
    if (Object.getPrototypeOf(target)[key]) return
    if (isSymbol(key)) return
    if (receiver === ctx.data$) {
      keyPath = `data.${key}`
    } else {
      keyPath = `${keyPath}.${key}`
    }
  })
  // setter
  onSetterChange(function (target: any, key: string, val: any) {
    // setData执行过程中触发响应式不需要执行
    if (setDataRunning) return
    console.log(key)
    // if (key === 'length') return
    // const path = `${keyPath}.${key}`.replace(
    //   /(^data\.)|(\.length)|(__v_.*?\.)/g,
    //   ''
    // )
    // const value = isRef(val) ? unref(val) : toRaw(val)
    // console.log('setter触发：keyPath: ', path, ' value: ', value)
    // setData(ctx, () => ({ path, value }))
    // keyPath = 'data'
  })
}
