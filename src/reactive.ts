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
        ctx.data[key] = isRef(val) ? unref(val) : toRaw(val)
      }
    })
  }
  // 同步合并后的值到渲染层
  ctx.setData(ctx.data)
  ctx.data$ = reactive(ctx.data$)
  let keyPath = ''
  // TODO vue issue
  onGetterChange((target: LooseObject, key: string, receiver: any) => {
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
