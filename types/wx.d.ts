type DataOption = WechatMiniprogram.Page.DataOption
type CustomOption = WechatMiniprogram.Page.CustomOption
type AppLifeTime = keyof WechatMiniprogram.App.Option
type PageLifeTime = keyof Omit<WechatMiniprogram.Page.ILifetime, 'onPageScroll'>
type ComponentLifeTime = keyof Omit<
  WechatMiniprogram.Component.Lifetimes,
  'lifetimes'
>
type PageOptions = WechatMiniprogram.Page.Options<DataOption, CustomOption>
type ComponentOptions = WechatMiniprogram.Component.Options<
  DataOption,
  CustomOption
>
interface PageInstance
  extends WechatMiniprogram.Page.Instance<DataOption, CustomOption> {
  __events__: {
    [key: string]: Array<LooseFunction | null>
  }
  __hooks__: {
    [key: string]: HookFn[]
  }
  $on: (name: string, cb: LooseFunction) => void
  $once: (name: string, cb: LooseFunction) => void
  $off: (name: string, cb: LooseFunction, offCallbackIndex?: number) => void
  $emit: (name: string) => void
  setup: LooseFunction
  data: LooseObject
  setData: LooseFunction
  $nextTick(cb: LooseFunction): void
  $nextTick(): Promise<void>
  $ajax: <T>(options: WechatMiniprogram.RequestOption) => Promise<T>
  [key: string]: any
}
interface ComponentInstance
  extends WechatMiniprogram.Component.Instance<DataOption, CustomOption> {
  __events__: {
    [key: string]: Array<LooseFunction | null>
  }
  __hooks__: {
    [key: string]: HookFn[]
  }
  $on: (name: string, cb: LooseFunction) => void
  $once: (name: string, cb: LooseFunction) => void
  $off: (name: string, cb: LooseFunction, offCallbackIndex?: number) => void
  $emit: (name: string) => void
  setup: LooseFunction
  data: LooseObject
  methods: LooseObject
  setData: LooseFunction
  $nextTick(cb: LooseFunction): void
  $nextTick(): Promise<void>
  $ajax: <T>(options: WechatMiniprogram.RequestOption) => Promise<T>
  [key: string]: any
}
type ComponentHooksName =
  | 'onCreated'
  | 'onAttached'
  | 'onReady'
  | 'onMoved'
  | 'onDetached'
  | 'onError'
