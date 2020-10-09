function App(config) {
    ;[
    'onLaunch',
      'onShow',
      'onHide',
      'onError',
      'onPageNotFound',
      'onUnhandledRejection',
      'onThemeChange'
    ].forEach((key) => {
    if (key === 'onLaunch') {
      config?.[key]()
    } else {
      setTimeout(() => {
        config?.[key]()
      })
    }
  })
  return config
}

global.App = App
