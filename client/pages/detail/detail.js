// pages/detail/detail.js
const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    haveComment: true
  },

  getProduct(id) {
    wx.showLoading({
      title: '商品数据加载中...',
    })

    qcloud.request({
      url: config.service.productDetail  + id,
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code) {
          this.setData({
            product: data.data,
            isInstantBuy: true
          })
        } else {
          setTimeout(() => {
            wx.navigateBack()
          }, 2000)
        }
      },
      fail: () => {
        wx.hideLoading()

        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }
    })
  },

  buy() {
    wx.showLoading({
      title: '商品购买中...',
    })

    let product = Object.assign({
      count: 1
    }, this.data.product)

    // 并且基于服务器的返回信息来做出判断
    qcloud.request({
      url: config.service.addOrder,
      login: true,
      method: 'POST',
      data: {
        list: [product]
      },
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code) {
          wx.showToast({
            title: '商品购买成功',
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '商品购买失败',
          })
        }
      },
      fail: () => {
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '商品购买失败',
        })
      }
    })
  },

  addToTrolley() {
    wx.showLoading({
      title: '正在添加到购物车...',
    })

    qcloud.request({
      url: config.service.addTrolley,
      login: true,
      // 需要注意的是我们这里用的是 PUT 方法，因为当商品已经在购物车的时候，我们需要更新数据库
      // 我们将商品的数据直接通过 data 来传输，这部分数据将直接出现在中间件的 body 中，
      // 最后添加 url 
      method: 'PUT',
      data: this.data.product,
      success: result => {
        wx.hideLoading()

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
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '添加到购物车失败',
        })
      }
    })

  },

  onTapCommentEntry() {
    let product = this.data.product
    if (this.data.haveComment) {
      wx.navigateTo({
        url: `/pages/comment/comment?id=${product.id}&price=${product.price}&name=${product.name}&image=${product.image}`
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getProduct(options.id)
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