function Component(config) {
  if (!config.setData) {
    config.setData = (obj, fn) => {
      fn?.()
    }
  }
    ;[
      'created',
      'attached',
      'ready',
      'moved',
      'detached',
      'error'
    ].forEach((key) => {
    if (key === 'created') {
      config.lifetimes?.[key].call(config)
    } else {
      setTimeout(() => {
        config.lifetimes?.[key].call(config)
      })
    }
  })
  return config
}
global.Component = Component
