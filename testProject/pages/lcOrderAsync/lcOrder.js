import { Epage } from '../../libs/enhancemp'
import { genFn } from '../../utils/index.js'
Epage({
  ...genFn('onLoad', 60),
  ...genFn('onShow', 50),
  ...genFn('onReady', 40)
})
