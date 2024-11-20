/**
 * 应用注册
 */

const { app, BrowserWindow, BrowserView, Menu, ipcMain } = require('electron')
const isType = require('is-type-of')
const path = require('path')
const fs = require('fs')
const utilsCommon = require('../utils/common')
const BaseApp = require('./BaseApp')


class CeApp extends BaseApp {
  constructor (options) {
    super(options)
    this.config = options
    let app = this.loadConfig()
    this.plugin = {
      beforeCreate: [],
      created: []
    }
    this.createdPlugin() // 初始插件
    this.config = { ...app, ...options }
    this.electron = {
      mainWindow: null,
      tray: null,
      extra: {
        closeWindow: false,
      }
    }
  }

  loadConfig () {
    let configDir = path.join(this.config.APP_HOME_DIR, `ce.config.${this.config.APP_ENV}.js`)
    if (!fs.existsSync(configDir)) throw `not find ${configDir}`
    let configFun = this.config.NODE_REQUIRE(configDir)
    let config = configFun(this)
    return config
  }

  async startSocket () {
    console.log('进来铜须')
  }

  /**
   * 还原窗口
   */
  restoreMainWindow () {
    if (this.electron.mainWindow) {
      if (this.electron.mainWindow.isMinimized()) {
        this.electron.mainWindow.restore()
      }
      this.electron.mainWindow.show()
    }
  }

  /**
   * electron app退出
   */
  async appQuit () {
    await this.beforeClose()
    app.quit()
  }

  /**
 * app关闭之前
 */
  async beforeClose () {
    // do some things
  }


  async createElectronApp () {
    const self = this

    app.on('  ', (event) => {
      self.restoreMainWindow()
    })

    app.whenReady().then(() => {
      self.createWindow()
      app.on('activate', () => {
        self.restoreMainWindow()
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        // self.coreLogger.info('[Appliaction] [initialize] window-all-closed quit');
        self.appQuit()
      }
    })

    app.on('before-quit', () => {
      self.electron.extra.closeWindow = true
    })


    if (this.config.hardGpu && this.config.hardGpu.enable == false) {
      app.disableHardwareAcceleration()
    }

    await this.electronAppReady()

  }


  async createWindow () {
    const winOptions = this.config.BrowserWindow

    for (let i in this.plugin.beforeCreate) {
      let beforeCreate = this.plugin.beforeCreate[i]
      await beforeCreate(this)
    }

    this.electron.mainWindow = new BrowserWindow(winOptions)
    let win = this.electron.mainWindow

    // 菜单显示/隐藏
    if (this.config.openAppMenu === 'dev-show'
      && this.config.env == 'prod') {
      Menu.setApplicationMenu(null)
    } else if (this.config.openAppMenu === false) {
      Menu.setApplicationMenu(null)
    } else {
      // nothing 
    }

    this.loadingView(winOptions)

    await this.windowReady()

    for (let i in this.plugin.created) {
      let created = this.plugin.created[i]
      await created(this)
    }

    // await this.loderPreload();

    this.selectAppType()

    // DevTools
    if (!app.isPackaged && this.config.openDevTools) {
      win.webContents.openDevTools()
    }

  }
  selectAppType () {
    let win = this.electron.mainWindow
    if (this.config.loadFile) {
      let isPath = path.isAbsolute(this.config.loadFile)
      win.loadFile(path.join(isPath ? '' : this.config.APP_HOME_DIR, this.config.loadFile))
    } else if (this.config.loadURL) {
      win.loadURL(this.config.loadURL)
    }
  }

  /**
 * 预加载模块
 */
  async loderPreload () {
    // let filepath = this.resolveModule(path.join(this.config.baseDir, 'preload', 'index'));

    // if (!filepath) return;
    // const fileObj = this.loader.loadFile(filepath);
    // if (is.function(fileObj) && !is.generatorFunction(fileObj) && !is.asyncFunction(fileObj)) {
    //   fileObj();
    // } else if (is.asyncFunction(fileObj)) {
    //   await fileObj();
    // }
  }

  /**
 * 加载loading页面
 */
  loadingView (winOptions) {
    let currentV = process.versions.electron
    if (utilsCommon.compareVersion(currentV, '13.6.9') == 1) {
      return
    }
    if (!this.config.loadingPage) {
      return
    }
    const self = this
    const loadingBrowserView = new BrowserView()
    this.electron.mainWindow.setBrowserView(loadingBrowserView)
    loadingBrowserView.setBounds({
      x: 0,
      y: 0,
      width: winOptions.width,
      height: winOptions.height
    })

    // loading html
    const loadingHtml = path.join('file://', this.config.APP_HOME_DIR, 'public', 'html', 'loading.html')
    self.electron.mainWindow.webContents.loadURL(loadingHtml)

    this.electron.mainWindow.webContents.on('dom-ready', async (event) => {
      self.electron.mainWindow.removeBrowserView(loadingBrowserView)
    })


  }


  /**
   * electron app已经准备好，主窗口还未创建
   */
  async electronAppReady () {
    // do some things
  }

  /**
   * 主应用窗口已经创建
   */
  async windowReady () {
    // do some things
  }

  /**
   * app关闭之前
   */
  async beforeClose () {
    // do some things
  }





  /** ====== 生命周期 =====  */
  /* 插件注册 */
  createdPlugin () {
    // UI plugins
    if (this.config.plugins.length) {
      for (const { plugin: Plugin, options: opts } of this.config.plugins) {

        let _Plugin = null
        if (isType.class(Plugin)) {
          _Plugin = new Plugin(this, opts)
        } else {
          _Plugin = Plugin
        }

        if (_Plugin['beforeCreate']) this.plugin.beforeCreate.push(_Plugin['beforeCreate'])
        if (_Plugin['created']) this.plugin.created.push(_Plugin['created'])

        // get key name
        let keys = Object.getOwnPropertyNames(isType.class(Plugin) ? Plugin.prototype : Plugin)
        this.handle(keys, _Plugin)
      }
    }
  }

  handle (keys = [], plugin) {
    let lifeCycle = ['beforeCreate', 'created', 'constructor']

    for (let key of keys) {
      if (lifeCycle.includes(key) || typeof plugin[key] !== 'function') continue

      // send/on 模型
      ipcMain.on(key, async (event, ...params) => {
        const result = await plugin[key](event, ...params)
        event.returnValue = result
        event.reply(`${key}`, result)
      })

      // invoke/handle 模型
      ipcMain.handle(key, async (event, ...params) => {
        const result = await plugin[key](event, ...params)
        return result
      })
    }
  }
}

module.exports = CeApp