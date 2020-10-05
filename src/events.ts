import { defineReadonlyProp, isFunction } from './util'

export function initEvents(ctx: LooseObject = {}): EnhanceEvents {
  defineReadonlyProp(ctx, '__events__', {})

  ctx.$on = function events$on(name: string, cb: LooseFunction) {
    if (!ctx.__events__[name]) ctx.__events__[name] = []
    if (isFunction(cb)) {
      ctx.__events__[name].push(cb)
    }
  }

  ctx.$once = function events$once(name: string, cb: LooseFunction) {
    if (!ctx.__events__[name]) ctx.__events__[name] = []
    if (isFunction(cb)) {
      cb.__once = true
      ctx.__events__[name].push(cb)
    }
  }

  ctx.$emit = function events$emit(name: string, ...args: any[]) {
    if (ctx.__events__[name]?.length) {
      for (let i = 0; i < ctx.__events__[name].length; i++) {
        const cb = ctx.__events__[name][i]!
        cb.call(ctx, ...args)
        if (cb.__once) {
          ctx.$off(name, cb, i)
          i--
        }
      }
    }
  }

  ctx.$off = function events$off(
    name: string,
    cb: LooseFunction,
    offCallbackIndex?: number
  ) {
    if (ctx.__events__[name]?.length) {
      // 传入index减少寻找时间
      const i =
        offCallbackIndex ||
        ctx.__events__[name].findIndex((fn: LooseFunction) => fn === cb)
      if (i > -1) {
        ctx.__events__[name].splice(i, 1)
      }
    }
  }
  return ctx as LooseObject & EnhanceEvents
}
