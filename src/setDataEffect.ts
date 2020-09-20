import { isFunction } from './util'

// 异步队列
const queue: LooseFunction[] = []
let isFlushing = false
export let setDataRunning = false
export function setData(
  ctx: PageInstance | ComponentInstance,
  fn: LooseFunction
) {
  queueJob(ctx, fn)
}

export function queueJob(
  ctx: PageInstance | ComponentInstance,
  job: LooseFunction
) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush(ctx)
  }
}

function queueFlush(ctx: PageInstance | ComponentInstance) {
  if (!isFlushing) {
    isFlushing = true
    Promise.resolve().then(() => flushJobs(ctx))
  }
}

function flushJobs(ctx: PageInstance | ComponentInstance) {
  isFlushing = false
  let res: LooseObject = {}
  while (queue.length) {
    let obj: any
    if ((obj = queue.shift()!()) && obj.path) {
      const { path, value = null } = obj
      res[path] = value
    }
  }
  if (Object.keys(res).length === 0) return
  console.log(res)
  setDataRunning = true
  ctx.setData(res, () => {
    setDataRunning = false
    ctx.$emit('setDataRender:done')
  })
}

export function nextTick(
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
