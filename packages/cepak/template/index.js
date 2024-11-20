const { app, BrowserWindow } = require('electron')
const path = require('path')

/**
 * 可通过获取 process.env 来得到常用路径
 *  */
const { APP_HOME_DIR } = process.env

let win
function create () {
  win = new BrowserWindow({
    width: 1200,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // 解决跨域
    },
  })
  win.loadFile(path.join(APP_HOME_DIR, './index.html'))
  // win.webContents.openDevTools(); // 打开调试框
}

app.on('window-all-closed', (evt) => {
  app.quit() // 显示调用quit才会退出
})

app.on("quit", () => {
  process.exit()
})

// 初始化
app.on("ready", () => {
  create()
})
