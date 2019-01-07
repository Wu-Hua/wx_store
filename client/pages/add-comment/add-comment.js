// pages/add-comment/add-comment.js
const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    commentValue: '',
    commentImages: [],
  },

  // 在 uploadImage 这个函数中
  uploadImage(cb) {
    let commentImages = this.data.commentImages
    let images = []

    if (commentImages.length) {
      let length = commentImages.length
      // 这里采用了循环的方式，来对这个图像列表进行处理。
      /**
       * 在这里的代码中，在循环过程中，
       * 我们对 length 变量进行了操作，
       * 对 length 变量进行了自减的操作。
       * 这里看起来有些反直觉——因为在 for 循环开头，
       * 我们要求 i<length 以及对 i 进行了自增，
       * 那么如果这里再对 length 进行变化，是不是会带来问题？
       */
      /**
       * 但其实并没有问题，因为JS中的代码存在异步的机制。
       * 因为 wx.uploadFile 这个函数执行的速度很慢，
       * 所以在循环执行的过程中，循环会先执行 length 次（这个时候 length 没有发生变化），
       * 每次循环将对应的 wx.uploadFile 放入到执行队列中（也就是说 wx.uploadFile 里面的代码还没有开始执行）。
       * 在这之后，我们才开始一步步处理执行队列中的 wx.uploadFile 函数，
       * 而在这一情况下，我们对 length 进行的处理已经影响不到循环执行次数了。
       */
      for (let i = 0; i < length; i++) {
        // 调用 wx.uploadFile 函数，来对图像的数据进行上传。
        wx.uploadFile({
          // 设置上传的路径，也就服务端的 upload SDK 对应的 url， 他们定义在 uploadUrl中；
          url: config.service.uploadUrl,
          // 需要上传的文件路径，也就是我们储存在 commentImages 中图像的临时链接，
          filePath: commentImages[i],
          // 还有文件的key 。
          name: 'file',
          success: res => {
            // 当上传成功时，
            let data = JSON.parse(res.data)
            length--

            // 我们获取图像的 url，并添加到 images 这个列表当中。
            if (!data.code) {
              images.push(data.data.imgUrl)
            }

            // 当列表遍历完毕之后，我们将得到的图像链接列表返回，返回给这个回调函数。
            if (length <= 0) {
              cb && cb(images)
            }
          },
          fail: () => {
            length--
          }
        })
      }
    } else {
      cb && cb(images)
    }
  },

  onInput(event) {
    this.setData({
      commentValue: event.detail.value.trim()
    })
  },

  /**
   * 首先我们将刚刚讲解的两个功能，整合到我们的添加评论页面，
   * 使得我们能够选择图像并进行展示。
   * 那么实际上，这里我们接下来需要做的，
   * 只需要对保存在 commentImages 这个列表中的图像，
   * 执行上传到对象存储服务的功能、并获取他们的图像链接，就可以了。
   */
  chooseImage() {
    // 首先，在 chooseImage 函数中，我们读取现有的图像数据，暂存在 currentImages 变量中。
    let currentImages = this.data.commentImages

    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // 接着，在 wx.chooseImage 成功时的回调函数，我们使用列表的 concat 方法，将获得的数据，添加到这个 currentImages 变量中。
        currentImages = currentImages.concat(res.tempFilePaths)

        // 然后呢，我们始终保存这个列表的最后至多三个元素。我们可以用 slice，来切分这个列表。
        // 那么怎么确定下标呢？
        /**
         * 比较容易的是最后一个下标，他就是这个列表的长度，可以用.length 属性获得。
         * 而第一个下标则有些麻烦，我们需要进行一些小的思考。
         * 当列表有超过三个元素时候，那么我们取end-3，如果小于等于3个元素，则我们取0。
         * 哈！这个功能我们可以用一个max函数来实现！
         * 第一个情况下，end-3>=0，
         * 第二个情况下，就是0，
         * 所以我们总会取 end-3 和 0 之间更大的数，
         * 作为我们的第一个下标。
         */
        let end = currentImages.length
        let begin = Math.max(end - 3, 0)
        currentImages = currentImages.slice(begin, end)

        this.setData({
          commentImages: currentImages
        })

      },
    })
  },

  previewImg(event) {
    let target = event.currentTarget
    let src = target.dataset.src

    wx.previewImage({
      current: src,
      urls: this.data.commentImages
    })
  },

  // 添加评论 API 客户端部分的代码，
  addComment(event) {
    let content = this.data.commentValue
    if (!content) return

    wx.showLoading({
      title: '正在发表评论'
    })

    // 它调用了 uploadImages这个函数，同时将返回的上传后的图像链接列表 images ，添加到了上传的数据当中。
    this.uploadImage(images => {
      // 使用 qcloud.request 发起请求
      qcloud.request({
        url: config.service.addComment,
        login: true,
        method: 'PUT',
        // 上传数据，包括了评论的内容，以及商品的 id ，组装起来作为请求的 data 参数
        data: {
          images,
          content: content,
          product_id: this.data.product.id
        },
        success: result => {
          wx.hideLoading()

          let data = result.data

          if (!data.code) {
            wx.showToast({
              title: '发表评论成功'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)

          } else {
            wx.showToast({
              icon: 'none',
              title: '发表评论失败'
            })
          }
        },
        fail: (res) => {
          console.log('fail')
          console.log(res)
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '发表评论失败'
          })
        }
      })
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