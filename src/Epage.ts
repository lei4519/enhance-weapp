import { EpageFn } from '../types'
import { decoratorLifeCycle } from './lifecycle'

export const Epage: EpageFn = options => {
  decoratorLifeCycle(options, 'page')
  return Page(options)
}
