# enhance-wxapp
增强微信小程序运行时框架

component ready 名称为 onComponentReady，避免和page 的onReady 冲突

生命周期函数可能是异步的，如果需要等生命周期函数全部执行完成后在执行一些操作，可以监听'onLoad:done' 'created:done' 等事件

在运行

生命周期函数应该避免使用箭头函数，这将使this丢失