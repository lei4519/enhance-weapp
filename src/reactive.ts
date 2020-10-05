import {
  cloneDeep,
  cloneDeepRawData,
  disabledEnumerable,
  isFunction,
  isObject
} from './util'
import { reactive } from '@vue/reactivity'
import { setDataQueueJob } from './setDataEffect'
import { watch } from '@vue/runtime-core'

export function handlerSetup(
  ctx: EnhanceRuntime,
  options: LooseObject,
  type: DecoratorType
) {
  // 解除与ctx.data的引用关系，创建响应式data$
  ctx.data$ = reactive(cloneDeep(ctx.data))
  // 初始化属性，判断数据是否正在被watch
  disabledEnumerable(ctx, '__watching__', false)
  // 执行setup
  const setupData = ctx.setup(options)
  if (isObject(setupData)) {
    if (type === 'component' && !ctx.methods) ctx.methods = {}
    Object.keys(setupData).forEach(key => {
      const val = setupData[key]
      if (isFunction(val)) {
        ;(type === 'page' ? ctx : ctx.methods)[key] = val
      } else {
        ctx.data$[key] = val
      }
    })
    // 将setup返回的值同步至ctx.data
    ctx.data = cloneDeepRawData(ctx.data$)
    // 同步合并后的值到渲染层
    if (type === 'page') {
      ctx.setData(ctx.data)
    } else {
      // 组件的setData在attached时才可以用
      // 保证于其他钩子执行前执行
      ctx.__hooks__.attached.unshift(function initComponentSetData() {
        ctx.setData(ctx.data)
      })
      // 推出setData，只执行一次
      ctx.$once('attached:finally', () => {
        if (ctx.__hooks__.attached?.[0]?.name === 'initComponentSetData') {
          ctx.__hooks__.attached.shift()
        }
      })
    }
  }
  const watching = createWatching(ctx)
  const stopWatching = createStopWatching(ctx)
  if (type === 'page') {
    // 页面在onLoad/onShow中watch
    // 响应式监听要先于其他函数前执行
    ctx.__hooks__.onLoad.unshift(watching)
    ctx.__hooks__.onShow.unshift(watching)
    // onHide/unLoad结束，取消监听
    ctx.$on('onHide:finally', stopWatching)
    ctx.$on('onUnLoad:finally', stopWatching)
  } else {
    // 组件在attached/onShow中watch
    // 响应式监听要先于其他函数前执行
    ctx.__hooks__.attached.unshift(watching)
    ctx.__hooks__.show.unshift(watching)
    // detached/onHide 中移除watch
    ctx.$on('hide:finally', stopWatching)
    ctx.$on('detached:finally', stopWatching)
  }
  return setupData
}

function createWatching(ctx: EnhanceRuntime) {
  return () => {
    // 如果已经被监控了，就直接退出
    if (ctx.__watching__) return
    ctx.__watching__ = true
    // 保留取消监听的函数
    ctx.__stopWatching__ = watch(ctx.data$, () => {
      setDataQueueJob(ctx)
    })
  }
}

function createStopWatching(ctx: EnhanceRuntime) {
  return () => {
    // 如果已经取消监听了，就直接退出
    if (!ctx.__watching__) return
    ctx.__watching__ = false
    // 执行取消监听
    ctx.__stopWatching__?.()
  }
}
