import { decoratorLifeCycle } from './lifecycle'

export const Ecomponent: EcomponentFn = options => {
  decoratorLifeCycle(options, 'component')
  Component(options)
}
