import { disableEnumerable, isObject, noop, transformOnName } from '@/util'
import { initEvents } from './events'

const lc = {
  page: [
    'onLoad',
    'onShow',
    'onReady',
    'onHide',
    'onUnload',
    'onPullDownRefresh',
    'onReachBottom',
    'onShareAppMessage',
    'onPageScroll',
    'onTabItemTap',
    'onResize',
    'onAddToFavorites'
  ] as Array<PageLifeTime>,
  component: [
    'created',
    'attached',
    'ready',
    'moved',
    'detached',
    'error'
  ] as Array<ComponentLifeTime>
}

export function decoratorLifeCycle(
  options: PageOptions | ComponentOptions,
  type: DecoratorType = 'page'
) {
  // 循环所有lifeCycle 进行装饰
  lc[type].forEach((name: PageLifeTime | ComponentLifeTime) => {
    // 处理component lifetimes
    if (type === 'component' && !isObject(options.lifetimes)) {
      options.lifetimes = {}
    }
    // 保留原函数
    let hook: HookFn
    if (type === 'page') {
      hook = options[name]
    } else {
      hook = options.lifetimes[name] || options[name]
    }
    const opt = type === 'page' ? options : options.lifetimes
    opt[name] = function (options: PageOptions | ComponentOptions) {
      const ctx = this
      if (name === 'onLoad' || name === 'created') {
        // 初始化事件通信
        initEvents(ctx)
        // 初始化 hook
        initHooks(type, ctx)
        // setup
      }
      // 将原函数放入队尾
      if (hook) {
        // 全局保存this，执行生命周期期间可以新增生命周期钩子
        setCurrentCtx(ctx)
        if (type === 'page') {
          pagePushHooks[name as PageLifeTime](hook)
        } else {
          const onName = transformOnName(name)
          componentPushHooks[onName as ComponentHooksName](hook)
        }
        setCurrentCtx(null)
      }
      callHooks(name, options, ctx).then(() => {
        ctx.$emit(`${name}:done`)
      })
    }
  })
}

let currentCtx: PageInstance | ComponentInstance | null = null
function setCurrentCtx(ctx: PageInstance | ComponentInstance | null) {
  currentCtx = ctx
}
function initHooks(type: DecoratorType, ctx: PageInstance | ComponentInstance) {
  ctx.__hooks__ = {} as any

  disableEnumerable(ctx, ['__hooks__'])

  lc[type].forEach((name: PageLifeTime | ComponentLifeTime) => {
    ctx.__hooks__[name] = []
  })
}

function callHooks(
  name: PageLifeTime | ComponentLifeTime,
  options: LooseObject,
  ctx: PageInstance | ComponentInstance,
  startIdx: number = 0
) {
  let promise = Promise.resolve<LooseObject | undefined>(options)
  const callbacks = ctx.__hooks__[name]
  const len = callbacks.length
  if (len) {
    for (let i = startIdx; i < len; i++) {
      // 异步微任务执行
      promise = promise.then(result => {
        // 每次执行前将当前的ctx推入全局
        // 以此保证多个实例在异步穿插运行时的使用onXXX动态添加的生命周期函数指向正确
        setCurrentCtx(ctx)
        const res = callbacks[i].call(ctx, result)
        setCurrentCtx(null)
        return res
      })
    }
    // 运行期间可以动态添加生命周期, 运行链结束检查是否有新增的
    promise = promise.then(() => {
      const nowLen = ctx.__hooks__[name].length
      if (nowLen > len) {
        // 此次产生的微任务会在当前宏任务的微任务队尾中
        // 所以如果想要保证生命周期已经全部执行完成 要使用setTimeout在下一宏任务访问
        return callHooks(name, options, ctx, len)
      }
    })
  }
  return promise
}

function genPushHooks(name: PageLifeTime | ComponentLifeTime) {
  return function pushHooks(cb: HookFn) {
    currentCtx && currentCtx.__hooks__[name].push(cb)
  }
}

const pagePushHooks = lc.page.reduce((res, name) => {
  res[name] = genPushHooks(name)
  return res
}, {} as { [P in PageLifeTime]: Function })

export const onLoad = pagePushHooks.onLoad
export const onShow = pagePushHooks.onShow
export const onReady = pagePushHooks.onReady
export const onHide = pagePushHooks.onHide
export const onUnload = pagePushHooks.onUnload
export const onPullDownRefresh = pagePushHooks.onPullDownRefresh
export const onReachBottom = pagePushHooks.onReachBottom
export const onShareAppMessage = pagePushHooks.onShareAppMessage
export const onPageScroll = pagePushHooks.onPageScroll
export const onTabItemTap = pagePushHooks.onTabItemTap
export const onResize = pagePushHooks.onResize
export const onAddToFavorites = pagePushHooks.onAddToFavorites

const componentPushHooks = lc.component.reduce((res, name: string) => {
  // created => onCreated | ready => onReady
  const onName = transformOnName(name)
  res[onName as ComponentHooksName] = genPushHooks(name as ComponentLifeTime)
  return res
}, {} as { [P in ComponentHooksName]: Function })

export const onCreated = componentPushHooks.onCreated
export const onAttached = componentPushHooks.onAttached
export const onComponentReady = componentPushHooks.onReady
export const onMoved = componentPushHooks.onMoved
export const onDetached = componentPushHooks.onDetached
export const onError = componentPushHooks.onError
