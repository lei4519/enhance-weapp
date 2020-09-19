import { decoratorLifeCycle } from './lifecycle'

export function Epage(options: PageOptions) {
  decoratorLifeCycle(options, 'page')
  return Page(options)
}
