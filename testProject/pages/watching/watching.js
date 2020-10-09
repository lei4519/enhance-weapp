import { Epage, onShowHooks, onHideHooks, onUnloadHooks } from '../../libs/enhancemp'
Epage({
  setup() {
    onShowHooks(() => {
      this.data$.value++
    })
    onHideHooks(() => {
      setTimeout(() => {
        this.data$.value++
      })
    })
    return {
      value: 0
    }
  }
})