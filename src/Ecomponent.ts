import { decoratorLifeCycle } from './lifecycle'

export function Ecomponent(options: ComponentOptions): ComponentInstance {
  decoratorLifeCycle(options, 'component')
  return (Component(options) as unknown) as ComponentInstance
}
