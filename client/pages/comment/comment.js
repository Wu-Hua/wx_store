// pages/comment/comment.js
const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
// 在模板小程序中， util 文件夹中的文件，为我们定义了时间处理函数
// 首先根据我们返回的时间数据，创建一个时间对象 item.create_time ，
// 然后，将这个时间对象传入这个处理函数当中
const _ = require('../../utils/util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    commentList: [], // 评论列表
  },

  previewImg(event) {
    let target = event.currentTarget
    let src = target.dataset.src
    let urls = target.dataset.urls

    wx.previewImage({
      current: src,
      urls: urls
    })
  },

  // 使用下载评论 API 
  getCommentList(id) {
    qcloud.request({
      url: config.service.commentList,
      data: {
        product_id: id
      },
      success: result => {
        let data = result.data
        if (!data.code) {
          this.setData({
            // 对返回的时间进行处理,我们使用了 map 函数,
            // 这个 map 函数对列表中的每个元素,根据数据的函数进行处理
            commentList: data.data.map(item => {
              // 首先根据我们返回的时间数据，创建一个时间对象 item.create_time ，
              // 然后，将这个 itemDate 时间对象传入这个 _.formatTime() 处理函数当中
              let itemDate = new Date(item.create_time)
              // _.formatTime 在这里对返回的时间进行处理
              item.createTime = _.formatTime(itemDate)
              item.images = item.images ? item.images.split(';;') : []
              return item
            })
          })
        }
      },
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let product = {
      id: options.id,
      name: options.name,
      price: options.price,
      image: options.image
    }
    this.setData({
      product: product
    })
    this.getCommentList(options.id)
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