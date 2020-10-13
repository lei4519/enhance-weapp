export declare function noop(): void;
/**
 * @description 定义属性，不可修改，不可遍历，不可删除
 */
export declare function defineReadonlyProp(obj: any, key: string | symbol | number, value?: any): any;
/**
 * @description 定义不可遍历属性
 */
export declare function disabledEnumerable(obj: any, key: string, value?: any): any;
export declare const transformOnName: (name: string) => string;
export declare const isArray: (val: any) => boolean;
export declare const isObject: (val: any) => boolean;
export declare const isFunction: (val: any) => boolean;
export declare const isSymbol: (val: any) => boolean;
export declare const isPrimitive: (val: any) => boolean;
export declare const isLooseObject: (obj: any) => boolean;
/**
 * @description 返回promise，超时后resolve promise
 * @param resolveData promise.resolve 的数据
 * @param timeout 超时时间
 */
export declare function setTimeoutResolve(resolveData: any, timeout?: number): Promise<unknown>;
export declare function getType(val: any): string;
export declare function getRawData(data: LooseObject): LooseObject;
export declare function cloneDeepRawData(data: LooseObject): LooseObject;
export declare function cloneDeep(data: LooseObject): LooseObject;
