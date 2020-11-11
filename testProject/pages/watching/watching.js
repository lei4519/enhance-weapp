import { Epage, onHideHooks, onLoadHooks } from '../../libs/enhancemp'
let i = 0, timer

Epage({
  setup() {
    onLoadHooks(() => {
      this.data$.value++
    })
    onHideHooks(() => {
      timer = setInterval(() => {
        if (i === 3) {
          return clearInterval(timer)
        }
        i++
        this.data$.value++
      }, 10)
    })
    return {
      value: 0,
      to() {
        wx.navigateTo({
          url: '/pages/reactive/reactive'
        })
      }
    }
  }
})