/** 宽松对象 */
export interface LooseObject {
  [key: string]: any
}

/** 宽松函数 */
export interface LooseFunction extends LooseObject {
  (...args: any[]): any
}
/** 要装饰的类型 */
export type DecoratorType = 'app' | 'page' | 'component'

/** 钩子函数 */
export type HookFn = (opt?: any) => any | Promise<any>

/** App 生命周期 */
export type AppLifeTime = keyof WechatMiniprogram.App.Option
/** Page 生命周期 */
export type PageLifeTime = keyof Omit<WechatMiniprogram.Page.ILifetime, 'onPageScroll'>
/** 组件 生命周期 */
export type ComponentLifeTime =
  | keyof Omit<WechatMiniprogram.Component.Lifetimes, 'lifetimes'>
  | 'show'
  | 'hide'
  | 'resize'

/** setup 类型 */
export interface SetupOptions {
  setup?: (
    // 打开当前页面路径中的参数
    query?: Record<string, string | undefined>
  ) => LooseObject
}

/** 默认类型 */
export type DataOption = WechatMiniprogram.Page.DataOption
export type CustomOption = WechatMiniprogram.Page.CustomOption
export type PropertyOption = WechatMiniprogram.Component.PropertyOption

export interface EnhanceEvents {
  // 记录所有监听的事件
  __events__: Record<string, LooseFunction[]>
  // 监听事件
  $on: (name: string, cb: LooseFunction) => void
  // 监听事件，只执行一次
  $once: (name: string, cb: LooseFunction) => void
  // 取消事件监听
  $off: (name: string, cb: LooseFunction, offCallbackIndex?: number) => void
  // 触发事件监听
  $emit: (name: string, ...args: any[]) => void
  [key: string]: any
}

/** 增强的运行时参数 */
export interface EnhanceRuntime<T extends string | number | symbol = any> extends EnhanceEvents {
  // 保存所有注册的生命周期钩子
  __hooks__: Record<T, LooseFunction[]>
  // 等待视图更新
  $nextTick(cb: LooseFunction): void
  $nextTick(): Promise<void>
  [key: string]: any
}

/** Eapp 函数 */
export type EappFn = <T extends LooseObject = LooseObject>(
  options: WechatMiniprogram.App.Options<
    T & Partial<EnhanceRuntime<AppLifeTime>>
  >
) => void

/** Epage 函数 */
export type EpageFn = <
  TData extends DataOption = DataOption,
  TCustom extends CustomOption = CustomOption
>(
  options: EpageOptions<TData, TCustom & Partial<EnhanceRuntime<PageLifeTime>>>
) => void

/** Epage 函数参数 */
export type EpageOptions<
  TData extends DataOption,
  TCustom extends CustomOption
> = SetupOptions & WechatMiniprogram.Page.Options<TData, TCustom>

/** Ecomponent 函数 */
export type EcomponentFn = <
  TData extends DataOption = DataOption,
  TProperty extends PropertyOption = PropertyOption,
  TMethod extends LooseFunction = LooseFunction
>(
  options: EcomponentOptions<
    TData,
    TProperty,
    TMethod
  >
) => void

/** Ecomponent 函数参数 */
export type EcomponentOptions<
  TData extends DataOption = DataOption,
  TProperty extends PropertyOption = PropertyOption,
  TMethod extends LooseFunction = LooseFunction
> = SetupOptions &
  WechatMiniprogram.Component.Options<
    TData,
    TProperty,
    TMethod
  >

// 组件监听生命周期的函数名称
export type ComponentHooksName =
  | 'onCreated'
  | 'onAttached'
  | 'onReady'
  | 'onMoved'
  | 'onDetached'
  | 'onError'
  | 'onShow'
  | 'onHide'
  | 'onResize'

export type Lifetime = AppLifeTime | PageLifeTime | ComponentLifeTime

/** 等待指定生命周期执行成功后 调用当前生命周期 */
export type WaitHookFn = (eventBus: EnhanceEvents, eventName: string) => void

/** 生命周期的控制函数 */
export type ControlLifecycleFn = (params: ControlLifecycleFnParams) => void
export interface ControlLifecycleFnParams {
  // 类型：APP / Page / Component
  type: DecoratorType
  // 生命周期的名称
  name: AppLifeTime | PageLifeTime | ComponentLifeTime
  // 当前的this
  ctx: EnhanceRuntime
  // 全局的生命周期事件总线，记录当前所有的生命周期运行情况
  lcEventBus: EnhanceEvents
  // 等待指定生命周期执行成功后 调用当前生命周期
  waitHook: WaitHookFn
  // 调用执行当前生命周期
  invokeHooks: LooseFunction
}

// request请求参数
export type AjaxOptions = WechatMiniprogram.RequestOption & LooseObject

// 拦截器
export interface Interceptors {
  request: {
    use(
      onFulfilled?: (
        options: AjaxOptions
      ) => AjaxOptions | Promise<AjaxOptions>,
      onRejected?: (error?: any) => any
    ): void
  }
  response: {
    use(
      onFulfilled?: (response: any) => any | Promise<any>,
      onRejected?: (error?: any) => any
    ): void
  }
}

/** 全局混入参数 */
export interface GlobalMixinsOptions {
  /** 混入App逻辑 */
  app?: {
    /** 混入App 生命周期 */
    hooks?: {
      [key in AppLifeTime]?: HookFn | HookFn[]
    }
    [key: string]: any
  }
  /** 混入Page逻辑 */
  page?: {
    /** 混入 Page 生命周期 */
    hooks?: {
      [key in PageLifeTime]?: HookFn | HookFn[]
    }
    /** 混入 Page data */
    data?: LooseObject
    [key: string]: any
  }
  /** 混入Component逻辑 */
  component?: {
    /** 混入 Component 生命周期 */
    hooks?: {
      [key in ComponentLifeTime]?: HookFn | HookFn[]
    }
    /** 混入 Component data */
    data?: LooseObject
    [key: string]: any
  }
  /** 混入通用逻辑，App/Page/Component 都会生效 */
  data?: LooseObject
  [key: string]: any
}
