import { isFunction } from './util'
import { reactive, onGetterChange, onSetterChange } from './fork-reactive.js'
import { isSymbol } from '@vue/shared'
export function handlerSetup(
  ctx: PageInstance | ComponentInstance,
  options: LooseObject,
  type: DecoratorType
) {
  if (isFunction(ctx.setup)) {
    const setupData = ctx.setup(options) || {}
    if (!ctx.data) ctx.data = {}
    if (type === 'component' && !ctx.methods) ctx.methods = {}
    Object.entries(setupData).forEach(([key, val]) => {
      if (isFunction(val)) {
        ;(type === 'page' ? ctx : ctx.methods)[key] = val
      } else {
        ctx.data[key] = val
      }
    })
    ctx.data = reactive(ctx.data)
    let keyPath = ''
    onGetterChange((target: LooseObject, key: string, receiver: any) => {
      // 访问原型方法
      if (Object.getPrototypeOf(target)[key]) return
      if (isSymbol(key)) return
      if (receiver === ctx.data) {
        keyPath = `data.${key}`
      } else {
        keyPath = `${keyPath}.${key}`
      }
    })
    onSetterChange(function (target: any, key: string, val: any) {
      if (key === 'length') return
      keyPath = keyPath.replace(/(\.length)|(__v_.*?(\.|$))/g, '')
      keyPath = keyPath.endsWith('.') ? keyPath.slice(0, -1) : keyPath
      console.log(keyPath + '.' + key)
      keyPath = 'data'
    })
  }
}
