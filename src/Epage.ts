import { decoratorLifeCycle } from './lifecycle'

export function Epage(options: PageOptions): PageInstance {
  decoratorLifeCycle(options, 'page')
  return (Page(options) as unknown) as PageInstance
}
