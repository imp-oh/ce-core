import path from 'path'
import cehub from 'cehub'
import { shell, contextBridge } from 'electron'
import { $desktop } from './service'

contextBridge.exposeInMainWorld("$app", {
  $desktop
})



