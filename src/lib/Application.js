const { app, BrowserWindow, ipcMain } = require('electron')
const isType = require('is-type-of')

const CeApp = require('./CeApp')
const getConfig = require('./Env')

// 解决webpack打包不能使用require问题
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

class Appliaction extends CeApp {
  static plugins = []
  static use (plugin, options = {}) {
    if (!plugin) throw 'no found Plugin'
    this.plugins.push({
      plugin,
      options
    })
  }
  constructor (config) {
    const options = getConfig()
    options.plugins = Appliaction.plugins
    super(options)
    this.initialize()
  }


  /* 初始化 */
  async initialize () {

    await this.ready()

    await this.createElectronApp()

    // this.register()

  }

  /* 插件注册 */
  register () {
    // UI plugins
    if (Appliaction.plugins.length) {
      for (const { plugin: Plugin, options: opts } of Appliaction.plugins) {

        let _Plugin = null
        if (isType.class(Plugin)) {
          _Plugin = new Plugin(this, opts)
        } else {
          _Plugin = Plugin
        }

        // get key name
        let keys = Object.getOwnPropertyNames(isType.class(Plugin) ? Plugin.prototype : Plugin)
        this.handle(keys, _Plugin)
      }
    }
  }

  handle (keys = [], plugin) {
    for (let key of keys) {
      if (key == 'constructor' || typeof plugin[key] !== 'function') continue

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

module.exports = Appliaction