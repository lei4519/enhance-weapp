import { isFunction } from './util'

// 异步队列
const setDataQueue: LooseFunction[] = []
let isFlushing = false
export let setDataRunning = false
export function setData(
  ctx: PageInstance | ComponentInstance,
  fn: LooseFunction
) {
  queueSetDataJob(ctx, fn)
}

export function queueSetDataJob(
  ctx: PageInstance | ComponentInstance,
  job: LooseFunction
) {
  if (!setDataQueue.includes(job)) {
    setDataQueue.push(job)
    queueSetDataFlush(ctx)
  }
}

function queueSetDataFlush(ctx: PageInstance | ComponentInstance) {
  if (!isFlushing) {
    isFlushing = true
    Promise.resolve().then(() => flushSetDataJobs(ctx))
  }
}

function flushSetDataJobs(ctx: PageInstance | ComponentInstance) {
  isFlushing = false
  const res: LooseObject = {}
  while (setDataQueue.length) {
    let obj: any
    if ((obj = setDataQueue.shift()!()) && obj.path) {
      const { path, value = null } = obj
      res[path] = value
    }
  }
  if (Object.keys(res).length === 0) return
  console.log('响应式触发this.setDat，参数: ', res)
  setDataRunning = true
  ctx.setData(res, () => {
    setDataRunning = false
    ctx.$emit('setDataRender:done')
  })
}

export function setDataNextTick(
  this: PageInstance | ComponentInstance,
  cb?: LooseFunction
) {
  let resolve: LooseFunction
  let promise = new Promise(r => (resolve = r))
  this.$once('setDataRender:done', resolve!)
  if (isFunction(cb)) {
    promise = promise.then(cb)
  }
  return promise!
}
