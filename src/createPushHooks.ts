import { AppLifeTime, ComponentLifeTime, PageLifeTime, HookFn, EnhanceRuntime, Lifetime, ComponentHooksName } from '../types'
import { isFunction, transformOnName } from './util'

// 需要装饰的所有生命周期
export const lc = {
  app: [
    'onLaunch',
    'onShow',
    'onHide',
    'onError',
    'onPageNotFound',
    'onUnhandledRejection',
    'onThemeChange'
  ] as Array<AppLifeTime>,
  page: [
    'onLoad',
    'onShow',
    'onReady',
    'onHide',
    'onUnload',
    'onPullDownRefresh',
    'onReachBottom',
    // 'onShareAppMessage', 分享不需要包装，一个页面只有一个
    // 'onPageScroll', 性能问题：一旦监听，每次滚动两个线程之间都会通信一次
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
    'error',
    'show',
    'hide',
    'resize'
  ] as Array<ComponentLifeTime>
}

type PushHooksFn = (cb: HookFn) => void

// 全局保留上下文，添加钩子函数时使用
let currentCtx: EnhanceRuntime | null = null
export function setCurrentCtx(ctx: EnhanceRuntime | null) {
  currentCtx = ctx
}
// 获取生命周期执行是的this值，可能为null
export function getCurrentCtx(): EnhanceRuntime | null {
  return currentCtx
}

// 生成添加钩子的函数
function createPushHooks(name: Lifetime): PushHooksFn {
  // 添加钩子函数
  return function pushHooks(cb: HookFn) {
    // 函数才能被推入
    if (isFunction(cb)) {
      let i
      if ((i = currentCtx) && (i = i.__hooks__[name])) {
        // 避免onShow、onHide等多次调用的生命周期，重复添加相同的钩子函数
        if (!i.includes(cb)) {
          i.push(cb)
        }
      }
    }
  }
}

// App的添加函数
export const appPushHooks = lc.app.reduce((res, name) => {
  res[name] = createPushHooks(name)
  return res
}, {} as { [P in AppLifeTime]: PushHooksFn })

export const onLaunch = appPushHooks.onLaunch
export const onAppShow = appPushHooks.onShow
export const onAppHide = appPushHooks.onHide
export const onAppError = appPushHooks.onError
export const onPageNotFound = appPushHooks.onPageNotFound
export const onUnhandledRejection = appPushHooks.onUnhandledRejection
export const onThemeChange = appPushHooks.onThemeChange

// Page的添加函数
export const pagePushHooks = lc.page.reduce((res, name) => {
  res[name] = createPushHooks(name)
  return res
}, {} as { [P in PageLifeTime]: PushHooksFn })

export const onLoad = pagePushHooks.onLoad
export const onShow = pagePushHooks.onShow
export const onReady = pagePushHooks.onReady
export const onHide = pagePushHooks.onHide
export const onUnload = pagePushHooks.onUnload
export const onPullDownRefresh = pagePushHooks.onPullDownRefresh
export const onReachBottom = pagePushHooks.onReachBottom
export const onTabItemTap = pagePushHooks.onTabItemTap
export const onResize = pagePushHooks.onResize
export const onAddToFavorites = pagePushHooks.onAddToFavorites

// Component的添加函数
export const componentPushHooks = lc.component.reduce((res, name: string) => {
  // created => onCreated | ready => onReady
  const onName = transformOnName(name)
  res[onName as ComponentHooksName] = createPushHooks(name as ComponentLifeTime)
  return res
}, {} as { [P in ComponentHooksName]: PushHooksFn })

export const onCreated = componentPushHooks.onCreated
export const onAttached = componentPushHooks.onAttached
export const onComponentReady = componentPushHooks.onReady
export const onMoved = componentPushHooks.onMoved
export const onDetached = componentPushHooks.onDetached
export const onComponentError = componentPushHooks.onError
export const onPageShow = componentPushHooks.onShow
export const onPageHide = componentPushHooks.onHide
export const onPageResize = componentPushHooks.onResize
