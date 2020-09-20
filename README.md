# enhance-wxapp

## 简介

增强微信小程序运行时框架：保留微信原生框架的性能，通过增加特性来提高开发效率

开发效率：逻辑复用性/可维护性/可扩展性/开发便捷性

## 和其他框架的区别

uniapp、trao等框架也可以实现开发效率的提升，但是这些框架不仅是在小程序平台运行，还有需要去做多端适配和框架语法适配，性能与原生框架相比会有所降低。

如果没有多端需求，只是为了提高开发效率而去使用这些框架，就会有点得不偿失。这个运行时框架也是为了解决这个问题，我们依然使用小程序的原生框架，只不过是在运行期间通过装饰方法等方式来提高开发效率。既保证性能不会衰减太多，也提高了开发效率。

## 框架功能

- 逻辑复用能力：Vue3 composition API
  - 通过适配 Vue3 reactivity模块，加入响应式、setup、自定义hooks等能力
- 全局逻辑复用能力：mixins
  - 全局为 页面/组件 实例混入生命周期钩子、data、方法等
- 生命周期改为数组结构，方便扩展
  - 遍历执行时，如果某个函数返回了Promise，则会阻塞后续代码的执行。

### 响应式

- [尤雨溪：State of Vue](https://b23.tv/ytFHAH)（23分钟）
  - 讲述了为何会设计出composition api，以及其和Vue2的逻辑复用方式相比有何优势，还有与React Hooks的区别
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

定义的setup函数，会在页面onLoad时期执行，其参数就是onLoad函数的参数。

setup函数会先于onLoad生命周期函数前调用，其返回值中的函数，会与页面实例进行合并(组件则是methods对象)，非函数值会和data属性进行合并。（⚠️setup合并优先级最高，如有重名，会覆盖data属性）

在setup中运行期间，可以使用ref，reactive，创建响应式对象。可以定义函数来修改其值。




开始计时，暂停计时demo
reactive 对象 数组
ref 基本类型 设置.value 获取不需要
watch，computed 监听响应式对象

ˉ

onLoad 注册生命周期钩子

data响应式
  - data响应式，既然加入了响应式，页面实例的data属性自然也顺利成章的变成了响应式

setdata优化
nexttick函数


data变化大家好接受，现在都在写vue





生命周期改为数组，可以在setup或全局混入中多次注册。
生命周期函数按照注册顺序依次执行，如果返回promise，将会阻塞后续函数执行。


全局逻辑复用 mixins 生命周期 属性 方法
config中的检查
弹窗登录，混入onload和data（封装了逻辑）

封装布局组件
每个页面都需要引入
有机会封装全局视图层：弹窗登录
解决自定义顶导底导滚动不固定问题
顶导底导封装至布局组件中，页面内容使用scrollview包裹。如果有坑可以给一个开关来控制scrollview。

store redux


维护
重构
扩展


一次性代码，不可能被重构。只能被重写
全局data 修改 新增 删除
getcurrentpage 修改属性
非本人维护和扩展代码逻辑时，花费的时间和写出bug的几率都会大大增加。

为什么上面的操作会导致这些问题？
程序的运行，本质就是状态。数据的改变。我们要考虑的是状态的改变可以被追踪吗？是否可在当前上下文中搜索到？是否可用打断点的形式捕获到。如果状态不能被追踪，那这个坏的代码。


注入ajax至this 封装 拦截器功能

urls文件不再需要，放入ajax中处理。请求是传入host类型，具体值在拦截器中处理。

config移至每个页面配置中，功能内聚

promise化微信api，搭配async/await 提高代码阅读性

引入vant组件库





component ready 名称为 onComponentReady，避免和page 的onReady 冲突

生命周期函数可能是异步的，如果需要等生命周期函数全部执行完成后在执行一些操作，可以监听'onLoad:done' 'created:done' 等事件


⚠️生命周期函数应该避免使用箭头函数，这将使this丢失

⚠️重名合并策略优先级： setup > data > mixins

⚠️不要再使用this.setData, 没有做处理

⚠️考虑性能问题: 一旦监听，每次滚动两个线程之间都会通信一次，onPageScroll不会进行装饰，没有暴露注册钩子，也不可以在mixins中混入，只能在传入的选项中进行定义

