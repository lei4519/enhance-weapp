import {
  disableEnumerable,
  isFunction,
  isObject,
  noop,
  transformOnName
} from '@/util'
import { initEvents } from './events'
import { handlerSetup } from './reactive'

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
    let hook: HookFn | HookFn[]
    if (type === 'page') {
      hook = options[name]
    } else {
      hook = options.lifetimes[name] || options[name]
    }
    const opt = type === 'page' ? options : options.lifetimes
    opt[name] = function (options: LooseObject) {
      const ctx = this
      if (name === 'onLoad' || name === 'created') {
        // 初始化事件通信
        initEvents(ctx)
        // 初始化 hooks
        initHooks(type, ctx)
        // 装饰 setData
        // 处理 setup
        handlerSetup(ctx, options, type)
      }

      if (hook) {
        // 兼容数组
        if (isFunction(hook)) hook = [hook as HookFn]
        if (Array.isArray(hook)) {
          setCurrentCtx(ctx)
          hook.forEach(fn => {
            if (isFunction(fn)) {
              // 在setup中添加的钩子应该于原函数之前执行
              // 将原函数放入队尾
              if (type === 'page') {
                pagePushHooks[name as PageLifeTime](fn)
              } else {
                const onName = transformOnName(name)
                componentPushHooks[onName as ComponentHooksName](fn)
              }
            }
          })
          setCurrentCtx(null)
        }
      }
      // 执行收集的钩子函数
      callHooks(name, options, ctx).then(() => {
        // 执行完成 触发事件
        ctx.$emit(`${name}:done`)
      })
    }
  })
}

// 全局保留上下文，添加钩子函数时需要用到
let currentCtx: PageInstance | ComponentInstance | null = null
function setCurrentCtx(ctx: PageInstance | ComponentInstance | null) {
  currentCtx = ctx
}

// 初始化钩子
function initHooks(type: DecoratorType, ctx: PageInstance | ComponentInstance) {
  ctx.__hooks__ = {} as any

  disableEnumerable(ctx, ['__hooks__'])

  lc[type].forEach((name: PageLifeTime | ComponentLifeTime) => {
    ctx.__hooks__[name] = []
  })
}

// 执行钩子
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
        // 以此保证多个实例在异步穿插运行时使用onXXX动态添加的生命周期函数指向正确
        setCurrentCtx(ctx)
        const res = callbacks[i].call(ctx, result)
        setCurrentCtx(null)
        return res
      })
    }
    // 运行期间可以动态添加生命周期, 运行链结束检查是否有新增的钩子函数
    promise = promise.then(() => {
      const nowLen = ctx.__hooks__[name].length
      if (nowLen > len) {
        // 如果有，就执行新增的钩子函数
        return callHooks(name, options, ctx, len)
      }
    })
  }
  return promise
}

// 生成添加钩子函数
function createPushHooks(name: PageLifeTime | ComponentLifeTime) {
  // 添加钩子函数
  return function pushHooks(cb: HookFn) {
    currentCtx && currentCtx.__hooks__[name].push(cb)
  }
}
// 页面的添加函数
const pagePushHooks = lc.page.reduce((res, name) => {
  res[name] = createPushHooks(name)
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

// 组件的添加函数
const componentPushHooks = lc.component.reduce((res, name: string) => {
  // created => onCreated | ready => onReady
  const onName = transformOnName(name)
  res[onName as ComponentHooksName] = createPushHooks(name as ComponentLifeTime)
  return res
}, {} as { [P in ComponentHooksName]: Function })

export const onCreated = componentPushHooks.onCreated
export const onAttached = componentPushHooks.onAttached
export const onComponentReady = componentPushHooks.onReady
export const onMoved = componentPushHooks.onMoved
export const onDetached = componentPushHooks.onDetached
export const onError = componentPushHooks.onError
