import { Ecomponent, onAttachedHooks, onPageHideHooks, onPageShowHooks } from '../../../libs/enhancemp'
let i = 0, timer
Ecomponent({
  setup() {
    onAttachedHooks(() => {
      this.data$.value++
    })
    onPageHideHooks(() => {
      timer = setInterval(() => {
        if (i === 3) {
          return clearInterval(timer)
        }
        i++
        this.data$.value++
      }, 10)
    })
    return {
      value: 0
    }
  }
})
