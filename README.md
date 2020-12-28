# enhance-weapp

- 导航
    - <a href="#user-content-简介">简介</a>

    - <a href="#user-content-api">API</a>

    - <a href="#user-content-框架注意点">框架注意点</a>

## 安装

```js
npm i enhance-weapp --save
```

## 示例

```js
// index.js
import {Epage, ref} from 'enhance-weapp'

function useCount() {
  const count = ref(0)
  const add = () => {
    count.value++
  }
  return {
    count,
    add
  }
}

Epage({
  setup() {
    return useCount()
  }
})
```

```html
<!-- index.wxml -->
<view>
  <view>{{count}}</view>
  <button bindtap="add">数字 +1</button>
</view>
```

## 简介

增强微信小程序运行时库，通过劫持逻辑层代码增加一些特性来提高开发效率。

### 框架功能

- 逻辑复用能力：`Vue3 composition API`
  - 通过适配 `Vue3 reactivity` 模块，加入响应式、`setup`、自定义hooks等能力
- 全局逻辑复用能力：`globalMixins`
  - 全局为 页面/组件 实例混入生命周期钩子、data、方法等
- 生命周期改为数组结构，可以在`setup`函数或全局 `mixins` 中多次注册
  - 遍历执行时，如果某个函数返回了`Promise`，则会阻塞后续代码的执行。
- 封装`wx.request`，加入请求拦截器功能机制抽离业务逻辑
- 全局状态的响应式管理，全局状态改变时对应页面/组件会重新渲染
  - `initStore`、`useStore`

### 响应式

- [尤雨溪：State of Vue](https://b23.tv/ytFHAH)（23分钟）
  - 讲述了为何会设计出`composition api`，以及其和`Vue2`的逻辑复用方式相比有何优势，还有与`React Hooks`的区别
- Vue3 官网
  - [响应式基础](https://v3.vuejs.org/guide/reactivity.html#what-is-reactivity)
  - [ref 相关api](https://v3.vuejs.org/api/basic-reactivity.html)
  - [reactive 相关api](https://v3.vuejs.org/api/refs-api.html)

#### 响应式示例
```javascript
// index.js
Epage({
  setup(query) {
    const show = ref(false)
    const data = reactive({
      label: '',
      value: ''
    })

    const toggleShow = () => show.value = !show.value

    onShow(function() {
      console.log('onShow')
    })

    watch(show, (newVal, oldVal) => console.log(`show值变化了：${oldVal}, ${newVal}`))

    return {
      show,
      data,
      toggleShow
    }
  }
})
```
```html
// index.wxml
<view>
  <text>{{show}}</text>
  <button bindtap="toggleShow"></button>
</view>
```

1. 定义的`setup`函数，该函数会在页面`onLoad`或组件`created`时期调用，其参数就是`onLoad` / `created`函数的参数。

2. `setup`函数会先于用户注册的`onLoad`生命周期函数前调用。
    - 其返回值中的函数，会与页面实例进行合并(组件则是`methods`对象)
    - 非函数值会和`data`属性进行合并
    - ⚠️ `setup`合并优先级最高，如有重名，会覆盖传入选项中定义的属性

3. 在`setup`中运行期间，可以使用`ref`，`reactive`，创建响应式对象，定义函数来修改其值。
    - `reactive` 对象 数组
    - `ref` 基本类型
    - `watch`，`computed` 监听响应式对象变化

4. 使用`onLoadHooks`、`onShowHooks`等函数注册生命周期钩子

#### 修改值的方式
  - 修改`ref`、`reactive`的值
  - 修改`this.data$`的值（`this.data`的响应式对象）
  - 调用`this.setData`修改

#### 使用nextTick等待视图渲染完成

 - nextTick (同Vue，可以传入函数或者使用.then)


## ⚠️ 框架注意点

- 默认情况下，生命周期执行顺序会被控制
    ```text
      初始化阶段：
      App:onLaunch -> App:onShow
                                \
                                 \ -> Page:onLoad -> Page:onShow -> Page:onReady
                                                                  \
                                                                   \ -> Comp:created -> Comp:created -> Comp:attached -> Comp:ready

      切换后台：
      Page:onHide -> App:onHide
      App:onShow -> Page:onShow

      以上的生命周期即使是异步函数，也会按照上述顺序进行执行。
      一个实际的业务场景就是我们会在页面onLoad时获取用户的token，再之后的请求中将token带上，如果不对初始化的生命周期进行控制的话，就会导致token还在获取中，但页面和组件中的请求方法就已经全部被调用了。

      其他的生命周期不会做处理，按照微信原本的调用顺序执行。

      如果你不希望对生命周期的顺序进行控制，可以调用 notControlLifecycle 来取消控制，这将使生命周期函数恢复微信本身的调用顺序。
      如果你觉得默认的生命周期控制顺序不符合你的要求，可以调用 customControlLifecycle 来定制你自己的顺序。
    ```

- 注册生命周期函数会保存为一个数组进行执行，执行过程中：
  - 第一个函数执行时的参数为微信原生框架传入的参数(如：`onLoad`的参数)，这个参数会作为默认参数。
  - 当前函数返回值为`Promise`, 等`Promise resolve`之后才会接着执行后续函数。
  - 当前函数返回值不是`undefined`，会将此返回值作为参数传给后续函数，并将此值记录为默认参数。
  - 返回值为`undefined`，会将默认参数传给后续函数。
    - 简单说，即使你在`onLoad`函数中不写`return`，也不用担心后续的`onLoad`函数接收不到页面参数。

- 不要在组件的methods中定义setup函数，会被options.setup覆盖

- 当页面没有setup时，只会对页面进行生命周期方面的增强，不会对data进行处理。

- 重名合并策略优先级： setup > data > 命名空间mixins > 公用mixins

- Eapp中不支持使用`setup`，不能使用响应式数据，可以使用全局混入

- 考虑性能问题，onPageScroll一旦监听，每次滚动两个线程之间都会通信一次，onPageScroll不会进行装饰，没有暴露注册钩子，也不可以在mixins中混入，只能在传入的选项中进行定义

- Vue3: ref值 修改时需要加 `.value`，读取值的时候不需要加

- Vue3：当ref值被作为reactive值的属性时，以reactive属性的形式进行修改时，不需要加`.value`

- `this.data$`是被reactive的，所以通过`this.data$.ref`时不需要加`.value`

    ```js
    // 代码解释
    Epage({
      setup() {
        // 定义ref
        const refVal = ref(1)
        // 定义修改ref的方法
        const changeRefVal = function(num) {
          // 以下两种修改方式是等价的，推荐使用第一种
          // 1. 直接修改ref，需要加 .value
          refVal.value = num
          // 2. 通过reacitve值访问时，不需要加 .value
          this.data$.refVal = num
        }
        // 返回值将合并至 data$
        return {
          refVal,
          changeRefVal
        }
      }
    })
    ```

## API

### 构造器

⚠️ `Eapp`中不支持使用`setup`，不能使用响应式数据，可以使用全局混入

```js
import { Eapp, Epage, Ecomponent } from 'enhance-weapp'
```

### nextTick

使用`nextTick`等待视图渲染完成

```js
// 同 Vue
nextTick(() => {})

nextTick().then(() => {})
```

### 全局混入方法: `globalMixins`

全局混入分为命名空间混入和公用混入，命名空间混入只会在对应的实例中生效，公用混入会在所有实例中生效。

- ⚠️ 公用混入优先级最低：`setup` > `data` > 命名空间 `mixins` > 公用 `mixins`

- ⚠️ 混入的生命周期函数会先于页面中定义的生命周期之前执行

#### 使用示例
```js
import { globalMixins } from 'enhance-weapp'

globalMixins({
  // 只在App中生效
  app: {
    // 生命周期钩子
    hooks: {
      onLaunch: [],
      onShow: [],
      onHide: [],
      onError: [],
      onPageNotFound: [],
      onUnhandledRejection: [],
      onThemeChange: []
    },
    // 属性
    data: {},
    // 方法
    anyFunction() {}
  },

  // 只在Page中生效
  page: {
    // 生命周期钩子
    hooks: {
      onLoad: [],
      onShow: [],
      onReady: [],
      onHide: [],
      onUnload: [],
      onPullDownRefresh: [],
      onReachBottom: [],
      onTabItemTap: [],
      onResize: [],
      onAddToFavorites: []
    },
    // 属性
    data: {},
    // 方法
    anyFunction() {}
  },

  // 只在 Component 中生效
  component: {
    // 生命周期钩子
    hooks: {
      created: [],
      attached: [],
      ready: [],
      moved: [],
      detached: [],
      error: [],
      show: [],
      hide: [],
      resize: []
    },
    // 属性
    data: {},
    // 方法
    anyFunction() {}
  },

  // 公用混入

  // 属性
  data: {},
  // 方法
  anyFunction() {}
})
```

### request拦截器

使用 `request` 方法请求数据，提供拦截器功能

#### 使用方法（同axios）

```js
import { request } from 'enhance-weapp'

// 请求拦截器
request.interceptors.request.use(
  () => {/* resolve 执行 */},
  () => {/* reject 执行 */}
)

// 响应拦截器
request.interceptors.response.use(
  () => {/* resolve 执行 */},
  () => {/* reject 执行 */}
)

// 使用request请求时会应用 注册的拦截器
request().then().catch().finally()
```

### 生命周期监听钩子

⚠️ 钩子函数必须在`setup`函数和生命周期函数中调用注册才能正常运行。

⚠️ `setup`函数调用栈中注册的生命周期函数会先于选项中定义的生命周期前执行。

⚠️ 注册生命周期函数会保存为一个数组进行执行，执行过程中：
  - 第一个函数执行时的参数为微信原生框架传入的参数(如：`onLoad`的参数)，这个参数会作为默认参数。
  - 当前函数返回值为`Promise`, 等`Promise resolve`之后才会接着执行后续函数。
  - 当前函数返回值不是`undefined`，会将此返回值作为参数传给后续函数，并将此值记录为默认参数。
  - 返回值为`undefined`，会将默认参数传给后续函数。
    - 简单说，即使你在`onLoad`函数中不写`return`，也不用担心后续的`onLoad`函数接收不到页面参数。

⚠️ 页面不提供 `onPageScroll` 钩子监听

> 考虑性能问题: 一旦监听，每次滚动两个线程之间都会通信一次，onPageScroll不会进行装饰，没有暴露注册钩子，也不可以在mixins中混入，只能在传入的页面选项中进行定义

⚠️ 不提供 `onShareAppMessage`，每个页面只会有一个，不需要包装。

#### 使用示例

```js
import { onShowHooks } from 'enhance-weapp'

Epage({
    setup() {
      onShowHooks(function() {
        console.log('show1')
        // 可以嵌套调用
        onShowHooks(function() {
          console.log('show2')
        })
      })
    },
    onShow() {
        console.log('show3')
        // 可以嵌套调用
        onShowHooks(function() {
          console.log('show4')
        })
    }
})
```

#### App钩子列表
```js
import {
  onLaunchHooks,
  onAppShowHooks,
  onAppHideHooks,
  onAppErrorHooks,
  onPageNotFoundHooks,
  onUnhandledRejectionHooks,
  onThemeChangeHooks
} from 'enhance-weapp'
```

#### Page钩子列表

```js
import {
  onLoadHooks,
  onShowHooks,
  onReadyHooks,
  onHideHooks,
  onUnloadHooks,
  onPullDownRefreshHooks,
  onReachBottomHooks,
  onTabItemTapHooks,
  onResizeHooks,
  onAddToFavoritesHooks
} from 'enhance-weapp'
```

#### Component钩子列表

⚠️ `Component ready` 名称为 `onComponentReadyHooks`，避免和`Page onReadyHooks` 冲突

```js
import {
  onCreatedHooks,
  onAttachedHooks,
  onComponentReadyHooks,
  onMovedHooks,
  onDetachedHooks,
  onErrorHooks,
  onPageShowHooks,
  onPageHideHooks,
  onPageResizeHooks
} from 'enhance-weapp'
```

#### 监听生命周期执行成功

⚠️ 生命周期函数的执行可能是异步的，并且支持递归嵌套执行，如果需要感知生命周期函数全部执行完成，可以使用 `this.$once`、`this.$on` 监听 '`onLoad:resolve` '、'`created:resolve`' 等事件 (也可以使用 `getCurrentCtx API` 来获取当前的`this`)

##### 示例

```js
this.$once('onLoad:resolve', () => console.log('页面onLoad函数全部执行完毕'))

getCurrentCtx().$once('onLoad:resolve', () => console.log('页面onLoad函数全部执行完毕'))
```
##### 事件清单
```js
app: [
  'onLaunch:resolve',
  'onShow:resolve',
  'onHide:resolve',
  'onError:resolve',
  'onPageNotFound:resolve',
  'onUnhandledRejection:resolve',
  'onThemeChange:resolve'
]
page: [
    'onLoad:resolve',
    'onShow:resolve',
    'onReady:resolve',
    'onHide:resolve',
    'onUnload:resolve',
    'onPullDownRefresh:resolve',
    'onReachBottom:resolve',
    'onTabItemTap:resolve',
    'onResize:resolve',
    'onAddToFavorites:resolve',
]
component: [
    'created:resolve',
    'attached:resolve',
    'ready:resolve',
    'moved:resolve',
    'detached:resolve',
    'error:resolve',
]
```

#### 监听生命周期执行失败

⚠️ 如果在`onLoad`中检查到用户没有登录，那有可能需要将页面重定向到登录页，可以在生命周期函数中 `return Promise.reject`。

然后通过以下两种方式进行监听：

1. 通过`this.$once`、`this.$on` 监听'`onLoad:reject`' '`created:reject`' 等事件, 事件名称等同于上面的成功事件，只是将`resolve`换成了`reject`

2. 在选项中定义`catchLifeCycleError`函数，当任何生命周期执行失败时都会尝试调用此函数，然后将生命周期名称和`reject reason`传入

##### 示例
```js
Epage({
  setup() {
    onLoad(() => {
      this.$once('onLoad:reject', ({code}) => {
        code === 403 && 跳转登录页
      })
      return Promise.reject({
        code: 403,
        msg: '用户未登录'
      })
    })
  },
  catchLifeCycleError(name, err) {
    err.code === 403 && 跳转登录页
  }
})
```

#### 监听生命周期执行完成

同`Promise`，我们也希望不管成功与否，都要执行一些逻辑，那我们可以监听'`onLoad:finally`' '`created:finally`' 等事件, 事件名称等同于上面的成功事件，只是将`resolve`换成了`finally`


#### notControlLifecycle

解除生命周期顺序控制，详见框架注意点

#### customControlLifecycle

调用此函数，传入自定义生命周期顺序控制函数，详见框架注意点

```js
customControlLifecycle(() => {}/*生命周期顺序控制函数*/)
```

#### 生命周期顺序控制函数 类型定义

```ts
/** 生命周期的控制函数 */
type ControlLifecycleFn = (
  /** 类型：APP / Page / Component */
  type: DecoratorType,
  // 生命周期的名称
  name: AppLifeTime | PageLifeTime | ComponentLifeTime,
  // 当前的this
  ctx: EnhanceRuntime,
  // 全局的生命周期事件总线，记录当前所有的生命周期运行情况
  lcEventBus: EnhanceEvents,
  // 等待指定生命周期执行成功后 调用当前生命周期
  waitHook: WaitHookFn,
  // 调用执行当前生命周期
  invokeHooks: LooseFunction
) => void
```

#### 默认生命周期顺序控制函数的实现

```ts
let controlLifecycle: ControlLifecycleFn = (
  type,
  name,
  ctx,
  lcEventBus,
  waitHook,
  invokeHooks
) => {
  if (type === 'app') {
    if (name === 'onShow') {
      // App的onShow，应该在App onLaunch执行完成之后执行
      return waitHook(ctx, 'onLaunch:resolve')
    } else if (name === 'onHide') {
      // App的onHide，应该在Page onHide执行完成之后执行
      return waitHook(lcEventBus, 'page:onHide:resolve')
    }
  } else if (type === 'page') {
    if (name === 'onLoad') {
      // Page的onLoad，应该在App onShow执行完成之后执行
      return waitHook(lcEventBus, 'app:onShow:resolve')
    } else if (name === 'onShow') {
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
          ctx.$once('onLoad:resolve', invokeHooks)
      return
    } else if (name === 'onReady') {
      // Page的onReady，应该在Page onShow执行完成之后执行
      return waitHook(ctx, 'onShow:resolve')
    }
  } else if (type === 'component') {
    if (name === 'created') {
      // Component的created，应该在Page onShow执行完成之后执行
      return waitHook(lcEventBus, 'page:onShow:resolve')
    } else if (name === 'attached') {
      // Component的attached，应该在Component created执行完成之后执行
      return waitHook(ctx, 'created:resolve')
    } else if (name === 'ready') {
      // Component的ready，应该在Component attached执行完成之后执行
      return waitHook(ctx, 'attached:resolve')
    }
  }
}
```

### getCurrentCtx

获取生命周期执行中的`this`值，可能为`null`

### forceUpdata

正常情况下，触发响应式数据 `setter` 后会进行`diffData`动作，通过此`API` 可以直接执行`diffData`，无需触发响应式。

```js
// 需要传入当前实例
forceUpdata(this)
```

### 全局状态管理

原生框架的全局状态只有一个`golbalData`，使用起来没有约束，值变化时页面也感知不到。

这里我们使用computed简单实现一个状态管理功能。

#### createStore

初始化响应式的全局状态, 并返回getter和setter函数，通过getter获取数据（返回值为compuetd的返回值），通过setter触发变化。
```js
const [get, set] = createStore({a: 1})

Epage({
  setup() {
    const num = get(state => state.a)

    return {
      num
    }
  }
})

set(state => state.a++)

// Epage render

```


### Vue3 Composition API 清单
```js
import {
  // @vue/reactivity
  computed,
  customRef,
  effect,
  enableTracking,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  pauseTracking,
  proxyRefs,
  reactive,
  readonly,
  ref,
  resetTracking,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  stop,
  toRaw,
  toRef,
  toRefs,
  track,
  trigger,
  triggerRef,
  unref,
  // @vue/runtime-core
  watch,
  watchEffect
} from 'enhance-weapp'
```
