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
  ] as Array<keyof WechatMiniprogram.Page.ILifetime>,
  component: [
    'created',
    'attached',
    'ready',
    'moved',
    'detached',
    'error'
  ] as Array<keyof WechatMiniprogram.Component.Lifetimes>
}

function decoratorLifeCycle(config) {
  function initHooks(type, ctx) {
    ctx.__hooks__ = {}

    Object.defineProperty(ctx, '__hooks__', {
      enumerable: false
    })

    lc[type].forEach(name => {
      ctx.__hooks__[name] = mixins[type].hooks[name] || []
    })
  }
  function callHooks(name, options, page) {
    const callbacks = page.__hooks__[name]
    const promise = Promise.resolve(options)
    callbacks && callbacks.forEach(cb => promise.then(cb))
  }
  return function decoratorHook(type = 'page') {
    lc[type].forEach(name => {
      const hook = config[name] || noop
      config[name] = function (options) {
        if (name === 'onLoad') {
          initHooks(type, this)
        }
        callHooks(name, options, this)
        hook.call(this, options)
      }
    })
  }
}
