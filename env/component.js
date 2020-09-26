class WxComponent {
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

function Component(config) {
  const component = new WxComponent(config)

    ;[
      'created',
      'attached',
      'ready',
      'moved',
      'detached',
      'error'
    ].forEach((key) => {
    if (key === 'created') {
      component.lifetimes?.[key].call(component)
    } else {
      setTimeout(() => {
        component.lifetimes?.[key].call(component)
      })
    }
  })

  return component
}
global.Component = Component
