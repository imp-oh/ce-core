/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-06-27 17:27:55
 * @LastEditTime: 2021-12-16 15:46:11
 * @Description: ...每位新修改者自己的信息
 */


const AdmZip = require('adm-zip');
const path = require("path")
const fs = require("fs");


let zipbuild = (config) => {
  try {
    let zip = new AdmZip();
    let dirpath = config.outDir
    let zipPath = path.join(dirpath, config.name + '.codeengine')
    let dir = fs.readdirSync(dirpath)
    for (let i = 0; i < dir.length; i++) {
      let item_path = path.join(dirpath, dir[i]);
      if (fs.statSync(item_path).isDirectory()) {
        // 判断是否是目录
        zip.addLocalFolder(item_path, dir[i])
      } else {
        zip.addLocalFile(item_path)
      }
    }
    zip.writeZip(zipPath)
    dir.forEach(item => {
      let item_path = path.join(dirpath, item);
      if (path.extname(item_path) !== '.codeengine') {
        fs.rmSync(item_path, {
          recursive: true
        })
      }
    })
  } catch (error) {
    console.log(error)
    process.exit()
  }
}


module.exports = { zipbuild }