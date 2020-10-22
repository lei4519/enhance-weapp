import {
  cloneDeep,
  disabledEnumerable,
  isFunction,
  isObject,
  isPrimitive
} from './util'
import {
  isReactive,
  isRef,
  reactive,
  toRaw,
  toRef,
  unref
} from '@vue/reactivity'
import { setDataQueueJob } from './setDataEffect'
import { watch } from '@vue/runtime-core'
import { EnhanceRuntime, LooseObject, DecoratorType } from '../types'

export function handlerSetup(
  ctx: EnhanceRuntime,
  options: LooseObject,
  type: DecoratorType
) {
  // 解除与ctx.data的引用关系，创建响应式data$
  !ctx.data && (ctx.data = {})
  ctx.data$ = reactive(cloneDeep(ctx.data))
  // 初始化属性，判断数据是否正在被watch
  disabledEnumerable(ctx, '__watching__', false)
  disabledEnumerable(ctx, '__stopWatchFn__', null)
  disabledEnumerable(ctx, '__oldData__', null)
  // 执行setup
  const setupData = ctx.setup.call(ctx, options)
  if (isObject(setupData)) {
    Object.keys(setupData).forEach(key => {
      const val = setupData[key]
      if (isFunction(setupData[key])) {
        ctx[key] = val
      } else {
        // 直接返回reactive值，需要将里面的属性继续ref化
        ctx.data$[key] =
        isReactive(val) || isRef(val)
            ? val
            : isPrimitive(val)
            ? toRef(setupData, key)
            : reactive(val)
        ctx.data[key] = isRef(val) ? unref(val) : toRaw(val)
      }
    })
    ctx.__oldData__ = cloneDeep(ctx.data)
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
        const delIdx = ctx.__hooks__.attached.findIndex(
          fn => fn.name === 'initComponentSetData'
        )
        ctx.__hooks__.attached.splice(delIdx, 1)
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
  return function watching() {
    // 如果已经被监控了，就直接退出
    if (ctx.__watching__) return
    ctx.__watching__ = true
    // 保留取消监听的函数
    ctx.__stopWatchFn__ = watch(ctx.data$, () => {
      setDataQueueJob(ctx)
    })
  }
}

function createStopWatching(ctx: EnhanceRuntime) {
  return function stopWatching() {
    // 如果已经取消监听了，就直接退出
    if (!ctx.__watching__) return
    ctx.__watching__ = false
    // 执行取消监听
    ctx.__stopWatchFn__()
  }
}
