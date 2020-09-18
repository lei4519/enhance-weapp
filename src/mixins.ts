
let mixins = {
  page: {
    hooks: {
      onLoad: [
        function createReactiveData(options) {
          if (!isObject(this.data)) this.data = {}
          if (isFunction(this.setup)) {
            const setupData = this.setup(options)
            if (isObject(setupData)) {
              Object.entries(setupData).forEach(
                ([key, val]) =>
                  ((isFunction(val) ? this : this.data)[key] = val)
              )
            } else {
              console.warn('setup函数应该返回对象')
            }
          }
          reactive(this.data)
          return options
        },
        function bindSetDataEffect(options) {
          function bindEffect(data, key) {
            Object.entries(data).forEach(([k, val])=> {
              const keyPath = key ? `${key}.${k}` : k
              if (!isRef(val) && typeof val === 'object') {
                bindEffect(val, keyPath)
              }
              effect(function setDataEffect() {
                const item = data[k]
                const key = isRef(item) ? resKey : resKey
                const value = isRef(item) ? unref(item) : toRaw(item)
                this.setData(page, { [key]: value })
              })
            })
          }
          bindEffect(this.data)
          return options
        },
        function decoratorSetData(options) {
          const setData = this.setData.bind(this)
          const queue = []
          const flag = true
          const nextTick = null
          this.setData = function optimizeSetData(obj) {
            queue.push(obj)
            if (flag) {
              Promise.resolve().then(() => {
                this.flag = false
                setData()
              })
            }
          }
          return options
        }
      ],
    },
  },
}
function globalMixins(m) {
  mixins = m
}
