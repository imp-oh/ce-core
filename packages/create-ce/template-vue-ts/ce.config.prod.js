module.exports = (app) => {
  const config = {};
  /* 开发者工具 */
  config.openDevTools = false;


  /* 主窗口 */
  config.BrowserWindow = {
    icon: `${app.config.APP_RESOURCES_DIR}\\build\\icons\\icon.ico`,
    width: 1200,
    height: 700,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // 解决跨域
    },
    show: false // 先隐藏
  }

  /* 文件地址 */
  config.loadFile = './public/web/index.html'

  /* 预加载页面 */
  config.loadingPage = './public/html/loading.html'

  /**
 * 硬件加速
 */
  config.hardGpu = {
    enable: true
  };

  return config
}

