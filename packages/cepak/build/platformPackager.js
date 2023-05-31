/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-18 11:28:46
 * @LastEditTime: 2021-12-03 16:33:44
 * @Description: ...每位新修改者自己的信息
 */
const fs = require("fs")
const path = require("path")


// 读取package.json
const getPackage = (ph) => {
  const content = fs.readFileSync(ph)
  return JSON.parse(content)
}


// 判断是否有依赖
const isDependencies = (config) => {
  if (!config.dependencies) return false
  return Object.keys(config.dependencies).length !== 0
}



const getTree = (arr, appDir, readdir = [], item = {}, fileIndex = -1) => {
  // 移除软件自带依赖
  let removeNodeModules = [
    'electron',
    'adm-zip',
    'better-sqlite3',
    'ce-core',
    'electron-is',
    'electron-log',
    'electron-store',
    'form-data',
    'fs-extra',
    'uuid',
    'electron-updater',
    'cepkg'
  ]

  for (const p in arr) {
    if (removeNodeModules.includes(p)) continue

    let dir = path.join(appDir, p)
    if (!fs.existsSync(dir)) dir = path.join(this.appDir, 'node_modules', p)
    const pathPackage = path.join(dir, 'package.json')
    const config = getPackage(pathPackage)
    if (isDependencies(config)) {
      if (item.dir && readdir.length !== 0 && readdir.indexOf(config.name) !== -1) {
        if (fileIndex !== -1) this.arrayFile[fileIndex].deps.push({ name: config.name, version: config.version })
        else item.deps.push({ name: config.name, version: config.version })
      } else {
        this.arrayFile[0].deps.push({ name: config.name, version: config.version })
      }
      // 传递递归方法
      dirDeps(config.dependencies, path.join(dir, "node_modules"))
    } else {

      if (item.dir && readdir.length !== 0 && readdir.indexOf(config.name) !== -1) {
        if (fileIndex !== -1) this.arrayFile[fileIndex].deps.push({ name: config.name, version: config.version })
        else item.deps.push({ name: config.name, version: config.version })
      } else {
        this.arrayFile[0].deps.push({ name: config.name, version: config.version })
      }
    }
  }
}


const dirDeps = (all, filePaht, appDir) => {
  // if (filePaht.indexOf('ce-core') !== -1) return
  // console.log(filePaht.indexOf('ce-core'),filePaht)
  if (fs.existsSync(filePaht)) {
    const readdir = fs.readdirSync(filePaht)
    let item = { dir: filePaht, deps: [] }
    const fileIndex = this.arrayFile.findIndex(it => it.dir === filePaht)
    getTree(all, filePaht, readdir, item, fileIndex)
    if (item.deps.length !== 0 && this.arrayFile[0].dir !== filePaht) this.arrayFile.push(item)
  } else {
    getTree(all, filePaht)
  }

}





// 过滤数组对象出现重复
const arrayFilter = (all = []) => {
  all.sort(function (a, b) { //callback
    if (a.dir > b.dir) { // a b 分别是Arr中的 56 21
      return 1  //返回正数 ，b排列在a之前
    } else {
      return -1 //返回负数 ，a排列在b之前
    }
  })
  for (const fi of all) {
    fi.deps.sort(function (a, b) { //callback
      if (a.name > b.name) { // a b 分别是Arr中的 56 21
        return 1  //返回正数 ，b排列在a之前
      } else {
        return -1 //返回负数 ，a排列在b之前
      }
    })
    var hash = {}
    fi.deps = fi.deps.reduce(function (item, next) {
      hash[next.name] ? '' : hash[next.name] = true && item.push(next)
      return item
    }, [])

  }
}




/**
 * 注意！！！
 * 当前this指向 getDeps 方法
 */

const getDeps = (all, filePaht, appDir) => {

  this.appDir = appDir
  // 递归获取对应依赖
  this.arrayFile = [
    { dir: path.join(appDir, 'node_modules'), deps: [] }
  ]
  dirDeps(all, filePaht, appDir)
  arrayFilter(this.arrayFile)

  return this.arrayFile
}

module.exports = {
  getDeps,
  getPackage
}










