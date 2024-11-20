/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-10-12 15:25:54
 * @LastEditTime: 2021-10-12 15:40:55
 * @Description: ...每位新修改者自己的信息
 */

const path = require('path')


exports.splitPath = function(p) {
  if (typeof p !== 'string') return [false]
  if (p.substr(-5) === '.ce' || p.substr(-5) === '.asar') return [true, p, '']
  let is = p.lastIndexOf('.ce\\')
  let key = is === -1 ? '.asar' : '.ce'
  let keyLength = is === -1 ? 5 : 3
  const indexWindows = p.lastIndexOf(key + '\\')
  const indexPosix = p.lastIndexOf(key + '/')
  if (indexWindows === -1 && indexPosix === -1) return [false]
  const index = indexPosix === -1 ? indexWindows : indexPosix
  return [true, p.substr(0, index + keyLength), p.substr(index + keyLength + 1)]
}
