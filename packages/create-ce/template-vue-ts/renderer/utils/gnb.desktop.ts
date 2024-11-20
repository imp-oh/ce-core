import { GNBEventManager } from './event-manager'

declare global {
  interface Window {
    $app: any
  }
}

/**
 * 获取安装程序应用
 */
export function getAppletList() {
  return window.$app.$desktop({ type: 'appletList', data: {} })
}

/**
 * 打开小程序
 */
export function openApplet(data = {}) {
  window.$app.$desktop({ type: 'openApplet', data: JSON.parse(JSON.stringify(data)) })
}


/**
 * 「监听」创建 Tab
 */
export function onCreateTab(source: any, callback: (id: number) => void): any {
  GNBEventManager.shared.on(source, 'desktop.onCreateTab', ({ id }) => {
    callback(id)
  })
}



/**
 * [删除小程序]
 * @param appId 
 */
export function deleteApplet(appId: string) {
  return window.$app.$desktop({ type: 'deleteApplet', data:appId})
}