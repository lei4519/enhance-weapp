import { Epage, ref, reactive, unref, Ecomponent } from '../../libs/enhancemp'
Epage({
  setup() {
    const a = ref(1)
    return {
      a,
      fn1() {
        this.setData({
          a: 2
        })
      },
      fn2() {
        a.value = 3
      }
    }
  }
})
