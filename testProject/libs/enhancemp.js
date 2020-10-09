'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * IMPORTANT: all calls of this function must be prefixed with
 * \/\*#\_\_PURE\_\_\*\/
 * So that rollup can tree-shake them if necessary.
 */
function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(',');
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }
    return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
}

const GLOBALS_WHITE_LISTED = 'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
    'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
    'Object,Boolean,String,RegExp,Map,Set,JSON,Intl';
const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED);
const EMPTY_OBJ =  Object.freeze({})
    ;
const NOOP = () => { };
const extend = Object.assign;
const remove = (arr, el) => {
    const i = arr.indexOf(el);
    if (i > -1) {
        arr.splice(i, 1);
    }
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === '[object Map]';
const isSet = (val) => toTypeString(val) === '[object Set]';
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isSymbol = (val) => typeof val === 'symbol';
const isObject = (val) => val !== null && typeof val === 'object';
const isPromise = (val) => {
    return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
};
const isIntegerKey = (key) => isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key;
const cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return ((str) => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    });
};
/**
 * @private
 */
const capitalize = cacheStringFunction((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
});
// compare whether a value has changed, accounting for NaN.
const hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
const def = (obj, key, value) => {
    Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        value
    });
};

const targetMap = new WeakMap();
const effectStack = [];
let activeEffect;
const ITERATE_KEY = Symbol( 'iterate' );
const MAP_KEY_ITERATE_KEY = Symbol( 'Map key iterate' );
function isEffect(fn) {
    return fn && fn._isEffect === true;
}
function effect(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
        fn = fn.raw;
    }
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}
function stop(effect) {
    if (effect.active) {
        cleanup(effect);
        if (effect.options.onStop) {
            effect.options.onStop();
        }
        effect.active = false;
    }
}
let uid = 0;
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effect.active) {
            return options.scheduler ? undefined : fn();
        }
        if (!effectStack.includes(effect)) {
            cleanup(effect);
            try {
                enableTracking();
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            }
            finally {
                effectStack.pop();
                resetTracking();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    effect.id = uid++;
    effect._isEffect = true;
    effect.active = true;
    effect.raw = fn;
    effect.deps = [];
    effect.options = options;
    return effect;
}
function cleanup(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
}
function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
}
function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === undefined ? true : last;
}
function track(target, type, key) {
    if (!shouldTrack || activeEffect === undefined) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
        if ( activeEffect.options.onTrack) {
            activeEffect.options.onTrack({
                effect: activeEffect,
                target,
                type,
                key
            });
        }
    }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        // never been tracked
        return;
    }
    const effects = new Set();
    const add = (effectsToAdd) => {
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                if (effect !== activeEffect || effect.options.allowRecurse) {
                    effects.add(effect);
                }
            });
        }
    };
    if (type === "clear" /* CLEAR */) {
        // collection being cleared
        // trigger all effects for target
        depsMap.forEach(add);
    }
    else if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key === 'length' || key >= newValue) {
                add(dep);
            }
        });
    }
    else {
        // schedule runs for SET | ADD | DELETE
        if (key !== void 0) {
            add(depsMap.get(key));
        }
        // also run for iteration key on ADD | DELETE | Map.SET
        switch (type) {
            case "add" /* ADD */:
                if (!isArray(target)) {
                    add(depsMap.get(ITERATE_KEY));
                    if (isMap(target)) {
                        add(depsMap.get(MAP_KEY_ITERATE_KEY));
                    }
                }
                else if (isIntegerKey(key)) {
                    // new index added to array -> length changes
                    add(depsMap.get('length'));
                }
                break;
            case "delete" /* DELETE */:
                if (!isArray(target)) {
                    add(depsMap.get(ITERATE_KEY));
                    if (isMap(target)) {
                        add(depsMap.get(MAP_KEY_ITERATE_KEY));
                    }
                }
                break;
            case "set" /* SET */:
                if (isMap(target)) {
                    add(depsMap.get(ITERATE_KEY));
                }
                break;
        }
    }
    const run = (effect) => {
        if ( effect.options.onTrigger) {
            effect.options.onTrigger({
                effect,
                target,
                key,
                type,
                newValue,
                oldValue,
                oldTarget
            });
        }
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        }
        else {
            effect();
        }
    };
    effects.forEach(run);
}

const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(isSymbol));
const get = /*#__PURE__*/ createGetter();
const shallowGet = /*#__PURE__*/ createGetter(false, true);
const readonlyGet = /*#__PURE__*/ createGetter(true);
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
const arrayInstrumentations = {};
['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function (...args) {
        const arr = toRaw(this);
        for (let i = 0, l = this.length; i < l; i++) {
            track(arr, "get" /* GET */, i + '');
        }
        // we run the method using the original args first (which may be reactive)
        const res = method.apply(arr, args);
        if (res === -1 || res === false) {
            // if that didn't work, run it again using raw values.
            return method.apply(arr, args.map(toRaw));
        }
        else {
            return res;
        }
    };
});
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
    const method = Array.prototype[key];
    arrayInstrumentations[key] = function (...args) {
        pauseTracking();
        const res = method.apply(this, args);
        enableTracking();
        return res;
    };
});
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_raw" /* RAW */ &&
            receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
            return target;
        }
        const targetIsArray = isArray(target);
        if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver);
        }
        const res = Reflect.get(target, key, receiver);
        const keyIsSymbol = isSymbol(key);
        if (keyIsSymbol
            ? builtInSymbols.has(key)
            : key === `__proto__` || key === `__v_isRef`) {
            return res;
        }
        if (!isReadonly) {
            track(target, "get" /* GET */, key);
        }
        if (shallow) {
            return res;
        }
        if (isRef(res)) {
            // ref unwrapping - does not apply for Array + integer key.
            const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
            return shouldUnwrap ? res.value : res;
        }
        if (isObject(res)) {
            // Convert returned value into a proxy as well. we do the isObject check
            // here to avoid invalid value warning. Also need to lazy access readonly
            // and reactive here to avoid circular dependency.
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
const set = /*#__PURE__*/ createSetter();
const shallowSet = /*#__PURE__*/ createSetter(true);
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key];
        if (!shallow) {
            value = toRaw(value);
            if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            }
        }
        const hadKey = isArray(target) && isIntegerKey(key)
            ? Number(key) < target.length
            : hasOwn(target, key);
        const result = Reflect.set(target, key, value, receiver);
        // don't trigger if target is something up in the prototype chain of original
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, "add" /* ADD */, key, value);
            }
            else if (hasChanged(value, oldValue)) {
                trigger(target, "set" /* SET */, key, value, oldValue);
            }
        }
        return result;
    };
}
function deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    const oldValue = target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
        trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
    }
    return result;
}
function has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
        track(target, "has" /* HAS */, key);
    }
    return result;
}
function ownKeys(target) {
    track(target, "iterate" /* ITERATE */, ITERATE_KEY);
    return Reflect.ownKeys(target);
}
const mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        {
            console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
    },
    deleteProperty(target, key) {
        {
            console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
    }
};
const shallowReactiveHandlers = extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
});
// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

const toReactive = (value) => isObject(value) ? reactive(value) : value;
const toReadonly = (value) => isObject(value) ? readonly(value) : value;
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function get$1(target, key, isReadonly = false, isShallow = false) {
    // #1772: readonly(reactive(Map)) should return readonly + reactive version
    // of the value
    target = target["__v_raw" /* RAW */];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
        !isReadonly && track(rawTarget, "get" /* GET */, key);
    }
    !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
    const { has } = getProto(rawTarget);
    const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
    if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
    }
    else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
    }
}
function has$1(key, isReadonly = false) {
    const target = this["__v_raw" /* RAW */];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key);
    if (key !== rawKey) {
        !isReadonly && track(rawTarget, "has" /* HAS */, key);
    }
    !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
    return key === rawKey
        ? target.has(key)
        : target.has(key) || target.has(rawKey);
}
function size(target, isReadonly = false) {
    target = target["__v_raw" /* RAW */];
    !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
    return Reflect.get(target, 'size', target);
}
function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    const result = target.add(value);
    if (!hadKey) {
        trigger(target, "add" /* ADD */, value, value);
    }
    return result;
}
function set$1(key, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const { has, get } = getProto(target);
    let hadKey = has.call(target, key);
    if (!hadKey) {
        key = toRaw(key);
        hadKey = has.call(target, key);
    }
    else {
        checkIdentityKeys(target, has, key);
    }
    const oldValue = get.call(target, key);
    const result = target.set(key, value);
    if (!hadKey) {
        trigger(target, "add" /* ADD */, key, value);
    }
    else if (hasChanged(value, oldValue)) {
        trigger(target, "set" /* SET */, key, value, oldValue);
    }
    return result;
}
function deleteEntry(key) {
    const target = toRaw(this);
    const { has, get } = getProto(target);
    let hadKey = has.call(target, key);
    if (!hadKey) {
        key = toRaw(key);
        hadKey = has.call(target, key);
    }
    else {
        checkIdentityKeys(target, has, key);
    }
    const oldValue = get ? get.call(target, key) : undefined;
    // forward the operation before queueing reactions
    const result = target.delete(key);
    if (hadKey) {
        trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
    }
    return result;
}
function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget =  isMap(target)
            ? new Map(target)
            : new Set(target)
        ;
    // forward the operation before queueing reactions
    const result = target.clear();
    if (hadItems) {
        trigger(target, "clear" /* CLEAR */, undefined, undefined, oldTarget);
    }
    return result;
}
function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
        const observed = this;
        const target = observed["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
        !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
        return target.forEach((value, key) => {
            // important: make sure the callback is
            // 1. invoked with the reactive map as `this` and 3rd arg
            // 2. the value received should be a corresponding reactive/readonly.
            return callback.call(thisArg, wrap(value), wrap(key), observed);
        });
    };
}
function createIterableMethod(method, isReadonly, isShallow) {
    return function (...args) {
        const target = this["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const targetIsMap = isMap(rawTarget);
        const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
        const isKeyOnly = method === 'keys' && targetIsMap;
        const innerIterator = target[method](...args);
        const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
        !isReadonly &&
            track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
        // return a wrapped iterator which returns observed versions of the
        // values emitted from the real iterator
        return {
            // iterator protocol
            next() {
                const { value, done } = innerIterator.next();
                return done
                    ? { value, done }
                    : {
                        value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                        done
                    };
            },
            // iterable protocol
            [Symbol.iterator]() {
                return this;
            }
        };
    };
}
function createReadonlyMethod(type) {
    return function (...args) {
        {
            const key = args[0] ? `on key "${args[0]}" ` : ``;
            console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
        }
        return type === "delete" /* DELETE */ ? false : this;
    };
}
const mutableInstrumentations = {
    get(key) {
        return get$1(this, key);
    },
    get size() {
        return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
};
const shallowInstrumentations = {
    get(key) {
        return get$1(this, key, false, true);
    },
    get size() {
        return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
};
const readonlyInstrumentations = {
    get(key) {
        return get$1(this, key, true);
    },
    get size() {
        return size(this, true);
    },
    has(key) {
        return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add" /* ADD */),
    set: createReadonlyMethod("set" /* SET */),
    delete: createReadonlyMethod("delete" /* DELETE */),
    clear: createReadonlyMethod("clear" /* CLEAR */),
    forEach: createForEach(true, false)
};
const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
iteratorMethods.forEach(method => {
    mutableInstrumentations[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations[method] = createIterableMethod(method, true, false);
    shallowInstrumentations[method] = createIterableMethod(method, false, true);
});
function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow
        ? shallowInstrumentations
        : isReadonly
            ? readonlyInstrumentations
            : mutableInstrumentations;
    return (target, key, receiver) => {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_raw" /* RAW */) {
            return target;
        }
        return Reflect.get(hasOwn(instrumentations, key) && key in target
            ? instrumentations
            : target, key, receiver);
    };
}
const mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
    get: createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false)
};
function checkIdentityKeys(target, has, key) {
    const rawKey = toRaw(key);
    if (rawKey !== key && has.call(target, rawKey)) {
        const type = toRawType(target);
        console.warn(`Reactive ${type} contains both the raw and reactive ` +
            `versions of the same object${type === `Map` ? `as keys` : ``}, ` +
            `which can lead to inconsistencies. ` +
            `Avoid differentiating between the raw and reactive versions ` +
            `of an object and only use the reactive version if possible.`);
    }
}

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
function targetTypeMap(rawType) {
    switch (rawType) {
        case 'Object':
        case 'Array':
            return 1 /* COMMON */;
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return 2 /* COLLECTION */;
        default:
            return 0 /* INVALID */;
    }
}
function getTargetType(value) {
    return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
        ? 0 /* INVALID */
        : targetTypeMap(toRawType(value));
}
function reactive(target) {
    // if trying to observe a readonly proxy, return the readonly version.
    if (target && target["__v_isReadonly" /* IS_READONLY */]) {
        return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
}
// Return a reactive-copy of the original object, where only the root level
// properties are reactive, and does NOT unwrap refs nor recursively convert
// returned properties.
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers);
}
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers);
}
// Return a reactive-copy of the original object, where only the root level
// properties are readonly, and does NOT unwrap refs nor recursively convert
// returned properties.
// This is used for creating the props proxy object for stateful components.
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers, readonlyCollectionHandlers);
}
function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
    if (!isObject(target)) {
        {
            console.warn(`value cannot be made reactive: ${String(target)}`);
        }
        return target;
    }
    // target is already a Proxy, return it.
    // exception: calling readonly() on a reactive object
    if (target["__v_raw" /* RAW */] &&
        !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
        return target;
    }
    // target already has corresponding Proxy
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    // only a whitelist of value types can be observed.
    const targetType = getTargetType(target);
    if (targetType === 0 /* INVALID */) {
        return target;
    }
    const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}
function isReactive(value) {
    if (isReadonly(value)) {
        return isReactive(value["__v_raw" /* RAW */]);
    }
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}
function isReadonly(value) {
    return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
    return ((observed && toRaw(observed["__v_raw" /* RAW */])) || observed);
}
function markRaw(value) {
    def(value, "__v_skip" /* SKIP */, true);
    return value;
}

const convert = (val) => isObject(val) ? reactive(val) : val;
function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
}
function ref(value) {
    return createRef(value);
}
function shallowRef(value) {
    return createRef(value, true);
}
class RefImpl {
    constructor(_rawValue, _shallow = false) {
        this._rawValue = _rawValue;
        this._shallow = _shallow;
        this.__v_isRef = true;
        this._value = _shallow ? _rawValue : convert(_rawValue);
    }
    get value() {
        track(toRaw(this), "get" /* GET */, 'value');
        return this._value;
    }
    set value(newVal) {
        if (hasChanged(toRaw(newVal), this._rawValue)) {
            this._rawValue = newVal;
            this._value = this._shallow ? newVal : convert(newVal);
            trigger(toRaw(this), "set" /* SET */, 'value', newVal);
        }
    }
}
function createRef(rawValue, shallow = false) {
    if (isRef(rawValue)) {
        return rawValue;
    }
    return new RefImpl(rawValue, shallow);
}
function triggerRef(ref) {
    trigger(ref, "set" /* SET */, 'value',  ref.value );
}
function unref(ref) {
    return isRef(ref) ? ref.value : ref;
}
const shallowUnwrapHandlers = {
    get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
        }
        else {
            return Reflect.set(target, key, value, receiver);
        }
    }
};
function proxyRefs(objectWithRefs) {
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class CustomRefImpl {
    constructor(factory) {
        this.__v_isRef = true;
        const { get, set } = factory(() => track(this, "get" /* GET */, 'value'), () => trigger(this, "set" /* SET */, 'value'));
        this._get = get;
        this._set = set;
    }
    get value() {
        return this._get();
    }
    set value(newVal) {
        this._set(newVal);
    }
}
function customRef(factory) {
    return new CustomRefImpl(factory);
}
function toRefs(object) {
    if ( !isProxy(object)) {
        console.warn(`toRefs() expects a reactive object but received a plain one.`);
    }
    const ret = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}
class ObjectRefImpl {
    constructor(_object, _key) {
        this._object = _object;
        this._key = _key;
        this.__v_isRef = true;
    }
    get value() {
        return this._object[this._key];
    }
    set value(newVal) {
        this._object[this._key] = newVal;
    }
}
function toRef(object, key) {
    return isRef(object[key])
        ? object[key]
        : new ObjectRefImpl(object, key);
}

class ComputedRefImpl {
    constructor(getter, _setter, isReadonly) {
        this._setter = _setter;
        this._dirty = true;
        this.__v_isRef = true;
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(toRaw(this), "set" /* SET */, 'value');
                }
            }
        });
        this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
    }
    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false;
        }
        track(toRaw(this), "get" /* GET */, 'value');
        return this._value;
    }
    set value(newValue) {
        this._setter(newValue);
    }
}
function computed(getterOrOptions) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter =  () => {
                console.warn('Write operation failed: computed value is readonly');
            }
            ;
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
}

/**
 * @description 定义属性，不可修改，不可遍历，不可删除
 */
function defineReadonlyProp(obj, key, value) {
    var descriptor = {
        value: value,
        writable: false,
        configurable: false,
        enumerable: "test" === 'production'
    };
    return Object.defineProperty(obj, key, descriptor);
}
/**
 * @description 定义不可遍历属性
 */
function disabledEnumerable(obj, key, value) {
    var descriptor = {
        value: value,
        writable: true,
        configurable: true,
        enumerable: "test" === 'production'
    };
    return Object.defineProperty(obj, key, descriptor);
}
var transformOnName = function (name) {
    return "on" + name.replace(/\w/, function (s) { return s.toUpperCase(); });
};
var isType = function (type) { return function (val) {
    return Object.prototype.toString.call(val) === "[object " + type + "]";
}; };
var isObject$1 = isType('Object');
var isFunction$1 = isType('Function');
// 是否是基本类型的值
var isPrimitive = function (val) { return typeof val !== 'object' || val === null; };
function getType(val) {
    return Object.prototype.toString.call(val).match(/\s(\w+)/)[1];
}
function getRawData(data) {
    return isPrimitive(data)
        ? data
        : isRef(data)
            ? unref(data)
            : toRaw(data);
}
function cloneDeepRawData(data) {
    return isPrimitive(data)
        ? data
        : JSON.parse(JSON.stringify(data, function (key, val) {
            return getRawData(val);
        }));
}
function cloneDeep(data) {
    return JSON.parse(JSON.stringify(data));
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function initEvents(ctx) {
    if (ctx === void 0) { ctx = {}; }
    defineReadonlyProp(ctx, '__events__', {});
    disabledEnumerable(ctx, '$on', function events$on(name, cb) {
        if (!ctx.__events__[name])
            ctx.__events__[name] = [];
        if (isFunction$1(cb)) {
            ctx.__events__[name].push(cb);
        }
    });
    disabledEnumerable(ctx, '$once', function events$once(name, cb) {
        if (!ctx.__events__[name])
            ctx.__events__[name] = [];
        if (isFunction$1(cb)) {
            cb.__once = true;
            ctx.__events__[name].push(cb);
        }
    });
    disabledEnumerable(ctx, '$emit', function events$emit(name) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if ((_a = ctx.__events__[name]) === null || _a === void 0 ? void 0 : _a.length) {
            for (var i = 0; i < ctx.__events__[name].length; i++) {
                var cb = ctx.__events__[name][i];
                cb.call.apply(cb, __spreadArrays([ctx], args));
                if (cb.__once) {
                    ctx.$off(name, cb, i);
                    i--;
                }
            }
        }
    });
    disabledEnumerable(ctx, '$off', function events$off(name, cb, offCallbackIndex) {
        var _a;
        if ((_a = ctx.__events__[name]) === null || _a === void 0 ? void 0 : _a.length) {
            // 传入index减少寻找时间
            var i = offCallbackIndex ||
                ctx.__events__[name].findIndex(function (fn) { return fn === cb; });
            if (i > -1) {
                ctx.__events__[name].splice(i, 1);
            }
        }
    });
    return ctx;
}

var mixins = null;
function globalMixins(m) {
    mixins = m;
}
function handlerMixins(type, ctx) {
    if (mixins && isObject$1(mixins)) {
        var mixinDataAndMethod_1 = function (key, val) {
            if (key === 'data') {
                if (isObject$1(val)) {
                    if (!ctx.data)
                        ctx.data = {};
                    Object.entries(val).forEach(function (_a) {
                        var key = _a[0], val = _a[1];
                        // mixins优先级比页面定义低
                        if (!ctx.data[key]) {
                            ctx.data[key] = val;
                        }
                    });
                }
            }
            else {
                // mixins优先级比页面定义低
                if (!ctx[key]) {
                    ctx[key] = val;
                }
            }
        };
        isObject$1(mixins[type]) &&
            Object.entries(mixins[type]).forEach(function (_a) {
                var key = _a[0], val = _a[1];
                if (key === 'hooks' && isObject$1(val)) {
                    Object.entries(val).forEach(function (_a) {
                        var _b;
                        var lcName = _a[0], hooksFn = _a[1];
                        if (ctx.__hooks__[lcName]) {
                            if (!Array.isArray(hooksFn))
                                hooksFn = [hooksFn];
                            (_b = ctx.__hooks__[lcName]).push.apply(_b, hooksFn);
                        }
                    });
                }
                else {
                    mixinDataAndMethod_1(key, val);
                }
            });
        // 处理公用mixins
        Object.entries(mixins).forEach(function (_a) {
            var key = _a[0], val = _a[1];
            if (key === 'app' || key === 'page' || key === 'component')
                return;
            mixinDataAndMethod_1(key, val);
        });
    }
    return ctx;
}

/**
 * @description diff新旧数据，返回差异路径对象
 *
 * 对值的操作分三种
 *
 *      新增：{ 值路径：新值 }
 *
 *      修改：{ 值路径：新值 }
 *
 *      删除：{ 父值路径：父新值 }
 *
 * @warning 不要删除根节点this.data上面的值，因为在小程序中无法通过this.setData来删除this.data上面的值
 * @param {Object} oldRootData 旧值: this.data
 * @param {Object} newRootData 新值: this.data$
 * @return {Object}  传给this.setData的值
 */
function diffData(oldRootData, newRootData) {
    // 更新对象，最终传给this.setData的值
    var updateObject = null;
    var diffQueue = [];
    // 添加更新对象
    var addUpdateData = function (key, val) {
        !updateObject && (updateObject = {});
        // 基本类型直接赋值，引用类型解除引用
        updateObject[key] = isPrimitive(val) ? val : cloneDeepRawData(val);
    };
    /* 处理根对象 */
    // 获取原始值
    newRootData = getRawData(newRootData);
    // 根对象所有的旧键
    var oldRootKeys = Object.keys(oldRootData);
    // 根对象所有的新键
    var newRootKeys = Object.keys(newRootData);
    oldRootKeys.forEach(function (key) {
        // 检查新键中有没有此key
        var keyIndex = newRootKeys.findIndex(function (k) { return k === key; });
        // 如果有，就从newRootKeys中去除当前key，这样在遍历结束后，newRootKeys中还存在的key，就是新增的key了
        keyIndex > -1 && newRootKeys.splice(keyIndex, 1);
        // ⚠️ 根对象不会处理删除操作，因为在小程序中无法使用setData来删除this.data上面的值
        if (newRootData[key] !== void 0) {
            // 将子属性，放入diff队列中
            diffQueue.push([oldRootData[key], newRootData[key], key]);
        }
    });
    // 有新增的值
    if (newRootKeys.length) {
        newRootKeys.forEach(function (key) {
            // 将新增值加入更新对象
            addUpdateData(key, newRootData[key]);
        });
    }
    var _loop_1 = function () {
        var _a = diffQueue.shift(), oldData = _a[0], proxyData = _a[1], keyPath = _a[2];
        // 获取原始值
        var newData = getRawData(proxyData);
        // 如果相等，代表是基本类型
        if (oldData === newData) {
            return "continue";
        }
        // 旧值类型
        var oldType = getType(oldData);
        // 新值类型
        var newType = getType(newData);
        // 类型不等，直接重设
        if (oldType !== newType) {
            addUpdateData(keyPath, newData);
            return "continue";
        }
        // 基本类型（JSON中没有函数正则等数据类型）
        if (newType !== 'Object' && newType !== 'Array') {
            // 如果能走到这，说明肯定不相等
            addUpdateData(keyPath, newData);
            return "continue";
        }
        // 数组
        if (newType === 'Array') {
            // 长度不等，直接重设
            // 数组和对象不同，无法根据key值来判断哪些值是新增的，哪些值是删除的
            if (oldData.length !== newData.length) {
                addUpdateData(keyPath, newData);
                return "continue";
            }
            // 长度相等，将数组的每一项推入diff队列中
            for (var i = 0, l = oldData.length; i < l; i++) {
                diffQueue.push([oldData[i], newData[i], keyPath + "." + i]);
            }
            return "continue";
        }
        // 对象
        // 所有的旧键
        var oldKeys = Object.keys(oldData);
        // 所有的新键
        var newKeys = Object.keys(newData);
        // 旧长新短：删除操作，直接重设
        if (oldKeys.length > newKeys.length) {
            addUpdateData(keyPath, newData);
            return "continue";
        }
        /**
         * 存放需要对比子属性的数组
         * 之所以用一个数组记录，而不是直接推入diff队列
         * 是因为如果出现了删除操作就不需要再对比子属性，直接重写当前属性即可
         * 所以要延迟推入diff队列的时机
         */
        var diffChild = [];
        var _loop_2 = function (i, l) {
            // 旧键
            var key = oldKeys[i];
            // 检查新键中有没有此key
            var keyIndex = newKeys.findIndex(function (k) { return k === key; });
            /**
             * 旧有新无：删除操作，直接重设
             * oldData: {a: 1, b: 1, c: 1}
             * newData: {a: 1, b: 1, d: 1}
             */
            if (keyIndex === -1) {
                addUpdateData(keyPath, newData);
                return "continue-diffQueueLoop";
            }
            // 从newKeys中去除当前key，这样在遍历结束后，newKeys中还存在的key，就是新增的key
            newKeys.splice(keyIndex, 1);
            diffChild.push([oldData[key], newData[key], keyPath + "." + key]);
        };
        for (var i = 0, l = oldKeys.length; i < l; i++) {
            var state_2 = _loop_2(i);
            switch (state_2) {
                case "continue-diffQueueLoop": return state_2;
            }
        }
        // 有新增的值
        if (newKeys.length) {
            newKeys.forEach(function (key) {
                addUpdateData(keyPath + "." + key, newData[key]);
            });
        }
        if (diffChild.length) {
            // 将需要diff的子属性放入diff队列
            diffQueue.push.apply(diffQueue, diffChild);
        }
    };
    /* 根对象处理完毕，开始 diff 子属性 */
    // 使用循环而非递归，避免数据量过大时爆栈
    diffQueueLoop: while (diffQueue.length) {
        var state_1 = _loop_1();
        switch (state_1) {
            case "continue-diffQueueLoop": continue diffQueueLoop;
        }
    }
    return updateObject;
}

// 需要更新的异步队列
var setDataCtxQueue = new Set();
// 是否注册了异步任务
var isFlushing = false;
function setDataQueueJob(ctx) {
    if (!setDataCtxQueue.has(ctx)) {
        setDataCtxQueue.add(ctx);
        setDataQueueFlush();
    }
}
function setDataQueueFlush() {
    if (!isFlushing) {
        isFlushing = true;
        Promise.resolve().then(flushSetDataJobs);
    }
}
function flushSetDataJobs() {
    setDataCtxQueue.forEach(function (ctx) {
        var res = diffData(ctx.data, ctx.data$);
        if (!res)
            return ctx.$emit('setDataRender:resolve');
        // console.log('响应式触发this.setData，参数: ', res)
        ctx.setData(res, function () {
            ctx.$emit('setDataRender:resolve');
        });
    });
    setDataCtxQueue.clear();
    isFlushing = false;
}
function setDataNextTick(cb) {
    var resolve;
    var promise = new Promise(function (r) { return (resolve = r); });
    this.$once('setDataRender:resolve', resolve);
    if (isFunction$1(cb)) {
        promise = promise.then(cb);
    }
    return promise;
}

const stack = [];
function pushWarningContext(vnode) {
    stack.push(vnode);
}
function popWarningContext() {
    stack.pop();
}
function warn(msg, ...args) {
    // avoid props formatting or warn handler tracking deps that might be mutated
    // during patch, leading to infinite recursion.
    pauseTracking();
    const instance = stack.length ? stack[stack.length - 1].component : null;
    const appWarnHandler = instance && instance.appContext.config.warnHandler;
    const trace = getComponentTrace();
    if (appWarnHandler) {
        callWithErrorHandling(appWarnHandler, instance, 11 /* APP_WARN_HANDLER */, [
            msg + args.join(''),
            instance && instance.proxy,
            trace
                .map(({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`)
                .join('\n'),
            trace
        ]);
    }
    else {
        const warnArgs = [`[Vue warn]: ${msg}`, ...args];
        /* istanbul ignore if */
        if (trace.length &&
            // avoid spamming console during tests
            !false) {
            warnArgs.push(`\n`, ...formatTrace(trace));
        }
        console.warn(...warnArgs);
    }
    resetTracking();
}
function getComponentTrace() {
    let currentVNode = stack[stack.length - 1];
    if (!currentVNode) {
        return [];
    }
    // we can't just use the stack because it will be incomplete during updates
    // that did not start from the root. Re-construct the parent chain using
    // instance parent pointers.
    const normalizedStack = [];
    while (currentVNode) {
        const last = normalizedStack[0];
        if (last && last.vnode === currentVNode) {
            last.recurseCount++;
        }
        else {
            normalizedStack.push({
                vnode: currentVNode,
                recurseCount: 0
            });
        }
        const parentInstance = currentVNode.component && currentVNode.component.parent;
        currentVNode = parentInstance && parentInstance.vnode;
    }
    return normalizedStack;
}
/* istanbul ignore next */
function formatTrace(trace) {
    const logs = [];
    trace.forEach((entry, i) => {
        logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry));
    });
    return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
    const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
    const isRoot = vnode.component ? vnode.component.parent == null : false;
    const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
    const close = `>` + postfix;
    return vnode.props
        ? [open, ...formatProps(vnode.props), close]
        : [open + close];
}
/* istanbul ignore next */
function formatProps(props) {
    const res = [];
    const keys = Object.keys(props);
    keys.slice(0, 3).forEach(key => {
        res.push(...formatProp(key, props[key]));
    });
    if (keys.length > 3) {
        res.push(` ...`);
    }
    return res;
}
/* istanbul ignore next */
function formatProp(key, value, raw) {
    if (isString(value)) {
        value = JSON.stringify(value);
        return raw ? value : [`${key}=${value}`];
    }
    else if (typeof value === 'number' ||
        typeof value === 'boolean' ||
        value == null) {
        return raw ? value : [`${key}=${value}`];
    }
    else if (isRef(value)) {
        value = formatProp(key, toRaw(value.value), true);
        return raw ? value : [`${key}=Ref<`, value, `>`];
    }
    else if (isFunction(value)) {
        return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
    }
    else {
        value = toRaw(value);
        return raw ? value : [`${key}=`, value];
    }
}

const ErrorTypeStrings = {
    ["bc" /* BEFORE_CREATE */]: 'beforeCreate hook',
    ["c" /* CREATED */]: 'created hook',
    ["bm" /* BEFORE_MOUNT */]: 'beforeMount hook',
    ["m" /* MOUNTED */]: 'mounted hook',
    ["bu" /* BEFORE_UPDATE */]: 'beforeUpdate hook',
    ["u" /* UPDATED */]: 'updated',
    ["bum" /* BEFORE_UNMOUNT */]: 'beforeUnmount hook',
    ["um" /* UNMOUNTED */]: 'unmounted hook',
    ["a" /* ACTIVATED */]: 'activated hook',
    ["da" /* DEACTIVATED */]: 'deactivated hook',
    ["ec" /* ERROR_CAPTURED */]: 'errorCaptured hook',
    ["rtc" /* RENDER_TRACKED */]: 'renderTracked hook',
    ["rtg" /* RENDER_TRIGGERED */]: 'renderTriggered hook',
    [0 /* SETUP_FUNCTION */]: 'setup function',
    [1 /* RENDER_FUNCTION */]: 'render function',
    [2 /* WATCH_GETTER */]: 'watcher getter',
    [3 /* WATCH_CALLBACK */]: 'watcher callback',
    [4 /* WATCH_CLEANUP */]: 'watcher cleanup function',
    [5 /* NATIVE_EVENT_HANDLER */]: 'native event handler',
    [6 /* COMPONENT_EVENT_HANDLER */]: 'component event handler',
    [7 /* VNODE_HOOK */]: 'vnode hook',
    [8 /* DIRECTIVE_HOOK */]: 'directive hook',
    [9 /* TRANSITION_HOOK */]: 'transition hook',
    [10 /* APP_ERROR_HANDLER */]: 'app errorHandler',
    [11 /* APP_WARN_HANDLER */]: 'app warnHandler',
    [12 /* FUNCTION_REF */]: 'ref function',
    [13 /* ASYNC_COMPONENT_LOADER */]: 'async component loader',
    [14 /* SCHEDULER */]: 'scheduler flush. This is likely a Vue internals bug. ' +
        'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next'
};
function callWithErrorHandling(fn, instance, type, args) {
    let res;
    try {
        res = args ? fn(...args) : fn();
    }
    catch (err) {
        handleError(err, instance, type);
    }
    return res;
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
    if (isFunction(fn)) {
        const res = callWithErrorHandling(fn, instance, type, args);
        if (res && isPromise(res)) {
            res.catch(err => {
                handleError(err, instance, type);
            });
        }
        return res;
    }
    const values = [];
    for (let i = 0; i < fn.length; i++) {
        values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
}
function handleError(err, instance, type, throwInDev = true) {
    const contextVNode = instance ? instance.vnode : null;
    if (instance) {
        let cur = instance.parent;
        // the exposed instance is the render proxy to keep it consistent with 2.x
        const exposedInstance = instance.proxy;
        // in production the hook receives only the error code
        const errorInfo =  ErrorTypeStrings[type] ;
        while (cur) {
            const errorCapturedHooks = cur.ec;
            if (errorCapturedHooks) {
                for (let i = 0; i < errorCapturedHooks.length; i++) {
                    if (errorCapturedHooks[i](err, exposedInstance, errorInfo)) {
                        return;
                    }
                }
            }
            cur = cur.parent;
        }
        // app-level handling
        const appErrorHandler = instance.appContext.config.errorHandler;
        if (appErrorHandler) {
            callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
            return;
        }
    }
    logError(err, type, contextVNode, throwInDev);
}
function logError(err, type, contextVNode, throwInDev = true) {
    {
        const info = ErrorTypeStrings[type];
        if (contextVNode) {
            pushWarningContext(contextVNode);
        }
        warn(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
        if (contextVNode) {
            popWarningContext();
        }
        // crash in dev by default so it's more noticeable
        if (throwInDev) {
            throw err;
        }
        else {
            console.error(err);
        }
    }
}

let isFlushing$1 = false;
let isFlushPending = false;
const queue = [];
let flushIndex = 0;
const pendingPreFlushCbs = [];
let activePreFlushCbs = null;
let preFlushIndex = 0;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;
let currentPreFlushParentJob = null;
const RECURSION_LIMIT = 100;
function nextTick(fn) {
    const p = currentFlushPromise || resolvedPromise;
    return fn ? p.then(fn) : p;
}
function queueJob(job) {
    // the dedupe search uses the startIndex argument of Array.includes()
    // by default the search index includes the current job that is being run
    // so it cannot recursively trigger itself again.
    // if the job is a watch() callback, the search will start with a +1 index to
    // allow it recursively trigger itself - it is the user's responsibility to
    // ensure it doesn't end up in an infinite loop.
    if ((!queue.length ||
        !queue.includes(job, isFlushing$1 && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
        job !== currentPreFlushParentJob) {
        queue.push(job);
        queueFlush();
    }
}
function queueFlush() {
    if (!isFlushing$1 && !isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvedPromise.then(flushJobs);
    }
}
function queueCb(cb, activeQueue, pendingQueue, index) {
    if (!isArray(cb)) {
        if (!activeQueue ||
            !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
            pendingQueue.push(cb);
        }
    }
    else {
        // if cb is an array, it is a component lifecycle hook which can only be
        // triggered by a job, which is already deduped in the main queue, so
        // we can skip duplicate check here to improve perf
        pendingQueue.push(...cb);
    }
    queueFlush();
}
function queuePreFlushCb(cb) {
    queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
}
function queuePostFlushCb(cb) {
    queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
}
function flushPreFlushCbs(seen, parentJob = null) {
    if (pendingPreFlushCbs.length) {
        currentPreFlushParentJob = parentJob;
        activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
        pendingPreFlushCbs.length = 0;
        {
            seen = seen || new Map();
        }
        for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
            {
                checkRecursiveUpdates(seen, activePreFlushCbs[preFlushIndex]);
            }
            activePreFlushCbs[preFlushIndex]();
        }
        activePreFlushCbs = null;
        preFlushIndex = 0;
        currentPreFlushParentJob = null;
        // recursively flush until it drains
        flushPreFlushCbs(seen, parentJob);
    }
}
function flushPostFlushCbs(seen) {
    if (pendingPostFlushCbs.length) {
        const deduped = [...new Set(pendingPostFlushCbs)];
        pendingPostFlushCbs.length = 0;
        // #1947 already has active queue, nested flushPostFlushCbs call
        if (activePostFlushCbs) {
            activePostFlushCbs.push(...deduped);
            return;
        }
        activePostFlushCbs = deduped;
        {
            seen = seen || new Map();
        }
        activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
        for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
            {
                checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex]);
            }
            activePostFlushCbs[postFlushIndex]();
        }
        activePostFlushCbs = null;
        postFlushIndex = 0;
    }
}
const getId = (job) => job.id == null ? Infinity : job.id;
function flushJobs(seen) {
    isFlushPending = false;
    isFlushing$1 = true;
    {
        seen = seen || new Map();
    }
    flushPreFlushCbs(seen);
    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child so its render effect will have smaller
    //    priority number)
    // 2. If a component is unmounted during a parent component's update,
    //    its update can be skipped.
    // Jobs can never be null before flush starts, since they are only invalidated
    // during execution of another flushed job.
    queue.sort((a, b) => getId(a) - getId(b));
    try {
        for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
            const job = queue[flushIndex];
            if (job) {
                if (("test" !== 'production')) {
                    checkRecursiveUpdates(seen, job);
                }
                callWithErrorHandling(job, null, 14 /* SCHEDULER */);
            }
        }
    }
    finally {
        flushIndex = 0;
        queue.length = 0;
        flushPostFlushCbs(seen);
        isFlushing$1 = false;
        currentFlushPromise = null;
        // some postFlushCb queued jobs!
        // keep flushing until it drains.
        if (queue.length || pendingPostFlushCbs.length) {
            flushJobs(seen);
        }
    }
}
function checkRecursiveUpdates(seen, fn) {
    if (!seen.has(fn)) {
        seen.set(fn, 1);
    }
    else {
        const count = seen.get(fn);
        if (count > RECURSION_LIMIT) {
            throw new Error(`Maximum recursive updates exceeded. ` +
                `This means you have a reactive effect that is mutating its own ` +
                `dependencies and thus recursively triggering itself. Possible sources ` +
                `include component template, render function, updated hook or ` +
                `watcher source function.`);
        }
        else {
            seen.set(fn, count + 1);
        }
    }
}
const hmrDirtyComponents = new Set();
// Expose the HMR runtime on the global object
// This makes it entirely tree-shakable without polluting the exports and makes
// it easier to be used in toolings like vue-loader
// Note: for a component to be eligible for HMR it also needs the __hmrId option
// to be set so that its instances can be registered / removed.
{
    const globalObject = typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
            ? self
            : typeof window !== 'undefined'
                ? window
                : {};
    globalObject.__VUE_HMR_RUNTIME__ = {
        createRecord: tryWrap(createRecord),
        rerender: tryWrap(rerender),
        reload: tryWrap(reload)
    };
}
const map = new Map();
function createRecord(id) {
    if (map.has(id)) {
        return false;
    }
    map.set(id, new Set());
    return true;
}
function rerender(id, newRender) {
    const record = map.get(id);
    if (!record)
        return;
    // Array.from creates a snapshot which avoids the set being mutated during
    // updates
    Array.from(record).forEach(instance => {
        if (newRender) {
            instance.render = newRender;
        }
        instance.renderCache = [];
        instance.update();
    });
}
function reload(id, newComp) {
    const record = map.get(id);
    if (!record)
        return;
    // Array.from creates a snapshot which avoids the set being mutated during
    // updates
    Array.from(record).forEach(instance => {
        const comp = instance.type;
        if (!hmrDirtyComponents.has(comp)) {
            // 1. Update existing comp definition to match new one
            newComp = isClassComponent(newComp) ? newComp.__vccOpts : newComp;
            extend(comp, newComp);
            for (const key in comp) {
                if (!(key in newComp)) {
                    delete comp[key];
                }
            }
            // 2. Mark component dirty. This forces the renderer to replace the component
            // on patch.
            hmrDirtyComponents.add(comp);
            // 3. Make sure to unmark the component after the reload.
            queuePostFlushCb(() => {
                hmrDirtyComponents.delete(comp);
            });
        }
        if (instance.parent) {
            // 4. Force the parent instance to re-render. This will cause all updated
            // components to be unmounted and re-mounted. Queue the update so that we
            // don't end up forcing the same parent to re-render multiple times.
            queueJob(instance.parent.update);
        }
        else if (instance.appContext.reload) {
            // root instance mounted via createApp() has a reload method
            instance.appContext.reload();
        }
        else if (typeof window !== 'undefined') {
            // root instance inside tree created via raw render(). Force reload.
            window.location.reload();
        }
        else {
            console.warn('[HMR] Root or manually mounted instance modified. Full reload required.');
        }
    });
}
function tryWrap(fn) {
    return (id, arg) => {
        try {
            return fn(id, arg);
        }
        catch (e) {
            console.error(e);
            console.warn(`[HMR] Something went wrong during Vue component hot-reload. ` +
                `Full reload required.`);
        }
    };
}
function queueEffectWithSuspense(fn, suspense) {
    if (suspense && suspense.pendingBranch) {
        if (isArray(fn)) {
            suspense.effects.push(...fn);
        }
        else {
            suspense.effects.push(fn);
        }
    }
    else {
        queuePostFlushCb(fn);
    }
}
const queuePostRenderEffect =  queueEffectWithSuspense
    ;

// Simple effect.
function watchEffect(effect, options) {
    return doWatch(effect, null, options);
}
// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {};
// implementation
function watch(source, cb, options) {
    if ( !isFunction(cb)) {
        warn(`\`watch(fn, options?)\` signature has been moved to a separate API. ` +
            `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
            `supports \`watch(source, cb, options?) signature.`);
    }
    return doWatch(source, cb, options);
}
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ, instance = currentInstance) {
    if ( !cb) {
        if (immediate !== undefined) {
            warn(`watch() "immediate" option is only respected when using the ` +
                `watch(source, callback, options?) signature.`);
        }
        if (deep !== undefined) {
            warn(`watch() "deep" option is only respected when using the ` +
                `watch(source, callback, options?) signature.`);
        }
    }
    const warnInvalidSource = (s) => {
        warn(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` +
            `a reactive object, or an array of these types.`);
    };
    let getter;
    const isRefSource = isRef(source);
    if (isRefSource) {
        getter = () => source.value;
    }
    else if (isReactive(source)) {
        getter = () => source;
        deep = true;
    }
    else if (isArray(source)) {
        getter = () => source.map(s => {
            if (isRef(s)) {
                return s.value;
            }
            else if (isReactive(s)) {
                return traverse(s);
            }
            else if (isFunction(s)) {
                return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */);
            }
            else {
                 warnInvalidSource(s);
            }
        });
    }
    else if (isFunction(source)) {
        if (cb) {
            // getter with cb
            getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */);
        }
        else {
            // no cb -> simple effect
            getter = () => {
                if (instance && instance.isUnmounted) {
                    return;
                }
                if (cleanup) {
                    cleanup();
                }
                return callWithErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onInvalidate]);
            };
        }
    }
    else {
        getter = NOOP;
         warnInvalidSource(source);
    }
    if (cb && deep) {
        const baseGetter = getter;
        getter = () => traverse(baseGetter());
    }
    let cleanup;
    const onInvalidate = (fn) => {
        cleanup = runner.options.onStop = () => {
            callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
        };
    };
    let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE;
    const job = () => {
        if (!runner.active) {
            return;
        }
        if (cb) {
            // watch(source, cb)
            const newValue = runner();
            if (deep || isRefSource || hasChanged(newValue, oldValue)) {
                // cleanup before running cb again
                if (cleanup) {
                    cleanup();
                }
                callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                    newValue,
                    // pass undefined as the old value when it's changed for the first time
                    oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                    onInvalidate
                ]);
                oldValue = newValue;
            }
        }
        else {
            // watchEffect
            runner();
        }
    };
    // important: mark the job as a watcher callback so that scheduler knows it
    // it is allowed to self-trigger (#1727)
    job.allowRecurse = !!cb;
    let scheduler;
    if (flush === 'sync') {
        scheduler = job;
    }
    else if (flush === 'post') {
        scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
    }
    else {
        // default: 'pre'
        scheduler = () => {
            if (!instance || instance.isMounted) {
                queuePreFlushCb(job);
            }
            else {
                // with 'pre' option, the first call must happen before
                // the component is mounted so it is called synchronously.
                job();
            }
        };
    }
    const runner = effect(getter, {
        lazy: true,
        onTrack,
        onTrigger,
        scheduler
    });
    // initial run
    if (cb) {
        if (immediate) {
            job();
        }
        else {
            oldValue = runner();
        }
    }
    else if (flush === 'post') {
        queuePostRenderEffect(runner, instance && instance.suspense);
    }
    else {
        runner();
    }
    return () => {
        stop(runner);
        if (instance) {
            remove(instance.effects, runner);
        }
    };
}
// this.$watch
function instanceWatch(source, cb, options) {
    const publicThis = this.proxy;
    const getter = isString(source)
        ? () => publicThis[source]
        : source.bind(publicThis);
    return doWatch(getter, cb.bind(publicThis), options, this);
}
function traverse(value, seen = new Set()) {
    if (!isObject(value) || seen.has(value)) {
        return value;
    }
    seen.add(value);
    if (isRef(value)) {
        traverse(value.value, seen);
    }
    else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], seen);
        }
    }
    else if (isMap(value)) {
        value.forEach((_, key) => {
            // to register mutation dep for existing keys
            traverse(value.get(key), seen);
        });
    }
    else if (isSet(value)) {
        value.forEach(v => {
            traverse(v, seen);
        });
    }
    else {
        for (const key in value) {
            traverse(value[key], seen);
        }
    }
    return value;
}
let isInBeforeCreate = false;
function resolveMergedOptions(instance) {
    const raw = instance.type;
    const { __merged, mixins, extends: extendsOptions } = raw;
    if (__merged)
        return __merged;
    const globalMixins = instance.appContext.mixins;
    if (!globalMixins.length && !mixins && !extendsOptions)
        return raw;
    const options = {};
    globalMixins.forEach(m => mergeOptions(options, m, instance));
    mergeOptions(options, raw, instance);
    return (raw.__merged = options);
}
function mergeOptions(to, from, instance) {
    const strats = instance.appContext.config.optionMergeStrategies;
    const { mixins, extends: extendsOptions } = from;
    extendsOptions && mergeOptions(to, extendsOptions, instance);
    mixins &&
        mixins.forEach((m) => mergeOptions(to, m, instance));
    for (const key in from) {
        if (strats && hasOwn(strats, key)) {
            to[key] = strats[key](to[key], from[key], instance.proxy, key);
        }
        else {
            to[key] = from[key];
        }
    }
}

const publicPropertiesMap = extend(Object.create(null), {
    $: i => i,
    $el: i => i.vnode.el,
    $data: i => i.data,
    $props: i => ( shallowReadonly(i.props) ),
    $attrs: i => ( shallowReadonly(i.attrs) ),
    $slots: i => ( shallowReadonly(i.slots) ),
    $refs: i => ( shallowReadonly(i.refs) ),
    $parent: i => i.parent && i.parent.proxy,
    $root: i => i.root && i.root.proxy,
    $emit: i => i.emit,
    $options: i => (__VUE_OPTIONS_API__ ? resolveMergedOptions(i) : i.type),
    $forceUpdate: i => () => queueJob(i.update),
    $nextTick: () => nextTick,
    $watch: i => (__VUE_OPTIONS_API__ ? instanceWatch.bind(i) : NOOP)
});
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
        // let @vue/reactivity know it should never observe Vue public instances.
        if (key === "__v_skip" /* SKIP */) {
            return true;
        }
        // data / props / ctx
        // This getter gets called for every property access on the render context
        // during render and is a major hotspot. The most expensive part of this
        // is the multiple hasOwn() calls. It's much faster to do a simple property
        // access on a plain object, so we use an accessCache object (with null
        // prototype) to memoize what access type a key corresponds to.
        let normalizedProps;
        if (key[0] !== '$') {
            const n = accessCache[key];
            if (n !== undefined) {
                switch (n) {
                    case 0 /* SETUP */:
                        return setupState[key];
                    case 1 /* DATA */:
                        return data[key];
                    case 3 /* CONTEXT */:
                        return ctx[key];
                    case 2 /* PROPS */:
                        return props[key];
                    // default: just fallthrough
                }
            }
            else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                accessCache[key] = 0 /* SETUP */;
                return setupState[key];
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                accessCache[key] = 1 /* DATA */;
                return data[key];
            }
            else if (
            // only cache other properties when instance has declared (thus stable)
            // props
            (normalizedProps = instance.propsOptions[0]) &&
                hasOwn(normalizedProps, key)) {
                accessCache[key] = 2 /* PROPS */;
                return props[key];
            }
            else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                accessCache[key] = 3 /* CONTEXT */;
                return ctx[key];
            }
            else if (!__VUE_OPTIONS_API__ || !isInBeforeCreate) {
                accessCache[key] = 4 /* OTHER */;
            }
        }
        const publicGetter = publicPropertiesMap[key];
        let cssModule, globalProperties;
        // public $xxx properties
        if (publicGetter) {
            if (key === '$attrs') {
                track(instance, "get" /* GET */, key);
            }
            return publicGetter(instance);
        }
        else if (
        // css module (injected by vue-loader)
        (cssModule = type.__cssModules) &&
            (cssModule = cssModule[key])) {
            return cssModule;
        }
        else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
            // user may set custom properties to `this` that start with `$`
            accessCache[key] = 3 /* CONTEXT */;
            return ctx[key];
        }
        else if (
        // global properties
        ((globalProperties = appContext.config.globalProperties),
            hasOwn(globalProperties, key))) {
            return globalProperties[key];
        }
        else ;
    },
    set({ _: instance }, key, value) {
        const { data, setupState, ctx } = instance;
        if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
            setupState[key] = value;
        }
        else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
            data[key] = value;
        }
        else if (key in instance.props) {
            
                warn(`Attempting to mutate prop "${key}". Props are readonly.`, instance);
            return false;
        }
        if (key[0] === '$' && key.slice(1) in instance) {
            
                warn(`Attempting to mutate public property "${key}". ` +
                    `Properties starting with $ are reserved and readonly.`, instance);
            return false;
        }
        else {
            if ( key in instance.appContext.config.globalProperties) {
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    value
                });
            }
            else {
                ctx[key] = value;
            }
        }
        return true;
    },
    has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
        let normalizedProps;
        return (accessCache[key] !== undefined ||
            (data !== EMPTY_OBJ && hasOwn(data, key)) ||
            (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
            ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
            hasOwn(ctx, key) ||
            hasOwn(publicPropertiesMap, key) ||
            hasOwn(appContext.config.globalProperties, key));
    }
};
{
    PublicInstanceProxyHandlers.ownKeys = (target) => {
        warn(`Avoid app logic that relies on enumerating keys on a component instance. ` +
            `The keys will be empty in production mode to avoid performance overhead.`);
        return Reflect.ownKeys(target);
    };
}
const RuntimeCompiledPublicInstanceProxyHandlers = extend({}, PublicInstanceProxyHandlers, {
    get(target, key) {
        // fast path for unscopables when using `with` block
        if (key === Symbol.unscopables) {
            return;
        }
        return PublicInstanceProxyHandlers.get(target, key, target);
    },
    has(_, key) {
        const has = key[0] !== '_' && !isGloballyWhitelisted(key);
        if ( !has && PublicInstanceProxyHandlers.has(_, key)) {
            warn(`Property ${JSON.stringify(key)} should not start with _ which is a reserved prefix for Vue internals.`);
        }
        return has;
    }
});
let currentInstance = null;
const classifyRE = /(?:^|[-_])(\w)/g;
const classify = (str) => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');
/* istanbul ignore next */
function formatComponentName(instance, Component, isRoot = false) {
    let name = isFunction(Component)
        ? Component.displayName || Component.name
        : Component.name;
    if (!name && Component.__file) {
        const match = Component.__file.match(/([^/\\]+)\.vue$/);
        if (match) {
            name = match[1];
        }
    }
    if (!name && instance && instance.parent) {
        // try to infer the name based on reverse resolution
        const inferFromRegistry = (registry) => {
            for (const key in registry) {
                if (registry[key] === Component) {
                    return key;
                }
            }
        };
        name =
            inferFromRegistry(instance.components ||
                instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
    }
    return name ? classify(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
    return isFunction(value) && '__vccOpts' in value;
}

function handlerSetup(ctx, options, type) {
    // 解除与ctx.data的引用关系，创建响应式data$
    !ctx.data && (ctx.data = {});
    ctx.data$ = reactive(cloneDeep(ctx.data));
    // 初始化属性，判断数据是否正在被watch
    disabledEnumerable(ctx, '__watching__', false);
    disabledEnumerable(ctx, '__stopWatchFn__', null);
    // 执行setup
    var setupData = ctx.setup(options);
    if (isObject$1(setupData)) {
        Object.keys(setupData).forEach(function (key) {
            var val = setupData[key];
            if (isFunction$1(val)) {
                ctx[key] = val;
            }
            else {
                ctx.data$[key] = val;
            }
        });
        // 将setup返回的值同步至ctx.data
        ctx.data = cloneDeepRawData(ctx.data$);
        // 同步合并后的值到渲染层
        if (type === 'page') {
            ctx.setData(ctx.data);
        }
        else {
            // 组件的setData在attached时才可以用
            // 保证于其他钩子执行前执行
            ctx.__hooks__.attached.unshift(function initComponentSetData() {
                ctx.setData(ctx.data);
            });
            // 推出setData，只执行一次
            ctx.$once('attached:finally', function () {
                var delIdx = ctx.__hooks__.attached.findIndex(function (fn) { return fn.name === 'initComponentSetData'; });
                ctx.__hooks__.attached.splice(delIdx, 1);
            });
        }
    }
    var watching = createWatching(ctx);
    var stopWatching = createStopWatching(ctx);
    if (type === 'page') {
        // 页面在onLoad/onShow中watch
        // 响应式监听要先于其他函数前执行
        ctx.__hooks__.onLoad.unshift(watching);
        ctx.__hooks__.onShow.unshift(watching);
        // onHide/unLoad结束，取消监听
        ctx.$on('onHide:finally', stopWatching);
        ctx.$on('onUnLoad:finally', stopWatching);
    }
    else {
        // 组件在attached/onShow中watch
        // 响应式监听要先于其他函数前执行
        ctx.__hooks__.attached.unshift(watching);
        ctx.__hooks__.show.unshift(watching);
        // detached/onHide 中移除watch
        ctx.$on('hide:finally', stopWatching);
        ctx.$on('detached:finally', stopWatching);
    }
    return setupData;
}
function createWatching(ctx) {
    return function watching() {
        // 如果已经被监控了，就直接退出
        if (ctx.__watching__)
            return;
        ctx.__watching__ = true;
        // 保留取消监听的函数
        ctx.__stopWatchFn__ = watch(ctx.data$, function () {
            setDataQueueJob(ctx);
        });
    };
}
function createStopWatching(ctx) {
    return function stopWatching() {
        // 如果已经取消监听了，就直接退出
        if (!ctx.__watching__)
            return;
        ctx.__watching__ = false;
        // 执行取消监听
        ctx.__stopWatchFn__();
    };
}

var isControlLifecycle = true;
/** 不控制生命周期的运行顺序 */
var notControlLifecycle = function () {
    isControlLifecycle = false;
};
var controlLifecycle = function (_a) {
    // 生命周期执行顺序
    // 初始化
    // ⬇️ onLaunch App
    // ⬇️ onShow App
    // ⬇️ onLoad Page
    // ⬇️ onShow Page
    // ⬇️ created Comp
    // ⬇️ attached Comp
    // ⬇️ ready Comp
    // ⬇️ onReady Page
    var type = _a.type, name = _a.name, ctx = _a.ctx, lcEventBus = _a.lcEventBus, waitHook = _a.waitHook, invokeHooks = _a.invokeHooks;
    // 切后台
    // ⬇️ onHide Page
    // ⬇️ onHide App
    // ⬇️ onShow App
    // ⬇️ onShow Page
    if (type === 'app') {
        if (name === 'onShow') {
            // App的onShow，应该在App onLaunch执行完成之后执行
            return waitHook(ctx, 'onLaunch:resolve');
        }
        else if (name === 'onHide') {
            // App的onHide，应该在Page onHide执行完成之后执行
            return waitHook(lcEventBus, 'page:onHide:resolve');
        }
        else {
            // 其他的生命周期直接调用
            invokeHooks();
        }
    }
    else if (type === 'page') {
        if (name === 'onLoad') {
            // 没有App说明是独立分包情况，不需要等待
            if (getApp()) {
                // Page的onLoad，应该在App onShow执行完成之后执行
                return waitHook(lcEventBus, 'app:onShow:resolve');
            }
            else {
                return invokeHooks();
            }
        }
        else if (name === 'onShow') {
            // Page的onShow
            // 初始化时应该在Page onLoad执行完成之后执行
            // 切前台时应该在App onShow执行完成之后执行
            ctx['__onLoad:resolve__'] && lcEventBus['__app:onShow:resolve__']
                ? // 都成功直接调用
                    invokeHooks()
                : // 已经onLoad（onLoad肯定在app:onShow之后执行），说明是切后台逻辑
                    ctx['__onLoad:resolve__']
                        ? // 监听app:onShow
                            lcEventBus.$once('app:onShow:resolve', invokeHooks)
                        : // 初始化逻辑，监听onLoad
                            ctx.$once('onLoad:resolve', invokeHooks);
            return;
        }
        else if (name === 'onReady') {
            // Page的onReady，应该在Page onShow执行完成之后执行
            return waitHook(ctx, 'onShow:resolve');
        }
        else {
            // 其他的生命周期直接调用
            invokeHooks();
        }
    }
    else if (type === 'component') {
        if (name === 'created') {
            // Component的created，应该在Page onShow执行完成之后执行
            return waitHook(lcEventBus, 'page:onShow:resolve');
        }
        else if (name === 'attached') {
            // Component的attached，应该在Component created执行完成之后执行
            return waitHook(ctx, 'created:resolve');
        }
        else if (name === 'ready') {
            // Component的ready，应该在Component attached执行完成之后执行
            return waitHook(ctx, 'attached:resolve');
        }
        else {
            // 其他的生命周期直接调用
            invokeHooks();
        }
    }
};
var customControlLifecycle = function (fn) {
    controlLifecycle = fn;
};
// 生命周期事件总线，控制生命周期的正确运行顺序
var lcEventBus = initEvents();
// 需要装饰的所有生命周期
var lc = {
    app: [
        'onLaunch',
        'onShow',
        'onHide',
        'onError',
        'onPageNotFound',
        'onUnhandledRejection',
        'onThemeChange'
    ],
    page: [
        'onLoad',
        'onShow',
        'onReady',
        'onHide',
        'onUnload',
        'onPullDownRefresh',
        'onReachBottom',
        'onShareAppMessage',
        // 'onPageScroll', 性能问题：一旦监听，每次滚动两个线程之间都会通信一次
        'onTabItemTap',
        'onResize',
        'onAddToFavorites'
    ],
    component: [
        'created',
        'attached',
        'ready',
        'moved',
        'detached',
        'error',
        'show',
        'hide',
        'resize'
    ]
};
/**
 * @description 装饰小程序生命周期
 * @param options 用户给构造函数传入的选项
 * @param type App | Page | Component
 */
function decoratorLifeCycle(options, type) {
    if (options === void 0) { options = {}; }
    if (type === void 0) { type = 'page'; }
    // 组件要做额外处理
    if (type === 'component') {
        // 处理component pageLifetimes
        !isObject$1(options.pageLifetimes) && (options.pageLifetimes = {});
        // 处理component lifetimes
        !isObject$1(options.lifetimes) && (options.lifetimes = {});
        // 组件的方法必须定义到methods中才会被初始化到this身上
        !isObject$1(options.methods) && (options.methods = {});
        isFunction$1(options.setup) && (options.methods.setup = options.setup);
    }
    // 组件的pageLifetimes生命周期列表
    var pageLifetimes = ['show', 'hide', 'resize'];
    // 循环所有lifeCycle 进行装饰
    lc[type].forEach(function (name) {
        // 是否为组件的页面生命周期
        var isPageLC = pageLifetimes.includes(name);
        // 找到要装饰的生命周期函数所处的对象
        var decoratorOptions = type === 'component'
            ? isPageLC
                ? options.pageLifetimes
                : options.lifetimes
            : options;
        // 保留用户定义的生命周期函数
        var userHooks = type === 'component' && !isPageLC
            ? // 组件的生命周期可以定义在lifetimes 和 options中, lifetimes 优先级高于 options
                decoratorOptions[name] || options[name]
            : decoratorOptions[name];
        // 定义装饰函数
        decoratorOptions[name] = function decoratorLC(options) {
            var _this = this;
            // 初始化事件
            if (name === 'onLaunch' || name === 'onLoad' || name === 'created') {
                // 初始化事件通信
                initEvents(this);
                // 初始化 hooks
                initHooks(type, this);
                // 处理 mixins
                handlerMixins(type, this);
                // 页面卸载时需要重置变量
                if (type === 'app') {
                    this.__hooks__.onHide.push(function () {
                        lcEventBus['__app:onShow:resolve__'] = lcEventBus['__app:onShow:reject__'] = _this['__onShow:resolve__'] = _this['__onShow:reject__'] = false;
                    });
                }
                else if (type === 'page') {
                    this.__hooks__.onHide.push(function () {
                        lcEventBus['__page:onShow:resolve__'] = lcEventBus['__page:onShow:reject__'] = _this['__onShow:resolve__'] = _this['__onShow:reject__'] = false;
                    });
                    this.__hooks__.onUnload.push(function () {
                        lc.page.forEach(function (name) {
                            lcEventBus["__page:" + name + ":resolve__"] = lcEventBus["__page:" + name + ":reject__"] = false;
                        });
                    });
                }
                else {
                    this.__hooks__.hide.push(function () {
                        _this['__show:resolve__'] = _this['__show:reject__'] = false;
                    });
                }
                // App 里没有data，没有视图，不需要使用响应式
                if (name !== 'onLaunch') {
                    // 只有定义了setup才会进行响应式处理，这是为了兼容老项目
                    if (isFunction$1(this.setup)) {
                        // nextTick
                        this.$nextTick = setDataNextTick;
                        // 处理 setup
                        setCurrentCtx(this);
                        handlerSetup(this, options, type);
                        setCurrentCtx(null);
                    }
                }
            }
            // 如果用户定义了生命周期函数
            if (userHooks) {
                // 统一处理为数组
                if (!Array.isArray(userHooks))
                    userHooks = [userHooks];
                setCurrentCtx(this);
                userHooks.forEach(function (fn) {
                    if (isFunction$1(fn)) {
                        // 在setup中添加的钩子应该于原函数之前执行
                        // 将原函数放入队尾
                        if (type === 'app') {
                            appPushHooks[name](fn);
                        }
                        else if (type === 'page') {
                            pagePushHooks[name](fn);
                        }
                        else {
                            // create -> onCreate
                            var onName = transformOnName(name);
                            componentPushHooks[onName](fn);
                        }
                    }
                });
                setCurrentCtx(null);
            }
            // 调用保存的生命周期函数
            var invokeHooks = function () {
                // 执行成功
                var resolve = function (res) {
                    _this["__" + name + ":resolve__"] = true;
                    lcEventBus["__" + type + ":" + name + ":resolve__"] = true;
                    // 执行完成 触发事件
                    _this.$emit(name + ":resolve", res);
                    lcEventBus.$emit(type + ":" + name + ":resolve", res);
                    _this.$emit(name + ":finally", res);
                    lcEventBus.$emit(type + ":" + name + ":finally", res);
                };
                // 执行失败
                var reject = function (err) {
                    _this["__" + name + ":reject__"] = true;
                    lcEventBus["__" + type + ":" + name + ":reject__"] = true;
                    if (isFunction$1(_this.catchLifeCycleError))
                        _this.catchLifeCycleError(name, err);
                    // 执行完成 触发错误事件
                    _this.$emit(name + ":reject", err);
                    lcEventBus.$emit(type + ":" + name + ":reject", err);
                    _this.$emit(name + ":finally", err);
                    lcEventBus.$emit(type + ":" + name + ":finally", err);
                };
                try {
                    // 执行保存的钩子函数
                    var result = callHooks(type, name, options, _this);
                    // 异步结果
                    if (isFunction$1(result === null || result === void 0 ? void 0 : result.then)) {
                        result.then(resolve).catch(reject);
                    }
                    else {
                        // 同步结果
                        resolve(result);
                    }
                }
                catch (err) {
                    // 同步错误
                    reject(err);
                }
            };
            // 等待指定生命周期执行成功后 调用当前生命周期
            var waitHook = function (eventBus, eventName) {
                eventBus["__" + eventName + "__"]
                    ? invokeHooks()
                    : eventBus.$once(eventName, invokeHooks);
            };
            // 控制生命周期执行顺序
            if (isControlLifecycle) {
                controlLifecycle({
                    type: type,
                    name: name,
                    ctx: this,
                    lcEventBus: lcEventBus,
                    waitHook: waitHook,
                    invokeHooks: invokeHooks
                });
            }
            else {
                // 没有控制直接调用
                invokeHooks();
            }
        };
    });
    return options;
}
// 全局保留上下文，添加钩子函数时使用
var currentCtx = null;
function setCurrentCtx(ctx) {
    currentCtx = ctx;
}
// 获取生命周期执行是的this值，可能为null
function getCurrentCtx() {
    return currentCtx;
}
/**
 * 初始化生命周期钩子相关属性
 */
function initHooks(type, ctx) {
    // 保存所有的生命周期钩子
    defineReadonlyProp(ctx, '__hooks__', {});
    lc[type].forEach(function (name) {
        // 标志生命周期是否执行完成
        disabledEnumerable(ctx, "__" + name + ":resolve__", false);
        disabledEnumerable(ctx, "__" + name + ":reject__", false);
        ctx.__hooks__[name] = [];
    });
    return ctx;
}
/** 执行队列中的钩子函数 */
function callHooks(type, name, options, ctx, startIdx) {
    if (startIdx === void 0) { startIdx = 0; }
    // 将运行标识位全部置为false
    ctx["__" + name + ":resolve__"] = false;
    ctx["__" + name + ":reject__"] = false;
    lcEventBus["__" + type + ":" + name + ":resolve__"] = false;
    lcEventBus["__" + type + ":" + name + ":reject__"] = false;
    // 生命周期函数执行时接受到的参数，可能是对象，也可能是上一个函数返回的promise
    var optOrPromise = options;
    // 拿到当前要执行的钩子队列
    var lcHooks = ctx.__hooks__[name];
    // 记录当前的队列长度，因为在钩子执行过程中有可能还会向队列中推值
    var len = lcHooks.length;
    /**
     * 设置/更新默认值
     * 在函数返回值为undefined时，保证之后的函数依然可以接受到参数
     */
    var setDefaultValue = function (val) {
        if (val === void 0) {
            // 更新默认值
            return (val = options);
        }
        else {
            // 同步默认值
            return (options = val);
        }
    };
    if (len) {
        var _loop_1 = function (i) {
            if (isFunction$1(optOrPromise === null || optOrPromise === void 0 ? void 0 : optOrPromise.then)) {
                // 异步微任务执行
                optOrPromise = optOrPromise.then(function (result) {
                    result = setDefaultValue(result);
                    // 每次执行前将当前的ctx推入全局
                    // 以此保证多个实例在异步穿插运行时使用onXXX动态添加的生命周期函数指向正确
                    setCurrentCtx(ctx);
                    var res = lcHooks[i].call(ctx, result);
                    setCurrentCtx(null);
                    return res;
                });
            }
            else {
                // 同步任务运行
                setCurrentCtx(ctx);
                optOrPromise = setDefaultValue(lcHooks[i].call(ctx, optOrPromise));
                setCurrentCtx(null);
            }
        };
        for (var i = startIdx; i < len; i++) {
            _loop_1(i);
        }
        // 运行期间可以动态添加生命周期, 运行链结束检查是否有新增的钩子函数
        var checkNewHooks = function (result) {
            result = setDefaultValue(result);
            var nowLen = ctx.__hooks__[name].length;
            if (nowLen > len) {
                // 如果有，就执行新增的钩子函数
                return callHooks(type, name, result, ctx, len);
            }
            return result;
        };
        if (isFunction$1(optOrPromise === null || optOrPromise === void 0 ? void 0 : optOrPromise.then)) {
            optOrPromise = optOrPromise.then(checkNewHooks);
        }
        else {
            optOrPromise = checkNewHooks(optOrPromise);
        }
    }
    return optOrPromise;
}
// 生成添加钩子的函数
function createPushHooks(name) {
    // 添加钩子函数
    return function pushHooks(cb) {
        // 函数才能被推入
        if (isFunction$1(cb)) {
            var i = void 0;
            if ((i = currentCtx) && (i = i.__hooks__[name])) {
                // 避免onShow、onHide等多次调用的生命周期，重复添加相同的钩子函数
                if (!i.includes(cb)) {
                    i.push(cb);
                }
            }
        }
    };
}
// App的添加函数
var appPushHooks = lc.app.reduce(function (res, name) {
    res[name] = createPushHooks(name);
    return res;
}, {});
var onLaunch = appPushHooks.onLaunch;
var onAppShow = appPushHooks.onShow;
var onAppHide = appPushHooks.onHide;
var onAppError = appPushHooks.onError;
var onPageNotFound = appPushHooks.onPageNotFound;
var onUnhandledRejection = appPushHooks.onUnhandledRejection;
var onThemeChange = appPushHooks.onThemeChange;
// Page的添加函数
var pagePushHooks = lc.page.reduce(function (res, name) {
    res[name] = createPushHooks(name);
    return res;
}, {});
var onLoad = pagePushHooks.onLoad;
var onShow = pagePushHooks.onShow;
var onReady = pagePushHooks.onReady;
var onHide = pagePushHooks.onHide;
var onUnload = pagePushHooks.onUnload;
var onPullDownRefresh = pagePushHooks.onPullDownRefresh;
var onReachBottom = pagePushHooks.onReachBottom;
var onShareAppMessage = pagePushHooks.onShareAppMessage;
var onTabItemTap = pagePushHooks.onTabItemTap;
var onResize = pagePushHooks.onResize;
var onAddToFavorites = pagePushHooks.onAddToFavorites;
// Component的添加函数
var componentPushHooks = lc.component.reduce(function (res, name) {
    // created => onCreated | ready => onReady
    var onName = transformOnName(name);
    res[onName] = createPushHooks(name);
    return res;
}, {});
var onCreated = componentPushHooks.onCreated;
var onAttached = componentPushHooks.onAttached;
var onComponentReady = componentPushHooks.onReady;
var onMoved = componentPushHooks.onMoved;
var onDetached = componentPushHooks.onDetached;
var onError = componentPushHooks.onError;
var onPageShow = componentPushHooks.onShow;
var onPageHide = componentPushHooks.onHide;
var onPageResize = componentPushHooks.onResize;

var Ecomponent = function (options) {
    decoratorLifeCycle(options, 'component');
    return Component(options);
};

var Epage = function (options) {
    decoratorLifeCycle(options, 'page');
    return Page(options);
};

var Eapp = function (options) {
    decoratorLifeCycle(options, 'app');
    return App(options);
};

const asyncMethods = [
  'canvasGetImageData',
  'canvasPutImageData',
  'canvasToTempFilePath',
  'setEnableDebug',
  'startAccelerometer',
  'stopAccelerometer',
  'getBatteryInfo',
  'getClipboardData',
  'setClipboardData',
  'startCompass',
  'stopCompass',
  'addPhoneContact',
  'startGyroscope',
  'stopGyroscope',
  'startBeaconDiscovery',
  'stopBeaconDiscovery',
  'getBeacons',
  'startLocalServiceDiscovery',
  'stopLocalServiceDiscovery',
  'startDeviceMotionListening',
  'stopDeviceMotionListening',
  'getNetworkType',
  'makePhoneCall',
  'scanCode',
  'getSystemInfo',
  'vibrateShort',
  'vibrateLong',
  'getExtConfig',
  'chooseLocation',
  'getLocation',
  'openLocation',
  'chooseMessageFile',
  'loadFontFace',
  'chooseImage',
  'previewImage',
  'getImageInfo',
  'saveImageToPhotosAlbum',
  'compressImage',
  'chooseVideo',
  'saveVideoToPhotosAlbum',
  'downloadFile',
  'request',
  'connectSocket',
  'closeSocket',
  'sendSocketMessage',
  'uploadFile',
  'login',
  'checkSession',
  'chooseAddress',
  'authorize',
  'addCard',
  'openCard',
  'chooseInvoice',
  'chooseInvoiceTitle',
  'getUserInfo',
  'requestPayment',
  'getWeRunData',
  'showModal',
  'showToast',
  'hideToast',
  'showLoading',
  'hideLoading',
  'showActionSheet',
  'pageScrollTo',
  'startPullDownRefresh',
  'stopPullDownRefresh',
  'setBackgroundColor',
  'setBackgroundTextStyle',
  'setTabBarBadge',
  'removeTabBarBadge',
  'showTabBarRedDot',
  'hideTabBarRedDot',
  'showTabBar',
  'hideTabBar',
  'setTabBarStyle',
  'setTabBarItem',
  'setTopBarText',
  'saveFile',
  'openDocument',
  'getSavedFileList',
  'getSavedFileInfo',
  'removeSavedFile',
  'getFileInfo',
  'getStorage',
  'setStorage',
  'removeStorage',
  'clearStorage',
  'getStorageInfo',
  'closeBLEConnection',
  'closeBluetoothAdapter',
  'createBLEConnection',
  'getBLEDeviceCharacteristics',
  'getBLEDeviceServices',
  'getBluetoothAdapterState',
  'getBluetoothDevices',
  'getConnectedBluetoothDevices',
  'notifyBLECharacteristicValueChange',
  'openBluetoothAdapter',
  'readBLECharacteristicValue',
  'startBluetoothDevicesDiscovery',
  'stopBluetoothDevicesDiscovery',
  'writeBLECharacteristicValue',
  'getHCEState',
  'sendHCEMessage',
  'startHCE',
  'stopHCE',
  'getScreenBrightness',
  'setKeepScreenOn',
  'setScreenBrightness',
  'connectWifi',
  'getConnectedWifi',
  'getWifiList',
  'setWifiList',
  'startWifi',
  'stopWifi',
  'getBackgroundAudioPlayerState',
  'playBackgroundAudio',
  'pauseBackgroundAudio',
  'seekBackgroundAudio',
  'stopBackgroundAudio',
  'getAvailableAudioSources',
  'startRecord',
  'stopRecord',
  'setInnerAudioOption',
  'playVoice',
  'pauseVoice',
  'stopVoice',
  'getSetting',
  'openSetting',
  'getShareInfo',
  'hideShareMenu',
  'showShareMenu',
  'updateShareMenu',
  'checkIsSoterEnrolledInDevice',
  'checkIsSupportSoterAuthentication',
  'startSoterAuthentication',
  'navigateBackMiniProgram',
  'navigateToMiniProgram',
  'setNavigationBarTitle',
  'showNavigationBarLoading',
  'hideNavigationBarLoading',
  'setNavigationBarColor',
  'redirectTo',
  'reLaunch',
  'navigateTo',
  'switchTab',
  'navigateBack'
];

function hasCallback(args) {
  if (!args || typeof args !== 'object') return false

  const callback = ['success', 'fail', 'complete'];
  for (const m of callback) {
    if (typeof args[m] === 'function') return true
  }
  return false
}

function _promisify(func) {
  if (typeof func !== 'function') return fn
  return (args = {}) =>
    new Promise((resolve, reject) => {
      func(
        Object.assign(args, {
          success: resolve,
          fail: reject
        })
      );
    })
}

function promisifyAll(wx = {}, wxp = {}) {
  Object.keys(wx).forEach(key => {
    const fn = wx[key];
    if (typeof fn === 'function' && asyncMethods.indexOf(key) >= 0) {
      wxp[key] = args => {
        if (hasCallback(args)) {
          fn(args);
        } else {
          return _promisify(fn)(args)
        }
      };
    } else {
      wxp[key] = fn;
    }
  });
}

var request = [];
var response = [];
var interceptors = {
    request: {
        use: function (onFulfilled, onRejected) {
            onFulfilled = isFunction$1(onFulfilled)
                ? onFulfilled
                : function (config) { return config; };
            onRejected = isFunction$1(onRejected)
                ? onRejected
                : function (error) { return Promise.reject(error); };
            request.push([onFulfilled, onRejected]);
        }
    },
    response: {
        use: function (onFulfilled, onRejected) {
            onFulfilled = isFunction$1(onFulfilled)
                ? onFulfilled
                : function (config) { return config; };
            onRejected = isFunction$1(onRejected)
                ? onRejected
                : function (error) { return Promise.reject(error); };
            response.push([onFulfilled, onRejected]);
        }
    }
};
function requestMethod(options) {
    var _request = function (options) {
        return new Promise(function (resolve, reject) {
            options.success = function (response) { return resolve({ options: options, response: response }); };
            options.fail = function (response) { return reject({ options: options, response: response }); };
            wx.request(options);
        });
    };
    var chain = [[_request, void 0]];
    request.forEach(function (block) {
        chain.unshift(block);
    });
    response.forEach(function (block) {
        chain.push(block);
    });
    var promise = Promise.resolve(options);
    chain.forEach(function (_a) {
        var onFulfilled = _a[0], onRejected = _a[1];
        promise = promise.then(onFulfilled, onRejected);
    });
    return promise;
}

var wxp = {};
promisifyAll(wx, wxp);
wxp.request = requestMethod;
wxp.request.interceptors = interceptors;

exports.Eapp = Eapp;
exports.Ecomponent = Ecomponent;
exports.Epage = Epage;
exports.computed = computed;
exports.customControlLifecycle = customControlLifecycle;
exports.customRef = customRef;
exports.effect = effect;
exports.enableTracking = enableTracking;
exports.getCurrentCtx = getCurrentCtx;
exports.globalMixins = globalMixins;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.markRaw = markRaw;
exports.notControlLifecycle = notControlLifecycle;
exports.onAddToFavoritesHooks = onAddToFavorites;
exports.onAppErrorHooks = onAppError;
exports.onAppHideHooks = onAppHide;
exports.onAppShowHooks = onAppShow;
exports.onAttachedHooks = onAttached;
exports.onComponentReadyHooks = onComponentReady;
exports.onCreatedHooks = onCreated;
exports.onDetachedHooks = onDetached;
exports.onErrorHooks = onError;
exports.onHideHooks = onHide;
exports.onLaunchHooks = onLaunch;
exports.onLoadHooks = onLoad;
exports.onMovedHooks = onMoved;
exports.onPageHideHooks = onPageHide;
exports.onPageNotFoundHooks = onPageNotFound;
exports.onPageResizeHooks = onPageResize;
exports.onPageShowHooks = onPageShow;
exports.onPullDownRefreshHooks = onPullDownRefresh;
exports.onReachBottomHooks = onReachBottom;
exports.onReadyHooks = onReady;
exports.onResizeHooks = onResize;
exports.onShareAppMessageHooks = onShareAppMessage;
exports.onShowHooks = onShow;
exports.onTabItemTapHooks = onTabItemTap;
exports.onThemeChangeHooks = onThemeChange;
exports.onUnhandledRejectionHooks = onUnhandledRejection;
exports.onUnloadHooks = onUnload;
exports.pauseTracking = pauseTracking;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.resetTracking = resetTracking;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
exports.stop = stop;
exports.toRaw = toRaw;
exports.toRef = toRef;
exports.toRefs = toRefs;
exports.track = track;
exports.trigger = trigger;
exports.triggerRef = triggerRef;
exports.unref = unref;
exports.watch = watch;
exports.watchEffect = watchEffect;
exports.wxp = wxp;
