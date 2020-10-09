import { Ecomponent } from '../../../libs/enhancemp'
import { genFn } from '../../../utils/index.js'

Ecomponent({
  ...genFn('created', 30),
  ...genFn('attached', 20),
  ...genFn('ready', 10)
})
