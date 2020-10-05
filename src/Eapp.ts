import { decoratorLifeCycle } from './lifecycle'

export const Eapp: EappFn = options => {
  decoratorLifeCycle(options, 'app')
  App(options)
}
