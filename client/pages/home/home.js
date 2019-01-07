// pages/home/home.js
// 实现数据的下载功能，与之前在业务逻辑的实现相似，我们需要导入复制的代码，腾讯云的API代码被存放在 client/vendor/wafer2-client-sdk/index.js中。
// 我们首先输入账号代码，对相关的文件进行导入
const qcloud = require('../../vendor/wafer2-client-sdk/index.js')
const config = require('../../config.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    productList: [], // 商品列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getProductList()
  },

  getProductList(){
    wx.showLoading({
      title: '商品数据加载中。。。',
    })
    qcloud.request({
      url: config.service.productList,
      success: result => {
        wx.hideLoading()
        if (!result.data.code) {
          this.setData({
            productList: result.data.data
          })
        } else {
          wx.showToast({
            title: '商品数据加载失败',
          })  
        }
      },
      fail: result => {
        console.log('fail')
        wx.hideLoading()
        wx.showToast({
          title: '商品数据加载失败',
        })
      }
    })
  },

  addToTrolley(event) {
    /**
     * 如果我们想给事件携带额外的数据，则可以通过 data-参数名 = 参数数据 的形式，
     * 比如我们这里想传输商品的 id，则可以 data-id="{{pitem.id}}"。
     * 这些数据我们最终可以在 event.currentTarget.dataset 中接收到。
     */
    /**
     * 我们获取传入的商品 id 和 首页商品列表，
     * 通过循环判断的方式找出 id 对应的具体商品信息，
     * 并用类似于详情页添加购物车的方式添加
     */
    let productId = event.currentTarget.dataset.id
    // let productList = this.data.productList
    // let product

    // for (let i = 0, len = productList.length; i < len; i++) {
    //   if (productList[i].id === productId) {
    //     product = productList[i]
    //     break
    //   }
    // }

    /**
     * 目前的后端业务逻辑仅需要商品的 id 基于这种情况，我们可以进一步简化代码，
     * 响应事件的过程中，我们已经获得了商品的 id 因此我们不需要通过循环来获取商品的其他信息，
     * 可以直接将 id 打包，在调用 API 的时候传入。
     * 同样，在商品详情页也可以做类似的修改
     */
    if (productId) {
      qcloud.request({
        url: config.service.addTrolley,
        login: true,
        method: 'PUT',
        data: {
          id: productId
        },
        success: result => {
          let data = result.data

          if (!data.code) {
            wx.showToast({
              title: '已添加到购物车',
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '添加到购物车失败',
            })
          }
        },
        fail: () => {
          wx.showToast({
            icon: 'none',
            title: '添加到购物车失败',
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})