/// <reference types="miniprogram-api-typings" />
/** 宽松对象 */
export interface LooseObject {
    [key: string]: any;
}
/** 宽松函数 */
export interface LooseFunction extends LooseObject {
    (...args: any[]): any;
}
/** 要装饰的类型 */
export declare type DecoratorType = 'app' | 'page' | 'component';
/** 钩子函数 */
export declare type HookFn = (opt?: any) => any | Promise<any>;
/** App 生命周期 */
export declare type AppLifeTime = keyof WechatMiniprogram.App.Option;
/** Page 生命周期 */
export declare type PageLifeTime = keyof Omit<WechatMiniprogram.Page.ILifetime, 'onPageScroll'>;
/** 组件 生命周期 */
export declare type ComponentLifeTime = keyof Omit<WechatMiniprogram.Component.Lifetimes, 'lifetimes'> | 'show' | 'hide' | 'resize';
/** setup 类型 */
export interface SetupOptions {
    setup?: (query?: Record<string, string | undefined>) => LooseObject;
}
/** 默认类型 */
export declare type DataOption = WechatMiniprogram.Page.DataOption;
export declare type CustomOption = WechatMiniprogram.Page.CustomOption;
export declare type PropertyOption = WechatMiniprogram.Component.PropertyOption;
export interface EnhanceEvents {
    __events__: Record<string, LooseFunction[]>;
    $on: (name: string, cb: LooseFunction) => void;
    $once: (name: string, cb: LooseFunction) => void;
    $off: (name: string, cb: LooseFunction, offCallbackIndex?: number) => void;
    $emit: (name: string, ...args: any[]) => void;
    [key: string]: any;
}
/** 增强的运行时参数 */
export interface EnhanceRuntime<T extends string | number | symbol = any> extends EnhanceEvents {
    __hooks__: Record<T, LooseFunction[]>;
    $nextTick(cb: LooseFunction): void;
    $nextTick(): Promise<void>;
    [key: string]: any;
}
/** Eapp 函数 */
export declare type EappFn = <T extends LooseObject = LooseObject>(options: WechatMiniprogram.App.Options<T & Partial<EnhanceRuntime<AppLifeTime>>>) => void;
/** Epage 函数 */
export declare type EpageFn = <TData extends DataOption = DataOption, TCustom extends CustomOption = CustomOption>(options: EpageOptions<TData, TCustom & Partial<EnhanceRuntime<PageLifeTime>>>) => void;
/** Epage 函数参数 */
export declare type EpageOptions<TData extends DataOption, TCustom extends CustomOption> = SetupOptions & WechatMiniprogram.Page.Options<TData, TCustom>;
/** Ecomponent 函数 */
export declare type EcomponentFn = <TData extends DataOption = DataOption, TProperty extends PropertyOption = PropertyOption, TMethod extends LooseFunction = LooseFunction>(options: EcomponentOptions<TData, TProperty, TMethod>) => void;
/** Ecomponent 函数参数 */
export declare type EcomponentOptions<TData extends DataOption = DataOption, TProperty extends PropertyOption = PropertyOption, TMethod extends LooseFunction = LooseFunction> = SetupOptions & WechatMiniprogram.Component.Options<TData, TProperty, TMethod>;
export declare type ComponentHooksName = 'onCreated' | 'onAttached' | 'onReady' | 'onMoved' | 'onDetached' | 'onError' | 'onShow' | 'onHide' | 'onResize';
export declare type Lifetime = AppLifeTime | PageLifeTime | ComponentLifeTime;
/** 等待指定生命周期执行成功后 调用当前生命周期 */
export declare type WaitHookFn = (eventBus: EnhanceEvents, eventName: string) => void;
/** 生命周期的控制函数 */
export declare type ControlLifecycleFn = (params: ControlLifecycleFnParams) => void;
export interface ControlLifecycleFnParams {
    type: DecoratorType;
    name: AppLifeTime | PageLifeTime | ComponentLifeTime;
    ctx: EnhanceRuntime;
    lcEventBus: EnhanceEvents;
    waitHook: WaitHookFn;
    invokeHooks: LooseFunction;
}
export declare type AjaxOptions = WechatMiniprogram.RequestOption & LooseObject;
export interface Interceptors {
    request: {
        use(onFulfilled?: (options: AjaxOptions) => AjaxOptions | Promise<AjaxOptions>, onRejected?: (error?: any) => any): void;
    };
    response: {
        use(onFulfilled?: (response: any) => any | Promise<any>, onRejected?: (error?: any) => any): void;
    };
}
/** 全局混入参数 */
export interface GlobalMixinsOptions {
    /** 混入App逻辑 */
    app?: {
        /** 混入App 生命周期 */
        hooks?: {
            [key in AppLifeTime]?: HookFn | HookFn[];
        };
        [key: string]: any;
    };
    /** 混入Page逻辑 */
    page?: {
        /** 混入 Page 生命周期 */
        hooks?: {
            [key in PageLifeTime]?: HookFn | HookFn[];
        };
        /** 混入 Page data */
        data?: LooseObject;
        [key: string]: any;
    };
    /** 混入Component逻辑 */
    component?: {
        /** 混入 Component 生命周期 */
        hooks?: {
            [key in ComponentLifeTime]?: HookFn | HookFn[];
        };
        /** 混入 Component data */
        data?: LooseObject;
        [key: string]: any;
    };
    /** 混入通用逻辑，App/Page/Component 都会生效 */
    data?: LooseObject;
    [key: string]: any;
}
