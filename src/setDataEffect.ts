import { cloneDeep, isFunction, parsePath } from './util'
import { diffData } from './diffData'
import { EnhanceRuntime, LooseFunction, LooseObject } from '../types'
import { stopWatching, watching } from './reactive'
import { getCurrentCtx } from './createPushHooks'
// 需要更新的异步队列
const setDataCtxQueue: Set<EnhanceRuntime> = new Set()
// 是否注册了异步任务
let isFlushing = false

export function setDataQueueJob(ctx: EnhanceRuntime) {
  if (!setDataCtxQueue.has(ctx)) {
    setDataCtxQueue.add(ctx)
    setDataQueueFlush()
  }
}

function setDataQueueFlush() {
  if (!isFlushing) {
    isFlushing = true
    Promise.resolve().then(flushSetDataJobs)
  }
}

function flushSetDataJobs() {
  setDataCtxQueue.forEach(updateData)
  setDataCtxQueue.clear()
  isFlushing = false
}
export function updateData(ctx: EnhanceRuntime) {
  const res = diffData(ctx.__oldData__, ctx.data$)
  if (!res) return ctx.$emit('setDataRender:resolve')
  // console.log('响应式触发this.setData，参数: ', res)
  ctx.setData(
    res,
    () => {
      ctx.$emit('setDataRender:resolve')
    },
    false
  )
  // 对于新增的值，重新监听
  stopWatching.call(ctx)
  watching.call(ctx)
  ctx.__oldData__ = cloneDeep(ctx.data)
}
export function setData(
  this: EnhanceRuntime,
  rawSetData: LooseFunction,
  data: LooseObject,
  cb: LooseFunction,
  isUserInvoke = true
) {
  if (isUserInvoke) {
    // 如果在这里停止监听，会导致setData和data$同时使用时，data$的响应式变化无效
    // stopWatching.call(this)
    // 同步 data$ 值
    try {
      Object.entries(data).forEach(([paths, value]) => {
        const [obj, key] = parsePath(this.data$, paths)
        obj[key] = value
      })
    } catch (err) {
      console.error('同步this.data$失败：', err)
    }
  }
  rawSetData.call(this, data, cb)
  this.__oldData__ = cloneDeep(this.data)
  if (isUserInvoke) {
    // watching.call(this)
  }
}

export function setDataNextTick(cb?: LooseFunction) {
  const ctx = getCurrentCtx()
  if (!ctx) return console.warn('未找到当前运行中的实例，请不要在setup执行堆栈外使用 nextTick')
  let resolve: any
  let promise = new Promise(r => (resolve = r))
  ctx.$once('setDataRender:resolve', resolve!)
  if (isFunction(cb)) {
    promise = promise.then(cb)
  }
  return promise!
}
