import { decoratorLifeCycle } from './lifecycle'

export function Ecomponent(options: ComponentOptions) {
  decoratorLifeCycle(options, 'component')
  return Component(options)
}
