import { GlobalMixinsOptions, DecoratorType, EnhanceRuntime } from '../types';
export declare function globalMixins(m: GlobalMixinsOptions): void;
export declare function handlerMixins(type: DecoratorType, ctx: EnhanceRuntime): EnhanceRuntime;
