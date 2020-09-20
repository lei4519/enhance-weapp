interface LooseObject {
  [key: string]: any
}
interface LooseFunction extends LooseObject {
  (...args: any[]): any
}
type DecoratorType = 'page' | 'component'
type HookFn = (
  opt: LooseObject | undefined
) =>
  | (LooseObject | undefined)
  | Promise<(opt: LooseObject | undefined) => LooseObject | undefined>

declare module 'fork/fork-reactive.js' {
  export {}
}
