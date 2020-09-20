import { isFunction } from './util'
import {
  reactive,
  onGetterChange,
  onSetterChange,
  isRef,
  toRaw,
  unref
} from '../fork/fork-reactive.js'
import { isSymbol } from '@vue/shared'
import { setData, setDataRunning } from './setDataEffect'
export function handlerSetup(
  ctx: PageInstance | ComponentInstance,
  options: LooseObject,
  type: DecoratorType
) {
  if (isFunction(ctx.setup)) {
    const setupData = ctx.setup(options) || {}
    if (!ctx.data) ctx.data = {}
    if (type === 'component' && !ctx.methods) ctx.methods = {}
    Object.entries(setupData).forEach(([key, val]) => {
      if (isFunction(val)) {
        ;(type === 'page' ? ctx : ctx.methods)[key] = val
      } else {
        ctx.data[key] = val
      }
    })
  }

  ctx.data = reactive(ctx.data)
  let keyPath = ''
  onGetterChange((target: LooseObject, key: string, receiver: any) => {
    if (setDataRunning) return
    // 访问原型方法
    if (Object.getPrototypeOf(target)[key]) return
    if (isSymbol(key)) return
    if (receiver === ctx.data) {
      keyPath = `data.${key}`
    } else {
      keyPath = `${keyPath}.${key}`
    }
  })
  onSetterChange(function (target: any, key: string, val: any) {
    if (setDataRunning) return
    if (key === 'length') return
    const path = `${keyPath}.${key}`.replace(
      /(^data\.)|(\.length)|(__v_.*?\.)/g,
      ''
    )
    const value = isRef(val) ? unref(val) : toRaw(val)
    console.log('keyPath: ', path, ' value: ', value)
    setData(ctx, () => ({ path, value }))
    keyPath = 'data'
  })
}
