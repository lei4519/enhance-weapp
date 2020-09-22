import { isFunction } from './util'
import { reactive, isRef, toRaw, unref } from '../fork/@vue-reactivity'
import { setData } from './setDataEffect'
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
        ctx.data[key] = isRef(val) ? unref(val) : toRaw(val)
      }
    })
  }
  // 同步合并后的值到渲染层
  ctx.setData(ctx.data)
  ctx.data$ = reactive(ctx.data$)
  watch(ctx.data$, (data: any) => {
    // TODO: 数据diff
    const newData = JSON.parse(JSON.stringify(data))
    Object.keys(newData).forEach(key => {
      setData(ctx, () => ({ path: key, value: newData[key] }))
    })
  })
}
