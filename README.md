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
- 生命周期改为数组结构，可以在setup函数或全局mixins中多次注册
  - 遍历执行时，如果某个函数返回了Promise，则会阻塞后续代码的执行。
- 将 wx.request 代理到 this.$ajax 上，加入axios拦截器机制抽离业务逻辑
- 插件机制：多个项目间复用全局混用

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

1. 定义的setup函数，会在页面onLoad时期执行，其参数就是onLoad函数的参数。

2. setup函数会先于onLoad生命周期函数前调用，其返回值中的函数，会与页面实例进行合并(组件则是methods对象)，非函数值会和data属性进行合并。（⚠️setup合并优先级最高，如有重名，会覆盖data属性）

3. 在setup中运行期间，可以使用ref，reactive，创建响应式对象，定义函数来修改其值。
  - reactive 对象 数组
  - ref 基本类型
  - watch，computed 监听响应式对象（Vue2）

4. 使用onLoad、onShow等函数注册生命周期钩子

#### 修改值的方式
  - this.setData
  - 通过函数直接修改ref、reactive的值
  - 通过修改this.data$的值（this.data的响应式对象）

#### 使用nextTick等待视图渲染完成
 - this.$nextTick (同Vue，可以传入函数或者使用.then)

## 项目相关

### 代码内聚

> 逻辑、样式等相关性的东西应该是集中的，而不是分散不同的文件夹中

1. config中的检查移至每个页面中, 全局混入onLoad处理
  ```js
  // 页面
  Epage({
    config: {
      setting: true
    }
  })
  // 混入onLoad
  globalMixins({
    hook: {
      page: {
        onLoad: [
          function checkToken() {
            if (this.config.token) {}
          },
          function checkSetting() {
            if (this.config.setting) {}
          },
          function checkUcenter() {
            if (this.config.ucenter) {}
          },
        ]
      }
    }
  })
  ```

2. urls.js 文件不再需要，在拦截器中进行统一处理
  ```js
    // 页面
    this.$ajax({
      host: 'xcx',
      url: '/api/list'
    })

    // 拦截器
    function(config) {
      const host = {
        dev: {
          xcx: 'xcxbch'
        },
        prop: {
          xcx: 'xcx'
        }
      }
      config.url = host[isDev ? 'dev' : 'prod'][config.host] + config.url
    }
  ```

3. sass文件放置每个页面/组件的文件夹中，使用脚本或者编辑器插件进行编译
  - 使用脚本编译，解决sass编译css时重复@import

4. 雪碧图使用iconfont代替

5. 使用Git版本控制

### 开发相关

禁止：
  1. 随意新增、修改、删除globalData值
  2. 通过getCurrentPages 获取页面实例修改属性
  3. ...

以上行为会导致页面状态无法追踪，项目可维护性变差。

- 状态可追踪
  - 在数据的上下文文件中是否可以搜索到
  - 是否可以通过打断点调试到

- 全局状态管理
  - 旧项目给globalData加入get、set函数，修改值时需要调用函数来保证数据的可追踪性/可调式性（约定不直接修改数据）
  - 新项目直接加入redux（无法直接数据）

- 封装布局组件，每个页面都需要引入
  ```
    <Layout>
      <view></view>
    </Layout>
  ```
  1. 提供全局视图层的复用机会（如登录弹窗组件）
    - 布局组件复用视图层，全局mixins onLoad和data 复用逻辑层
  2. 解决自定义顶导底导滚动不固定问题
    - 顶导底导封装至布局组件中，页面内容使用scrollview包裹。如果有坑可以给一个开关来控制scrollview。

- promise化微信api，搭配async/await 提高代码阅读性

- 引入vant组件库


## API

// ...


## ⚠️框架注意点

⚠️component ready 名称为 onComponentReady，避免和page 的onReady 冲突

⚠️生命周期函数可能是异步的，如果需要等生命周期函数全部执行完成后在执行一些操作，可以监听'onLoad:done' 'created:done' 等事件

⚠️生命周期函数应该避免使用箭头函数，这将使this丢失

⚠️重名合并策略优先级： setup > data > mixins

⚠️考虑性能问题: 一旦监听，每次滚动两个线程之间都会通信一次，onPageScroll不会进行装饰，没有暴露注册钩子，也不可以在mixins中混入，只能在传入的选项中进行定义

⚠️ref值修改时需要加.value, 而在data$.ref修改时不需要