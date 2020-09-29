import { isFunction, isObject } from './util'
import { reactive, isRef, toRaw, unref } from '@vue/reactivity'
import { setData } from './setDataEffect'
import { watch } from '@vue/runtime-core'

export function handlerSetup(
  ctx: PageInstance | ComponentInstance,
  options: LooseObject,
  type: DecoratorType
) {
  if (!ctx.data) ctx.data = {}
  ctx.data$ = JSON.parse(JSON.stringify(ctx.data))
  const setupData = ctx.setup(options)
  if (isObject(setupData)) {
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
  if (type === 'page') {
    ctx.data$ = reactive(ctx.data$)
    ctx.setData(ctx.data)
  } else {
    // 组件的setData在attached时才可以用
    // 保证于其他钩子执行前执行
    ctx.__hooks__.attached.unshift(function initComponentSetData() {
      ctx.data$ = reactive(ctx.data$)
      ctx.setData(ctx.data)
    })
    // 推出setData，只执行一次
    const shift = () => {
      if (ctx.__hooks__.attached?.[0]?.name === 'initComponentSetData') {
        ctx.__hooks__.attached.shift()
      }
    }
    ctx.$once('attached:resolve', shift)
    ctx.$once('attached:reject', shift)
  }
  // TODO 页面在unLoad中移除watch
  // TODO 组件在detached 中移除watch attached时重新监听
  watch(ctx.data$, (data: any) => {
    // TODO: 数据diff
    const newData = JSON.parse(JSON.stringify(data))
    Object.keys(newData).forEach(key => {
      setData(ctx, () => ({ path: key, value: newData[key] }))
    })
  })
}
