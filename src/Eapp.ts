import { decoratorLifeCycle } from './lifecycle'

export const Eapp: EappFn = options => {
  decoratorLifeCycle(options, 'app')
  return App(options)
}
