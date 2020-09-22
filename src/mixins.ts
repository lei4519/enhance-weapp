import { isObject } from './util'

let mixins: GlobalMixins | null = null

export function handlerMixins(
  type: DecoratorType,
  ctx: PageInstance | ComponentInstance
) {
  if (mixins) {
    Object.entries(mixins).forEach(([key, val]) => {
      if (key === 'hooks') {
        if (isObject(val) && isObject(val[type])) {
          Object.entries<HookFn | HookFn[]>(val[type]).forEach(
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
            // mixins优先级最低
            if (!ctx.data[key]) {
              ctx.data[key] = val
            }
          })
        }
      } else {
        // mixins优先级最低
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

globalMixins({
  // 生命周期钩子
  hooks: {
    // 页面钩子
    page: {
      onLoad: [],
      onShow: [],
      onReady: [],
      onHide: [],
      onUnload: [],
      onPullDownRefresh: [],
      onReachBottom: [],
      onShareAppMessage: [],
      onTabItemTap: [],
      onResize: [],
      onAddToFavorites: []
    },
    // 组件钩子
    component: {
      created: [],
      attached: [],
      ready: [],
      moved: [],
      detached: [],
      error: []
    }
  },
  // 属性
  data: {},
  // 方法
  anyFunction() {}
})
