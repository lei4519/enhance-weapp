interface LooseObject {
  [key: string]: any
}
interface LooseFunction extends LooseObject {
  (...args: any[]): any
}
type DecoratorType = 'page' | 'component'
type HookFn = (opt?: LooseObject) => void
type HookFn = (opt?: LooseObject) => LooseObject
type HookFn = (opt?: LooseObject) => Promise<any>

interface GlobalMixins {
  hooks?: {
    page?: {
      [key in PageLifeTime]?: HookFn[]
    }
    component?: {
      [key in ComponentLifeTime]?: HookFn[]
    }
  }
  data?: LooseObject
  [key: string]: any
}
