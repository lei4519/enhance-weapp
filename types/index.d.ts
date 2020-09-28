declare module 'miniprogram-api-promise'
interface LooseObject {
  [key: string]: any
}
interface LooseFunction extends LooseObject {
  (...args: any[]): any
}
type DecoratorType = 'app' | 'page' | 'component'
type HookFn = (opt?: any) => any
type HookFn = (opt?: any) => Promise<any>

interface GlobalMixins {
  app?: {
    hooks?: {
      [key in AppLifeTime]?: HookFn[]
    }
    data?: LooseObject
    [key: string]: any
  }
  page?: {
    hooks?: {
      [key in PageLifeTime]?: HookFn[]
    }
    data?: LooseObject
    [key: string]: any
  }
  component?: {
    hooks?: {
      [key in ComponentLifeTime]?: HookFn[]
    }
    data?: LooseObject
    [key: string]: any
  }
  data?: LooseObject
  [key: string]: any
}
type AjaxOptions = WechatMiniprogram.RequestOption & LooseObject
interface Interceptors {
  request: {
    use(
      onFulfilled?: (
        options: AjaxOptions
      ) => AjaxOptions | Promise<AjaxOptions>,
      onRejected?: (error?: any) => any
    )
  }
  response: {
    use(
      onFulfilled?: (response: any) => any | Promise<any>,
      onRejected?: (error?: any) => any
    )
  }
}
