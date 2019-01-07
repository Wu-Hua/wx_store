// pages/trolley/trolley.js
const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    locationAuthType: app.data.locationAuthType,
    trolleyList: [], // 购物车商品列表
    trolleyCheckMap: [], // 购物车中选中的id哈希表
    trolleyAccount: 0, // 购物车结算总价
    isTrolleyEdit: false, // 购物车是否处于编辑状态
    isTrolleyTotalCheck: false, // 购物车中商品是否全选
  },

  

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  onTapLogin: function () {
    app.login({
      success: ({ userInfo }) => {
        this.setData({
          userInfo,
          locationAuthType: app.data.locationAuthType
        })

        this.getTrolley()
      },
      error: () => {
        this.setData({
          locationAuthType: app.data.locationAuthType
        })
      }
    })
  },

  // 调用显示购物车的 API 接口
  // 一般来说我们需要在用户登录之后显示之前保存的购物车信息
  // 而用户登录存在两种情况，一种是用户点击登录，另一种是已经有用户登录信息，通过 check session 识别
  // 因此这两种情况下都需要调用 以下 getTrolley 显示购物车的函数
  getTrolley() {
    wx.showLoading({
      title: '刷新购物车数据...',
    })

    qcloud.request({
      url: config.service.trolleyList,
      login: true,
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code) {
          this.setData({
            trolleyList: data.data
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '数据刷新失败',
          })
        }
      },
      fail: () => {
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '数据刷新失败',
        })
      }
    })
  },

  onTapCheckSingle(event) {
    let checkId = event.currentTarget.dataset.id
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let isTrolleyTotalCheck = this.data.isTrolleyTotalCheck
    let trolleyAccount = this.data.trolleyAccount
    let numTotalProduct
    let numCheckedProduct = 0

    // 单项商品被选中/取消
    trolleyCheckMap[checkId] = !trolleyCheckMap[checkId]

    // 判断选中的商品个数是否需商品总数相等
    // 如果购物车中商品被选中的数量和商品的总数相等时，则设置全选的状态为 true ，如果不相等则全选的状态为 false 。
    // 商品总数非常容易获得，我们读取 trolleylist 的长度即可。
    // 我们可以通过循环遍历来判断商品被选中的数量，若某个商品被选中则累计加一，以此类推，我们可以快速快速获得被选中商品数量，
    // 最后我们还需要把更新的数据通过 setData 更新到页面上去。
    numTotalProduct = trolleyList.length
    trolleyCheckMap.forEach(checked => {
      numCheckedProduct = checked ? numCheckedProduct + 1 : numCheckedProduct
    })

    isTrolleyTotalCheck = (numTotalProduct === numCheckedProduct) ? true : false

    trolleyAccount = this.calcAccount(trolleyList, trolleyCheckMap)

    this.setData({
      trolleyCheckMap,
      isTrolleyTotalCheck,
      trolleyAccount
    })
  },

  // 这个函数与上面的函数不同的是，这个事件函数除了要修改全选自身的状态之外，还需要修改购物车中所有商品的选中和取消，
  // 因此我们还需要遍历整个商品列表
  onTapCheckTotal(event) {
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let isTrolleyTotalCheck = this.data.isTrolleyTotalCheck
    let trolleyAccount = this.data.trolleyAccount

    // 全选按钮被选中/取消
    // 我们使用感叹号来取反，然后我来实现全选的功能
    isTrolleyTotalCheck = !isTrolleyTotalCheck

    // 遍历并修改所有商品的状态
    trolleyList.forEach(product => {
      trolleyCheckMap[product.id] = isTrolleyTotalCheck
    })

    trolleyAccount = this.calcAccount(trolleyList, trolleyCheckMap)

    this.setData({
      isTrolleyTotalCheck,
      trolleyCheckMap,
      trolleyAccount
    })

  },

  // 计算选中商品总价的函数
  calcAccount(trolleyList, trolleyCheckMap) {
    let account = 0
    // 我们遍历购物车中的每个商品，若他被选中，则统计它的价格，需要注意的是在统计价格时，我们需要乘以商品的数量
    // 然后分别在单个商品点击和全选点击中调用它，并更新到前端页面
    trolleyList.forEach(product => {
      account = trolleyCheckMap[product.id] ? account + product.price * product.count : account
    })

    return account
  },

  /**
   * 当用户点击右上角的编辑或完成后，isTrolleyEdit 的状态应该对应的发生改变，
   * 我们可以使用感叹号取反来快速改变它的值
   */
  onTapEditTrolley() {
    let isTrolleyEdit = this.data.isTrolleyEdit

    if (isTrolleyEdit) {
      this.updateTrolley()
    } else {
      this.setData({
        isTrolleyEdit: !isTrolleyEdit
      })
    }
  },

  // 修改变量的逻辑，我们使用类似首页添加购物车的方式，来识别用户点击的是购物车中的哪一个商品，出于方便，我们将它传址给product
  adjustTrolleyProductCount(event) {
    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList
    let dataset = event.currentTarget.dataset
    let adjustType = dataset.type
    let productId = dataset.id
    let product
    let index


    for (index = 0; index < trolleyList.length; index++) {
      if (productId === trolleyList[index].id) {
        product = trolleyList[index]
        break
      }
    }

    // 我们分别为加号和减号传入不同的识别状态，并在页面逻辑中处理
    if (product) {
      // 当点击的是加号，购物车中对应商品数量加1
      if (adjustType === 'add') {
        // 点击加号
        product.count++
      } else {
        // 点击减号
        // 当点击的是减号，数量减一，如果减到为 0 
        // 我们将商品从购物车中删除 
        // 需要注意的是，我们需要同时在商品选中逻辑 trolleyCheckMap 和购物车列表 trolleyList 中删除
        if (product.count <= 1) {
          // 商品数量不超过1，点击减号相当于删除
          delete trolleyCheckMap[productId]
          trolleyList.splice(index, 1)
        } else {
          // 商品数量大于1
          product.count--
        }
      }
    }

    // 调整结算总价
    // 最后重新计算总价，并更新数据至页面上
    let trolleyAccount = this.calcAccount(trolleyList, trolleyCheckMap)

    this.setData({
      trolleyAccount,
      trolleyList,
      trolleyCheckMap
    })

    
  },

  updateTrolley() {
    wx.showLoading({
      title: '更新购物车数据...',
    })

    let trolleyList = this.data.trolleyList

    qcloud.request({
      url: config.service.updateTrolley,
      method: 'POST',
      login: true,
      data: {
        list: trolleyList
      },
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code) {
          this.setData({
            isTrolleyEdit: false
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '更新购物车失败'
          })
        }
      },
      fail: () => {
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '更新购物车失败'
        })
      }
    })
  },

  // 这里要调用购买的 API 接口
  onTapPay() {
    if (!this.data.trolleyAccount) return

    wx.showLoading({
      title: '结算中...',
    })

    let trolleyCheckMap = this.data.trolleyCheckMap
    let trolleyList = this.data.trolleyList

    // 通过 filter 筛选出需要付费的商品，这里我们使用双感叹号将其转化为布尔值
    let needToPayProductList = trolleyList.filter(product => {
      return !!trolleyCheckMap[product.id]
    })

    // 请求后台
    qcloud.request({
      url: config.service.addOrder,
      login: true,
      method: 'POST',
      data: {
        list: needToPayProductList
      },
      success: result => {
        wx.hideLoading()

        let data = result.data

        if (!data.code) {
          wx.showToast({
            title: '结算成功',
          })

          this.getTrolley()
        } else {
          wx.showToast({
            icon: 'none',
            title: '结算失败',
          })
        }
      },
      fail: () => {
        wx.hideLoading()

        wx.showToast({
          icon: 'none',
          title: '结算失败',
        })
      }
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
    // 同步授权状态
    this.setData({
      locationAuthType: app.data.locationAuthType
    })
    app.checkSession({
      success: ({ userInfo }) => {
        this.setData({
          userInfo
        })

        this.getTrolley()
      }
    })
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