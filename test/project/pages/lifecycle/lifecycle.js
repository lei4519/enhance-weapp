import { Epage, ref, reactive, onShowHooks } from '../../libs/enhancemp'

Epage({
  setup() {
    const refVal = ref(2)
    const a = reactive({
        b: {
          c: {
            d: 1
          }
        }
    })
    onShowHooks(() => {
      refVal.value = 3
      a.b.c = 2
    })
    return {
      refVal,
      a
    }
  }
})

// Page({
//   data: {
//     a: {
//       b: {
//         c: {
//           d: 1
//         }
//       }
//     }
//   },
//   onLoad() {
//     this.cloneData = JSON.parse(JSON.stringify(this.data))
//     this.setData(this.data)
//     console.log(this.data.a.b === this.cloneData.a.b);
//     console.log(this.data.a.b.c === this.cloneData.a.b.c);
    
//   }
// })