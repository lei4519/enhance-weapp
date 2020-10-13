import { GlobalMixinsOptions, DecoratorType, EnhanceRuntime, HookFn } from '../types'
import { isObject } from './util'

let mixins: GlobalMixinsOptions | null = null
export function globalMixins(m: GlobalMixinsOptions) {
  mixins = m
}

export function handlerMixins(
  type: DecoratorType,
  ctx: EnhanceRuntime
): EnhanceRuntime {
  if (mixins && isObject(mixins)) {
    const mixinDataAndMethod = (key: string, val: any) => {
      if (key === 'data') {
        if (isObject(val)) {
          if (!ctx.data) ctx.data = {}
          Object.entries(val).forEach(([key, val]) => {
            // mixins优先级比页面定义低
            if (!ctx.data[key]) {
              ctx.data[key] = val
            }
          })
        }
      } else {
        // mixins优先级比页面定义低
        if (!ctx[key]) {
          ctx[key] = val
        }
      }
    }
    isObject(mixins[type]) &&
      Object.entries(mixins[type]!).forEach(([key, val]) => {
        if (key === 'hooks' && isObject(val)) {
          Object.entries<HookFn | HookFn[]>(val).forEach(
            ([lcName, hooksFn]) => {
              if (ctx.__hooks__[lcName]) {
                if (!Array.isArray(hooksFn)) hooksFn = [hooksFn]
                ctx.__hooks__[lcName].push(...hooksFn)
              }
            }
          )
        } else {
          mixinDataAndMethod(key, val)
        }
      })
    // 处理公用mixins
    Object.entries(mixins).forEach(([key, val]) => {
      if (key === 'app' || key === 'page' || key === 'component') return
      mixinDataAndMethod(key, val)
    })
  }
  return ctx
}
