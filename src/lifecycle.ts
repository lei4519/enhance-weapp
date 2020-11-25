import {
  cloneDeep,
  defineReadonlyProp,
  disabledEnumerable,
  isFunction,
  isObject,
  parsePath,
  resolvePromise,
  transformOnName
} from './util'
import { initEvents } from './events'
import { handlerMixins } from './mixins'
import { handlerSetup } from './reactive'
import { setData } from './setDataEffect'
import {
  appPushHooks,
  componentPushHooks,
  pagePushHooks,
  setCurrentCtx,
  lc
} from './createPushHooks'
import {
  AppLifeTime,
  ComponentHooksName,
  ControlLifecycleFn,
  DecoratorType,
  EnhanceRuntime,
  HookFn,
  Lifetime,
  LooseObject,
  PageLifeTime,
  WaitHookFn
} from '../types'
import { diffData } from './diffData'
import { isRef } from '@vue/reactivity'

let isControlLifecycle = true
/** 不控制生命周期的运行顺序 */
export const notControlLifecycle = () => {
  isControlLifecycle = false
}

let controlLifecycle: ControlLifecycleFn = ({
  type,
  name,
  ctx,
  lcEventBus,
  waitHook,
  invokeHooks
}) => {
  // 生命周期执行顺序
  // 初始化
  // ⬇️ onLaunch App
  // ⬇️ onShow App
  // ⬇️ onLoad Page
  // ⬇️ onShow Page
  // ⬇️ created Comp
  // ⬇️ attached Comp
  // ⬇️ ready Comp
  // ⬇️ onReady Page

  // 切后台
  // ⬇️ onHide Page
  // ⬇️ onHide App
  // ⬇️ onShow App
  // ⬇️ onShow Page

  if (type === 'app') {
    if (name === 'onShow') {
      // App的onShow，应该在App onLaunch执行完成之后执行
      return waitHook(ctx, 'onLaunch:resolve')
    } else if (name === 'onHide') {
      // App的onHide，应该在Page onHide执行完成之后执行
      return waitHook(lcEventBus, 'page:onHide:resolve')
    } else {
      // 其他的生命周期直接调用
      invokeHooks()
    }
  } else if (type === 'page') {
    if (name === 'onLoad') {
      // 没有App说明是独立分包情况，不需要等待
      /* istanbul ignore next */
      if (getApp()) {
        // Page的onLoad，应该在App onShow执行完成之后执行
        return waitHook(lcEventBus, 'app:onShow:resolve')
      } else {
        /* istanbul ignore next */
        return invokeHooks()
      }
    } else if (name === 'onShow') {
      // Page的onShow
      // 初始化时应该在Page onLoad执行完成之后执行
      // 切前台时应该在App onShow执行完成之后执行
      ctx['__onLoad:resolve__'] && lcEventBus['__app:onShow:resolve__']
        ? // 都成功直接调用
          invokeHooks()
        : // 已经onLoad（onLoad肯定在app:onShow之后执行），说明是切后台逻辑
        ctx['__onLoad:resolve__']
        ? // 监听app:onShow
          /* istanbul ignore next */
          lcEventBus.$once('app:onShow:resolve', invokeHooks)
        : // 初始化逻辑，监听onLoad
          ctx.$once('onLoad:resolve', invokeHooks)
      return
    } else if (name === 'onReady') {
      // Page的onReady，应该在Page onShow执行完成之后执行
      return waitHook(ctx, 'onShow:resolve')
    } else {
      // 其他的生命周期直接调用
      invokeHooks()
    }
  } else {
    if (name === 'created') {
      // Component的created，应该在Page onShow执行完成之后执行
      return waitHook(lcEventBus, 'page:onShow:resolve')
    } else if (name === 'attached') {
      // Component的attached，应该在Component created执行完成之后执行
      return waitHook(ctx, 'created:resolve')
    } else if (name === 'ready') {
      // Component的ready，应该在Component attached执行完成之后执行
      return waitHook(ctx, 'attached:resolve')
    } else {
      // 其他的生命周期直接调用
      invokeHooks()
    }
  }
}

export const customControlLifecycle = (fn: ControlLifecycleFn) => {
  controlLifecycle = fn
}

// 生命周期事件总线，控制生命周期的正确运行顺序
const lcEventBus = initEvents()

/**
 * @description 装饰小程序生命周期
 * @param options 用户给构造函数传入的选项
 * @param type App | Page | Component
 */
export function decoratorLifeCycle(
  options: LooseObject,
  type: DecoratorType
): LooseObject {
  decoratorObservers(options, type)

  // 组件要做额外处理
  if (type === 'component') {
    // 处理component pageLifetimes
    !isObject(options.pageLifetimes) && (options.pageLifetimes = {})
    // 处理component lifetimes
    !isObject(options.lifetimes) && (options.lifetimes = {})
    // 组件的方法必须定义到methods中才会被初始化到this身上
    !isObject(options.methods) && (options.methods = {})
    isFunction(options.setup) && (options.methods.setup = options.setup)
  }

  // 组件的pageLifetimes生命周期列表
  const pageLifetimes = ['show', 'hide', 'resize']

  // 循环所有lifeCycle 进行装饰
  lc[type].forEach((name: Lifetime) => {
    // 是否为组件的页面生命周期
    const isPageLC = pageLifetimes.includes(name)

    // 找到要装饰的生命周期函数所处的对象
    const decoratorOptions =
      type === 'component'
        ? isPageLC
          ? options.pageLifetimes
          : options.lifetimes
        : options

    // 保留用户定义的生命周期函数
    let userHooks: HookFn | HookFn[] | null =
      type === 'component' && !isPageLC
        ? // 组件的生命周期可以定义在lifetimes 和 options中, lifetimes 优先级高于 options
          decoratorOptions[name] || options[name]
        : decoratorOptions[name]

    // 定义装饰函数
    decoratorOptions[name] = function decoratorLC(options: LooseObject) {
      // 初始化事件
      if (name === 'onLaunch' || name === 'onLoad' || name === 'created') {
        // 初始化事件通信
        initEvents(this)
        // 初始化 hooks
        initHooks(type, this)
        // 处理 mixins
        handlerMixins(type, this)

        // 页面卸载时需要重置变量
        if (type === 'app') {
          this.__hooks__.onHide.push(() => {
            lcEventBus['__app:onShow:resolve__'] = lcEventBus[
              '__app:onShow:reject__'
            ] = this['__onShow:resolve__'] = this['__onShow:reject__'] = false
          })
        } else if (type === 'page') {
          this.__hooks__.onHide.push(() => {
            lcEventBus['__page:onShow:resolve__'] = lcEventBus[
              '__page:onShow:reject__'
            ] = this['__onShow:resolve__'] = this['__onShow:reject__'] = false
          })
          this.__hooks__.onUnload.push(() => {
            lc.page.forEach(name => {
              lcEventBus[`__page:${name}:resolve__`] = lcEventBus[
                `__page:${name}:reject__`
              ] = false
            })
          })
        } else {
          /* istanbul ignore next */
          this.__hooks__.hide.push(() => {
            /* istanbul ignore next */
            this['__show:resolve__'] = this['__show:reject__'] = false
          })
        }
        if (type === 'component') {
          const triggerEvent = this.triggerEvent
          this.triggerEvent = function (...args: any[]) {
            // 改为异步的以解决响应式异步更新问题
            resolvePromise.then(() => {
                  triggerEvent.call(this, ...args)
              })
          }
      }
        // App 里没有data，没有视图，不需要使用响应式
        if (name !== 'onLaunch') {
          // 只有定义了setup才会进行响应式处理，这是为了兼容老项目
          if (isFunction(this.setup)) {
            const rawSetData = this.setData
            this.setData = function (
              data: LooseObject,
              cb: LooseFunction,
              isUserInvoke = true
            ) {
              setData.call(this, rawSetData, data, cb, isUserInvoke)
            }
            // 处理 setup
            setCurrentCtx(this)
            handlerSetup(
              this,
              type === 'component' ? this.properties : options,
              type
            )
            setCurrentCtx(null)
          }
        }
      }

      // 如果用户定义了生命周期函数
      if (userHooks) {
        // 统一处理为数组
        /* istanbul ignore next */
        if (!Array.isArray(userHooks)) userHooks = [userHooks as HookFn]
        setCurrentCtx(this)
        /* istanbul ignore next */
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

      // 调用保存的生命周期函数
      const invokeHooks = () => {
        // 执行成功
        const resolve = (res: any) => {
          this[`__${name}:resolve__`] = true
          lcEventBus[`__${type}:${name}:resolve__`] = true
          // 执行完成 触发事件
          this.$emit(`${name}:resolve`, res)
          lcEventBus.$emit(`${type}:${name}:resolve`, res)

          this.$emit(`${name}:finally`, res)
          lcEventBus.$emit(`${type}:${name}:finally`, res)
        }
        // 执行失败
        const reject = (err: any) => {
          this[`__${name}:reject__`] = true
          lcEventBus[`__${type}:${name}:reject__`] = true
          if (isFunction(this.catchLifeCycleError))
            this.catchLifeCycleError(name, err)
          // 执行完成 触发错误事件
          this.$emit(`${name}:reject`, err)
          lcEventBus.$emit(`${type}:${name}:reject`, err)

          this.$emit(`${name}:finally`, err)
          lcEventBus.$emit(`${type}:${name}:finally`, err)
        }

        try {
          // 执行保存的钩子函数
          const result = callHooks(type, name, options, this)
          // 异步结果
          /* istanbul ignore next */
          if (isFunction(result?.then)) {
            result.then(resolve).catch(reject)
          } else {
            // 同步结果
            resolve(result)
          }
        } catch (err) {
          // 同步错误
          reject(err)
        }
      }

      // 等待指定生命周期执行成功后 调用当前生命周期
      const waitHook: WaitHookFn = (eventBus, eventName) => {
        eventBus[`__${eventName}__`]
          ? invokeHooks()
          : eventBus.$once(eventName, invokeHooks)
      }

      // 控制生命周期执行顺序
      if (isControlLifecycle) {
        controlLifecycle({
          type,
          name,
          ctx: this,
          lcEventBus,
          waitHook,
          invokeHooks
        })
      } else {
        // 没有控制直接调用
        invokeHooks()
      }
    }
  })

  return options
}
/**
 * 装饰数据监听器的变化
 */
function decoratorObservers(options: LooseObject, type: DecoratorType) {
  if (type !== 'component') return

  const observers = (options.observers = options.observers || {})
  // 对比数据变化差异, 并同步this.data$ 的值
  function diffAndPatch(this: EnhanceRuntime, oldData: LooseObject, newData: LooseObject) {
    const [res] = diffData(oldData, newData)
    if (res) {
      // 同步 data$ 值
      Object.entries(res).forEach(([paths, value]) => {
        const [obj, key] = parsePath(oldData, paths)
        if (isRef(obj[key])) {
          obj[key].value = value
        } else {
          obj[key] = value
        }
      })
      this.__oldData__ = cloneDeep(newData)
    }
  }
  const allObs = observers['**']
  observers['**'] = function (val: any) {
    if (this.data$) {
      diffAndPatch.call(this, this.data$, val)
    }
    allObs && allObs.call(this, val)
  }
}

/**
 * 初始化生命周期钩子相关属性
 */
export function initHooks(
  type: DecoratorType,
  ctx: EnhanceRuntime
): EnhanceRuntime {
  // 保存所有的生命周期钩子
  defineReadonlyProp(ctx, '__hooks__', {})

  lc[type].forEach((name: Lifetime) => {
    // 标志生命周期是否执行完成
    disabledEnumerable(ctx, `__${name}:resolve__`, false)
    disabledEnumerable(ctx, `__${name}:reject__`, false)
    ctx.__hooks__[name] = []
  })
  return ctx
}

/** 执行队列中的钩子函数 */
function callHooks(
  type: DecoratorType,
  name: Lifetime,
  options: LooseObject,
  ctx: EnhanceRuntime,
  startIdx?: number
) {
  /* istanbul ignore next */
  startIdx = Number(startIdx) ? startIdx : 0
  // 将运行标识位全部置为false
  ctx[`__${name}:resolve__`] = false
  ctx[`__${name}:reject__`] = false
  lcEventBus[`__${type}:${name}:resolve__`] = false
  lcEventBus[`__${type}:${name}:reject__`] = false

  // 生命周期函数执行时接受到的参数，可能是对象，也可能是上一个函数返回的promise
  let optOrPromise: any = options
  // 拿到当前要执行的钩子队列
  const lcHooks = ctx.__hooks__[name]
  // 记录当前的队列长度，因为在钩子执行过程中有可能还会向队列中推值
  const len = lcHooks.length
  /**
   * 设置/更新默认值
   * 在函数返回值为undefined时，保证之后的函数依然可以接受到参数
   */
  const setDefaultValue = (val: any) => {
    if (val === void 0) {
      // 更新默认值
      return (val = options)
    } else {
      // 同步默认值
      return (options = val)
    }
  }

  if (len) {
    for (let i = startIdx!; i < len; i++) {
      /* istanbul ignore next */
      if (isFunction(optOrPromise?.then)) {
        // 异步微任务执行
        optOrPromise = optOrPromise.then((result: any) => {
          result = setDefaultValue(result)
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
        optOrPromise = setDefaultValue(lcHooks[i].call(ctx, optOrPromise))
        setCurrentCtx(null)
      }
    }
    // 运行期间可以动态添加生命周期, 运行链结束检查是否有新增的钩子函数
    const checkNewHooks = (result: any) => {
      result = setDefaultValue(result)
      const nowLen = ctx.__hooks__[name].length
      /* istanbul ignore next */
      if (nowLen > len) {
        // 如果有，就执行新增的钩子函数
        /* istanbul ignore next */
        return callHooks(type, name, result, ctx, len)
      }
      return result
    }
    /* istanbul ignore next */
    if (isFunction(optOrPromise?.then)) {
      optOrPromise = optOrPromise.then(checkNewHooks)
    } else {
      optOrPromise = checkNewHooks(optOrPromise)
    }
  }
  return optOrPromise
}
