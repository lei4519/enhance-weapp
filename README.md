# enhance-wxapp
增强微信小程序运行时框架

component ready 名称为 onComponentReady，避免和page 的onReady 冲突

生命周期函数可能是异步的，如果需要等生命周期函数全部执行完成后在执行一些操作，可以监听'onLoad:done' 'created:done' 等事件


⚠️生命周期函数应该避免使用箭头函数，这将使this丢失

⚠️合并策略setup优先

⚠️不要再使用this.setData, 没有做处理


微信运行时增强框架

保留微信原生框架的性能，同时增加其功能来提高开发效率

开发效率：逻辑复用/可维护性/可扩展性/开发便捷性

uniapp trao，多端适配，框架语法适配。性能必然减弱。

逻辑复用  响应式api和setup（自定义hooks）
data响应式
setdata优化
nexttick函数
data变化大家好接受，现在都在写vue

https://b23.tv/ytFHAH
讲述了为何会有composition api以及相比现在的逻辑复用方式相比有何优势。（23分钟）
官网setup介绍。

响应式基础
https://v3.vuejs.org/guide/reactivity.html#what-is-reactivity

ref 相关api
 https://v3.vuejs.org/api/basic-reactivity.html
reactive 相关api
 https://v3.vuejs.org/api/refs-api.html


setup会在页面onload执行前调用一次，其返回值对象会和data合并进行响应式。（setup对象优先级高）
在setup中运行期间，可以使用ref，reactive，创建响应式对象。开始计时，暂停计时demo
reactive 对象 数组
ref 基本类型 设置.value 获取不需要
watch，computed 监听响应式对象
onLoad 注册生命周期钩子

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



