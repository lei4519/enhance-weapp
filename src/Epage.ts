import { decoratorLifeCycle } from './lifecycle'

export const Epage: EpageFn = options => {
  decoratorLifeCycle(options, 'page')
  Page(options)
}
