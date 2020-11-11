import { Epage, onHideHooks, onLoadHooks } from '../../libs/enhancemp'
let i = 0, timer

Epage({
  setup() {
    return {
      num1: 0,
      num2: 0,
      change() {
        this.data$.num1 = 1
        this.setData({
          num2: 2
        })
      }
    }
  }
})