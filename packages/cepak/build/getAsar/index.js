/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-10-12 15:25:31
 * @LastEditTime: 2021-12-27 09:59:51
 * @Description: ...每位新修改者自己的信息
 */

const paht = require('path')
const fs = require('fs')
const asar = require('./asar.js')
const { splitPath } = require('./util.js')



/**
 *  获取.asar文件的内容
 * @param {*} _filePath 
 * @returns 
 */
const getFileBuffer = (_filePath) => {
  const [isAsar, asarPath, filePath] = splitPath(_filePath)
  //asarPath => xx/app.asar 
  //filePath => package.json
  const buffer = asar.extractFile(asarPath, filePath)
  return buffer
}



/**
 * 获取.asar缓冲区
 * @param {*} buffer  
 * @param {*} filePath  // 路径(开头不需要前缀/):  icon/go.png
 */
const getAsarBuffer = (buffer, filePath) => {
  let buf = asar.bufferFlie(buffer, filePath)
  return buf
}



const dowFile = () => {
  var data = fs.readFileSync(paht.join(__dirname, '../', '/img/icon.ico'))
  // const buffer = new Buffer(data, 'base64'); // 弃用
  const buffer = new Buffer.from(data, 'base64');
  fs.writeFileSync(paht.join(__dirname, '../', '/img/icon.png'), buffer)
}


module.exports = {
  getFileBuffer,
  splitPath,
  getAsarBuffer
}


