# 项目调整

## 代码内聚

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
    function interceptor(config) {
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

## 开发相关

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
