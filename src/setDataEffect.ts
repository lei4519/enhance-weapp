import { isFunction } from './util'
import { diffData } from '@/diffData'
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
    if (!res) return
    console.log('响应式触发this.setData，参数: ', res)
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
