import { disableEnumerable } from './util'

export function initEvents(ctx: PageInstance | ComponentInstance) {
  ctx.__events__ = {} as {
    [key: string]: LooseFunction[]
  }

  disableEnumerable(ctx, ['__events__'])

  ctx.$on = function events$on(name: string, cb: LooseFunction) {
    if (!ctx.__events__[name]) ctx.__events__[name] = []
    ctx.__events__[name].push(cb)
  }

  ctx.$once = function events$once(name: string, cb: LooseFunction) {
    if (!ctx.__events__[name]) ctx.__events__[name] = []
    cb.__once = true
    ctx.__events__[name].push(cb)
  }

  ctx.$emit = function events$emit(name: string, ...args: any[]) {
    if (ctx.__events__[name]) {
      ctx.__events__[name].forEach((cb, i: number) => {
        // off之后会变成null
        if (cb) {
          cb.call(ctx, ...args)
          cb.__once && ctx.$off(name, cb, i)
        }
      })
    }
  }

  ctx.$off = function events$off(
    name: string,
    cb: LooseFunction,
    offCallbackIndex?: number
  ) {
    if (ctx.__events__[name]) {
      // 传入index减少寻找时间
      const i =
        offCallbackIndex || ctx.__events__[name].findIndex(fn => fn === cb)
      if (i > -1) {
        ctx.__events__[name][i] = null
      }
    }
  }
}
