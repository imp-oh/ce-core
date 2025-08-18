const cehub = require('cehub')
const { contextBridge } = require('electron')

console.log(cehub)
contextBridge.exposeInMainWorld("$app", {
  $desktop:() =>{
    console.log('渲染程序的API')
  }
})
