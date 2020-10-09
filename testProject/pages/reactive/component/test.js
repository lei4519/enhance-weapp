import { Ecomponent, ref, reactive, unref } from '../../../libs/enhancemp'
Ecomponent({
  data: {
    a: 2
  },
  setup() {
    // ref值修改会同步至data和data$
    const refVal = ref(1)
    const changeRef = () => refVal.value++

    const reactiveVal = reactive({
      value: 1,
      array: [1, 2, 3]
    })
    // reactive值修改会同步至data和data$
    const changeReactiveVal = () => reactiveVal.value++
    // reactive数组值通过方法修改会同步至data和data$
    const changeReactiveArr = () => reactiveVal.array.pop()

    // setup返回值，函数绑定至this(methods)上，其他值绑定到data上
    return {
      a: 1,
      b: {},
      c() {},
      refVal,
      changeRef,
      reactiveVal,
      changeReactiveVal,
      changeReactiveArr
    }
  }
})
