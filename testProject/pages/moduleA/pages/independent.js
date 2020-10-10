import { Epage, onLoadHooks } from '../../../libs/enhancemp'
import { setTimeoutResolve, genFn } from '../../../utils/index.js'
// 生命周期执行顺序
let queue = []
let optionsList = []
Epage({
  setup() {
    queue = []
    optionsList = []
    queue.push(1)
    // 使用onX添加的生命周期函数, 会依次执行
    onLoadHooks(() => {
      queue.push(2)
      // 生命周期函数如果返回Promise，会阻塞后续代码执行
      return setTimeoutResolve(void 0, 100)
    })
    onLoadHooks(() => {
      // 生命周期中可以使用onX添加生命周期函数, 可以如此递归
      queue.push(3)

      onLoadHooks(options => {
        // 微信传入生命周期的参数为默认值，生命周期函数如果返回值为undefined, 在之后的函数中依然可以接收到默认值
        queue.push(7)
        optionsList.push({ ...options })
        onLoadHooks(options => {
          queue.push(8)
          optionsList.push({ ...options })
        })
        options.a = 1
        // 生命周期函数如果有返回值并且不为undefined, 默认值会更新为此值，在之后的函数中可以接收到这个默认值
        return options
      })
      // 装饰后生命周期可以正常执行, 并通过监听xxx:resolve来判断执行完成
      this.$once('onLoad:resolve', () => {
        queue.push(9)
      })
    })
    return {
      queue,
      optionsList
    }
  },
  onLoad: [
    // 装饰后选项上的生命周期函数可以是数组
    // 选项中定义的生命周期，最后执行
    () => {
      queue.push(4)
      // 生命周期函数如果返回Promise，会阻塞后续代码执行
      return setTimeoutResolve(void 0, 100)
    },
    () => {
      queue.push(5)
    },
    () => {
      queue.push(6)
    }
  ],
  ...genFn(['onHide'], 100)
})
