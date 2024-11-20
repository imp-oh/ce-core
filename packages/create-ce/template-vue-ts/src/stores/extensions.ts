import path from 'path'
import { app } from 'electron'
import cehub from 'cehub'
import { ProcessEnv } from 'cehub'


const { APP_USER_DATA }: any = cehub.process



console.log(APP_USER_DATA)

const extensions = new cehub.ElectronStore({
  name: 'extensions', // 文件名
  cwd: path.join(APP_USER_DATA, 'extensions') // 存储位置
})


export default extensions