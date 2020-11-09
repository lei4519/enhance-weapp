import { EnhanceRuntime, LooseObject, DecoratorType } from '../types';
export declare function handlerSetup(ctx: EnhanceRuntime, options: LooseObject, type: DecoratorType): any;
export declare function watching(this: EnhanceRuntime): void;
export declare function stopWatching(this: EnhanceRuntime): void;
