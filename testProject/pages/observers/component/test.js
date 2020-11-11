import { Ecomponent, onAttachedHooks, onPageHideHooks, onPageShowHooks } from '../../../libs/enhancemp'
Ecomponent({
  properties: {
    num1: {
      type: Number
    },
    num2: {
      type: Number
    }
  },
  setup() {
    this.set = new Set()
    return {
      a: 1
    }
  },
  observers: {
    "**"() {
      this.set.add('**')
    }
  }
})
