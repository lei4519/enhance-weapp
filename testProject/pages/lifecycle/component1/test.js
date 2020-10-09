import { Ecomponent, onCreatedHooks } from '../../../libs/enhancemp'
import { setTimeoutResolve } from '../../../utils/index.js'

// 生命周期执行顺序
let queue = []

Ecomponent({
  setup() {
    queue = []
    queue.push(1)
    // 使用onX添加的生命周期函数, 会依次执行

    onCreatedHooks(() => {
      queue.push(2)
    })
    onCreatedHooks(() => {
      // 生命周期中可以使用onX添加生命周期函数, 可以如此递归
      queue.push(3)

      onCreatedHooks(() => {
        queue.push(7)

        onCreatedHooks(() => {
          queue.push(8)
        })
      })
      // 装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成
      this.$once('created:resolve', () => {
        queue.push(9)
      })
      // 多个实例生命周期异步穿插运行，动态添加的钩子可以正确指向对应实例
      return setTimeoutResolve(null, 299)
    })
    return {
      queue
    }
  },
  created: [
    // 装饰后选项上的生命周期函数可以是数组
    // 选项中定义的生命周期，最后执行
    () => {
      queue.push(4)
    },
    () => {
      queue.push(5)
      return setTimeoutResolve(null, 299)
    },
    () => {
      queue.push(6)
    }
  ]
})
