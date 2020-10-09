import { Ecomponent, onPageHideHooks, onPageShowHooks } from '../../../libs/enhancemp'

Ecomponent({
  setup() {
    onPageShowHooks(() => {
      this.data$.value++
    })
    onPageHideHooks(() => {
      setTimeout(() => {
        this.data$.value++
      })
    })
    return {
      value: 0
    }
  }
})
