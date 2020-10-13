/** 不控制生命周期的运行顺序 */
export declare const notControlLifecycle: () => void;
export declare const customControlLifecycle: (fn: ControlLifecycleFn) => void;
/**
 * @description 装饰小程序生命周期
 * @param options 用户给构造函数传入的选项
 * @param type App | Page | Component
 */
export declare function decoratorLifeCycle(options: LooseObject, type: DecoratorType): LooseObject;
/**
 * 初始化生命周期钩子相关属性
 */
export declare function initHooks(type: DecoratorType, ctx: EnhanceRuntime): EnhanceRuntime;
