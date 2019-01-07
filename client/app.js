//app.js
// 导入qcloud库以及config.js
var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')

let userInfo

const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2


App({
  onLaunch: function () {
    qcloud.setLoginUrl(config.service.loginUrl)
  },

  data: {
    locationAuthType: UNPROMPTED
  },

  login({ success, error }) {
    // 一开始我们会检查用户之前是否拒绝过授权
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo'] === false) {
          this.data.locationAuthType = UNAUTHORIZED
          // 已拒绝授权
          // 当用户之前拒绝授权过，我们首先会使用 wx.showModal 弹出一个提示框请求用户授权登录，接着使用 wx.openSetting 打开设置
          // 当用户成功授权了登录授权时，我们则会按照交互组所说的直接进行登录操作，否则，小程序会返回到个人中心的初始页面，重复之前请求授权操作
          wx.showModal({
            title: '提示',
            content: '请授权我们获取您的用户信息',
            showCancel: false
          })
        } else {
          // 如果没有拒绝，则使用我们之前的登录函数，执行我们之前的登录代码
          this.data.locationAuthType = AUTHORIZED
          this.doQcloudLogin({ success, error })
        }
      }
    })
  },

  // 使用 doQcloudLogin 来分装我们登录的代码
  doQcloudLogin({ success, error }) {
    // 调用 qcloud 登陆接口
    qcloud.login({
      success: result => {
        console.log('success')
        console.log(result)
        // 当首次登录时 result 不为空，那么直接会返回我的 userInfo ，也就是 前面的 result
        if (result) {
          let userInfo = result
          success && success({
            userInfo
          })
        } else {
          // 如果不是首次登录，不会返回用户信息，请求用户信息接口获取
          // 我们才会调用这个 getUserInfo 函数，来下载我们的个人信息
          this.getUserInfo({ success, error })
        }
      },
      fail: (result) => {
        console.log('fail')
        console.log(result)
        error && error()
      }
    })
  },

  getUserInfo({ success, error }) {
    // 调用 qcloud.request 登陆接口
    qcloud.request({
      // 首先设置我们登录的链接,刚刚我们已经提到是config中的loginUrl
      url: config.service.requestUrl,
      login: true,
      // 设置登录成功和登录失败时的回调函数
      success: result => {
        let data = result.data

        if (!data.code) {
          let userInfo = data.data

          success && success({
            userInfo
          })
        } else {
          error && error()
        }
      },
      fail: () => {
        error && error()
      }
    })
  },

  // 这个函数会执行会话检查的功能
  checkSession({ success, error }) {
    // 检查会话功能由 wx.checkSession 实现
    // 我们希望，当检查会话成功时， 我们会调用 getUserInfo ,自动加载用户数据并展示
    // 否则调用失败函数下的回调函数
    wx.checkSession({
      success: () => {
        this.getUserInfo({
          success: res => {
            userInfo = res.userInfo

            success && success({
              userInfo
            })
          },
          fail: () => {
            error && error()
          }
        })
      },
      fail: () => {
        error && error()
      }
    })
  },
})