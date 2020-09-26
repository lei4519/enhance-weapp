class WxPage {
  constructor(config = {}) {
    Object.keys(config).forEach(key => {
      this[key] = config[key]
    })
    this.data = config.data || {}
    this.onRender =
      config.onRender ||
      (() => {
        //
      })
  }

  setData(data, fn) {
    Object.keys(data).forEach(key => {
      const keys = key.split('.')
      if (keys.length === 1) {
        this.data[key] = data[key]
      } else {
        let end = this.data
        keys.forEach((k, index) => {
          if (!end[k]) {
            end[k] = {}
          }
          if (index === keys.length - 1) {
            end[k] = data[key]
          } else {
            end = end[k]
          }
        })
      }
    })
    this.onRender()
    fn && fn()
  }
}

function Page(config) {
  const page = new WxPage(config)

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
      page?.[key]()
    } else {
      setTimeout(() => {
        page?.[key]()
      })
    }
  })

  return page
}
global.Page = Page
