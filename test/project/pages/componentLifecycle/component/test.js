// pages/componentLifecycle/component/test.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },
  created() {
    console.log('created');
  },
  attached() {
    console.log('attached');
  },
  ready() {
    console.log('ready');
  },
  pageLifetimes: {
    show() {
      console.log('show');
    },
    hide() {
      console.log('hide');
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {

  }
})
