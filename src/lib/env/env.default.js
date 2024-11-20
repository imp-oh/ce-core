/**
 * 默认环境配置
 */
const { app, BrowserWindow, ipcMain } = require('electron')
let path = require('path')
const is = require("electron-is")
const __require = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

class DefaultConfig {
  options = {}
  constructor (self) {
    let { execPath, env, argv, cwd } = process
    const dev = is.dev()
    const asar = __dirname.indexOf('app.asar') !== -1 ? 'app.asar/' : 'app'

    const appPath = app.getAppPath()
    this.options = {

      /* 系统环境 NODE_ */
      NODE_CWD_DIR: cwd(),
      NODE_REQUIRE: __require,
      NODE_ENV: 'production',

      /* 主程序应用 APP_ */
      APP_ENV: 'prod',
      APP_HOME_DIR: appPath,
      APP_BASE_DIR: path.join(appPath, 'electron'),
      APP_RESOURCES_DIR: path.join(appPath, dev ? '' : '../'),
      APP_DIR: path.join(execPath, "../resources", asar),
      APP_DEV: dev,
      APP_NAME: app.getName(),
      APP_USER_HOME: app.getPath('home'),
      APP_DATA: app.getPath('appData'),
      APP_USER_DATA: app.getPath('userData'),
      APP_LOGINS_DIR: app.getPath('logs'),
      APP_VERSION: app.getVersion(),
      APP_IS_PACKAGED: app.isPackaged,
      APP_EXEC_DIR: appPath,
      APP_NODE_MODULES: path.join(appPath, 'node_modules'),
      APP_FILE_DIR: path.join(appPath, dev ? '' : '../'),

      /* 小程序环境 CE_*/
      CE_MODULES: dev ? appPath : path.join(execPath, '../../'),
    }


    /* 获取小程序环境设置 */
    let envOptions = {
      CE_APP_DIR: env.CE_APP_DIR,
      CE_ENV: env.CE_ENV,
      CE_FILE_DIR: env.CE_FILE_DIR,
      CE_NODE_MODULES: env.CE_NODE_MODULES,
      APP_FILE_DIR: env.CE_FILE_DIR
    }
    if (envOptions.CE_APP_DIR) this.options.APP_HOME_DIR = envOptions.CE_APP_DIR
    let envKeys = Object.getOwnPropertyNames(envOptions)
    for (let key of envKeys) {
      if (envOptions[key]) this.options[key] = envOptions[key]
    }


    // 添加 ENV 全局变量
    let keys = Object.getOwnPropertyNames(this.options)
    for (let key of keys) {
      env[key] = this.options[key]
    }



  }

  /* 获取配置 */
  getOptions () {
    return this.options
  }
}


module.exports = DefaultConfig