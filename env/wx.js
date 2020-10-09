global.wx = {
  request(obj) {
    setTimeout(() => {
      obj.success()
    })
  }
}

global.getApp = () => true