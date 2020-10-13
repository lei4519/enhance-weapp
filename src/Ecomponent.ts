import { EcomponentFn } from '../types'
import { decoratorLifeCycle } from './lifecycle'

export const Ecomponent: EcomponentFn = options => {
  decoratorLifeCycle(options, 'component')
  return Component(options)
}
