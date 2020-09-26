import {
  definePrivateProp,
  isFunction,
  isObject,
  transformOnName
} from '@/util'
import { initEvents } from './events'
import { handlerMixins } from './mixins'
import { handlerSetup } from './reactive'
import { setDataNextTick } from './setDataEffect'
type Lifetime = AppLifeTime | PageLifeTime | ComponentLifeTime
const lc = {
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
    'onShareAppMessage',
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
    'error'
  ] as Array<ComponentLifeTime>
}

export function decoratorLifeCycle(
  options: PageOptions | ComponentOptions,
  type: DecoratorType = 'page'
): void {
  // 循环所有lifeCycle 进行装饰
  lc[type].forEach((name: Lifetime) => {
    // 处理component lifetimes
    if (type === 'component' && !isObject(options.lifetimes)) {
      options.lifetimes = {}
    }
    // 保留用户定义的生命周期函数
    let userHooks: HookFn | HookFn[]
    if (type === 'app' || type === 'page') {
      userHooks = options[name]
    } else {
      // lifetimes 优先级高于选项
      userHooks = options.lifetimes[name] || options[name]
    }
    const opt = type === 'app' || type === 'page' ? options : options.lifetimes
    opt[name] = function (options: LooseObject) {
      if (name === 'onLaunch' || name === 'onLoad' || name === 'created') {
        // 初始化事件通信
        initEvents(this)
        // 初始化 hooks
        initHooks(type, this)
        // 处理mixins
        handlerMixins(type, this)
        // App 里没有data，没有视图，不需要使用响应式
        if (name !== 'onLaunch') {
          if (isFunction(this.setup)) {
            // nextTick
            this.$nextTick = setDataNextTick
            // 处理 setup
            setCurrentCtx(this)
            handlerSetup(this, options, type)
            setCurrentCtx(null)
          }
        }
      }
      // 如果用户定义了生命周期函数
      if (userHooks) {
        // 统一处理为数组
        if (!Array.isArray(userHooks)) userHooks = [userHooks as HookFn]
        setCurrentCtx(this)
        userHooks.forEach(fn => {
          if (isFunction(fn)) {
            // 在setup中添加的钩子应该于原函数之前执行
            // 将原函数放入队尾
            if (type === 'app') {
              appPushHooks[name as AppLifeTime](fn)
            } else if (type === 'page') {
              pagePushHooks[name as PageLifeTime](fn)
            } else {
              // create -> onCreate
              const onName = transformOnName(name)
              componentPushHooks[onName as ComponentHooksName](fn)
            }
          }
        })
        setCurrentCtx(null)
      }
      const invokeHooks = () => {
        try {
          // 执行所有的钩子函数
          const result = callHooks(name, options, this)
          // 异步结果
          if (isFunction(result?.then)) {
            result
              .then(() => {
                this[`__${name}:resolve__`] = true
                // 执行完成 触发事件
                this.$emit(`${name}:resolve`)
              })
              .catch((err: any) => {
                this[`__${name}:reject__`] = true
                if (isFunction(this.catchLifeCycleError))
                  this.catchLifeCycleError(name, err)
                // 执行错误 触发事件
                this.$emit(`${name}:reject`, err)
              })
          } else {
            // 同步结果
            this[`__${name}:resolve__`] = true
            // 执行完成 触发事件
            this.$emit(`${name}:resolve`)
          }
        } catch (err) {
          // 同步错误
          this[`__${name}:reject__`] = true
          if (isFunction(this.catchLifeCycleError))
            this.catchLifeCycleError(name, err)
          // 执行完成 触发错误事件
          this.$emit(`${name}:reject`, err)
        }
      }
      // Page的onShow、onReady，应该在onLoad执行完成之后才执行
      if (type === 'page' && (name === 'onShow' || name === 'onReady')) {
        // 执行onShow onReady
        if (this['__onLoad:resolve__']) {
          // onLoad已经执行完成
          invokeHooks()
        } else {
          // 监听onLoad执行完成事件
          this.$once('onLoad:resolve', invokeHooks)
        }
      } else {
        invokeHooks()
      }
    }
  })
}

// 全局保留上下文，添加钩子函数时使用
let currentCtx: PageInstance | ComponentInstance | null = null
function setCurrentCtx(ctx: PageInstance | ComponentInstance | null) {
  currentCtx = ctx
}
// TODO ts app实例类型
export function getCurrentCtx(): PageInstance | ComponentInstance | null {
  return currentCtx
}

// 初始化钩子
function initHooks(type: DecoratorType, ctx: PageInstance | ComponentInstance) {
  // 保存所有的生命周期钩子
  definePrivateProp(ctx, '__hooks__', {})

  lc[type].forEach((name: Lifetime) => {
    // 标志生命周期是否执行完成
    definePrivateProp(ctx, `__${name}:resolve__`, false)
    definePrivateProp(ctx, `__${name}:reject__`, false)
    ctx.__hooks__[name] = []
  })
}

// 执行钩子
function callHooks(
  name: Lifetime,
  options: LooseObject,
  ctx: PageInstance | ComponentInstance,
  startIdx = 0
) {
  ctx[`__${name}:resolve__`] = false
  ctx[`__${name}:reject__`] = false
  let optOrPromise: any = options
  const lcHooks = ctx.__hooks__[name]
  const len = lcHooks.length
  if (len) {
    for (let i = startIdx; i < len; i++) {
      if (isFunction(optOrPromise?.then)) {
        // 异步微任务执行
        optOrPromise = optOrPromise.then((result: any) => {
          // 每次执行前将当前的ctx推入全局
          // 以此保证多个实例在异步穿插运行时使用onXXX动态添加的生命周期函数指向正确
          setCurrentCtx(ctx)
          const res = lcHooks[i].call(ctx, result)
          setCurrentCtx(null)
          return res
        })
      } else {
        // 同步任务运行
        setCurrentCtx(ctx)
        optOrPromise = lcHooks[i].call(ctx, optOrPromise)
        setCurrentCtx(null)
      }
    }
    // 运行期间可以动态添加生命周期, 运行链结束检查是否有新增的钩子函数
    const checkNewHooks = (result: any) => {
      const nowLen = ctx.__hooks__[name].length
      if (nowLen > len) {
        // 如果有，就执行新增的钩子函数
        return callHooks(name, result, ctx, len)
      }
      return result
    }
    if (isFunction(optOrPromise?.then)) {
      optOrPromise = optOrPromise.then(checkNewHooks)
    } else {
      optOrPromise = checkNewHooks(optOrPromise)
    }
  }
  return optOrPromise
}
type PushHooksFn = (cb: HookFn) => void
// 生成添加钩子函数
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
const appPushHooks = lc.app.reduce((res, name) => {
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
const pagePushHooks = lc.page.reduce((res, name) => {
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
export const onShareAppMessage = pagePushHooks.onShareAppMessage
export const onTabItemTap = pagePushHooks.onTabItemTap
export const onResize = pagePushHooks.onResize
export const onAddToFavorites = pagePushHooks.onAddToFavorites

// Component的添加函数
const componentPushHooks = lc.component.reduce((res, name: string) => {
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
export const onError = componentPushHooks.onError
