import { Epage, onLoadHooks } from '../../libs/enhancemp'
// 生命周期执行顺序
let queue = []
Epage({
  setup() {
    queue = []
    queue.push(1)
    onLoadHooks(() => {
      throw new Error()
    })
    // 装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成
    this.$once('onLoad:reject', () => {
      queue.push(3)
    })
    this.$once('onLoad:finally', () => {
      queue.push(4)
    })
    return {
      queue
    }
  },
  catchLifeCycleError() {
    queue.push(2)
  }
})
