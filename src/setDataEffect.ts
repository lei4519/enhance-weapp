import { isFunction } from './util'
type Ctx = PageInstance | ComponentInstance
// 异步队列
const setDataQueue: LooseFunction[] = []
let isFlushing = false
export function setData(ctx: Ctx, fn: LooseFunction): void {
  queueSetDataJob(ctx, fn)
}

export function queueSetDataJob(ctx: Ctx, job: LooseFunction) {
  if (!setDataQueue.includes(job)) {
    setDataQueue.push(job)
    queueSetDataFlush(ctx)
  }
}

function queueSetDataFlush(ctx: Ctx) {
  if (!isFlushing) {
    isFlushing = true
    Promise.resolve().then(() => flushSetDataJobs(ctx))
  }
}

function flushSetDataJobs(ctx: Ctx) {
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
  ctx.setData(res, () => {
    ctx.$emit('setDataRender:done')
  })
}

export function setDataNextTick(this: Ctx, cb?: LooseFunction) {
  let resolve: any
  let promise = new Promise(r => (resolve = r))
  this.$once('setDataRender:done', resolve!)
  if (isFunction(cb)) {
    promise = promise.then(cb)
  }
  return promise!
}
