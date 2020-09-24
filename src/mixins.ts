import { isObject } from './util'

let mixins: GlobalMixins | null = null

export function handlerMixins(
  type: DecoratorType,
  ctx: PageInstance | ComponentInstance
) {
  if (mixins) {
    Object.entries(mixins[type]!).forEach(([key, val]) => {
      if (key === 'hooks') {
        if (isObject(val)) {
          Object.entries<HookFn | HookFn[]>(val).forEach(
            ([lcName, hooksFn]) => {
              if (ctx.__hooks__[lcName]) {
                if (!Array.isArray(hooksFn)) hooksFn = [hooksFn]
                ctx.__hooks__[lcName].push(...hooksFn)
              }
            }
          )
        }
      } else if (key === 'data') {
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
    })
    // 处理公用mixins
    Object.entries(mixins).forEach(([key, val]) => {
      if (key === 'app' || key === 'page' || key === 'component') return
      if (key === 'data') {
        if (isObject(val)) {
          if (!ctx.data) ctx.data = {}
          Object.entries(val).forEach(([key, val]) => {
            // 公用mixins优先级最低
            if (!ctx.data[key]) {
              ctx.data[key] = val
            }
          })
        }
      } else {
        // 公用mixins优先级最低
        if (!ctx[key]) {
          ctx[key] = val
        }
      }
    })
  }
}

export function globalMixins(m: GlobalMixins) {
  mixins = m
}
