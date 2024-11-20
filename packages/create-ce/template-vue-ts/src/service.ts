import cehub from 'cehub'
import extensions from './stores/extensions'

import { shell } from 'electron'

const appletList = () => {
  const lists: any = []
  try {
    const getList: any = extensions
    const rows: any = getList.get() || {}
    cehub.store.set('user',1231)
    console.log(cehub.store.get('user'))
    for (let i in rows) {
      const row = rows[i]
      if (row) lists.push(row)
    }
    return lists
  } catch (error) {
    cehub.log.error(error)
    return lists
  }
}


/**
 * 打开小程序
 * @param params 
 * @returns 
 */
const openApplet = (params: any) => {
  const env: any = cehub.process
  processSpawn(env.APP_EXEC_DIR, params.build.appId)
  return {}
}

/**
 * 打开程序方法
 * @param pathExe 
 * @param target 
 */
const processSpawn = (pathExe: string, target: string) => {
  try {
    var spawn = require('child_process').spawn
    spawn(pathExe, [`-launch_appid=${target}`])
  } catch (error) {
    console.log(error)
    shell.openPath(pathExe)
  }
}


/**
 * [删除小程序]
 * @param appId 
 */
const deleteApplet = (appId: string) => {
  process.noAsar = true // 禁用asar文件后解压
  // const app: any = extensions.get(appId)
  // console.log(app.build.path)
  try {
    // cehub.fs.removeSync(app.build.path)
    // extensions.delete(appId)
    return {
      code: 200,
      msg: '删除成功'
    }
  } catch (error) {
    return {
      code: 400,
      msg: '删除错误'
    }
  }finally{
    process.noAsar = false
  }
}


const functionMap: any = {
  appletList,
  openApplet,
  deleteApplet
}


export const $desktop = async ({ type, data }: { type: string, data: any }) => {
  const func = functionMap[type]
  if (!func) {
    throw new Error(type + ' 方法未实现')
  }
  return func(data)
}


