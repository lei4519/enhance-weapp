import {
  Eapp,
  notControlLifecycle,
  customControlLifecycle
} from './libs/enhancemp'
import { genFn } from './utils/index.js'

Function.prototype.toJSON = function () {
  return `function:${this.name}`
}

Eapp({
  ...genFn('onLaunch', 80),
  ...genFn('onShow', 70),
  notControlLifecycle,
  customControlLifecycle,
  globalData: {
    orderAsync: []
  }
})
