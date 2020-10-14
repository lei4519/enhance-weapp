import { isFunction } from './util'
import { diffData } from '@/diffData'
import { EnhanceRuntime, LooseFunction, LooseObject } from '../types'
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
  setDataCtxQueue.forEach(ctx => {
    const res = diffData(ctx.data, ctx.data$)
    if (!res) return ctx.$emit('setDataRender:resolve')
    // console.log('响应式触发this.setData，参数: ', res)
    syncOldData(ctx.data, res!)
    ctx.setData(res, () => {
      ctx.$emit('setDataRender:resolve')
    })
  })
  setDataCtxQueue.clear()
  isFlushing = false
}

export function setDataNextTick(this: EnhanceRuntime, cb?: LooseFunction) {
  let resolve: any
  let promise = new Promise(r => (resolve = r))
  this.$once('setDataRender:resolve', resolve!)
  if (isFunction(cb)) {
    promise = promise.then(cb)
  }
  return promise!
}

/**
 * @description 同步更新旧数据，用于下次数据对比
 */
function syncOldData(data: LooseObject, updateData: LooseObject) {
  Object.entries(updateData).forEach(([paths, value]) => {
    const pathsArr = paths.replace(/(\[(\d+)\])/g, '.$2').split('.')
    const key = pathsArr.pop()!
    let obj = data
    while (pathsArr.length) {
      /* istanbul ignore next */
      obj = obj[pathsArr.shift()!]
    }
    obj[key] = value
  })
}
