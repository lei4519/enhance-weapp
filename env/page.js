function Page(config) {
  if (!config.setData) {
    config.setData = (obj, fn) => {
      fn?.()
    }
  }
    ;[
      'onLoad',
      'onShow',
      'onReady',
      'onHide',
      'onUnload',
      'onPullDownRefresh',
      'onReachBottom',
      'onShareAppMessage',
      'onTabItemTap',
      'onResize',
      'onAddToFavorites'
    ].forEach((key) => {
    if (key === 'onLoad') {
      config?.[key]({query: 1})
    } else {
      setTimeout(() => {
        config?.[key]()
      })
    }
  })
  return config
}
global.Page = Page
