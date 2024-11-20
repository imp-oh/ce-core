const Appliaction = require('ce-core').Appliaction
const { BrowserWindow, session } = require('electron')
const log = require('electron-log')
class Main extends Appliaction {
  constructor () {
    super()
  }

  /**
   * core app have been loaded
   */
  async ready () {
    // do some things
  }

  /**
   * electron app ready
   */
  async electronAppReady () {
    // do some things

  }


  /**
 * main window have been loaded
 */
  async windowReady () {
    // do some things
    // 延迟加载，无白屏
    const winOpt = this.config.BrowserWindow
    if (winOpt.show == false) {
      const win = this.electron.mainWindow
      win.once('ready-to-show', () => {
        win.show()
      })
    }

  }
}


module.exports = Main




