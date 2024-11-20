/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-10-12 15:17:51
 * @LastEditTime: 2021-12-27 10:48:46
 * @Description: ...每位新修改者自己的信息
 */


const fs = require("fs")
const path = require("path")
const pickle = require('../pickle')

class Filesystem {
  constructor(src, header) {
    this.src = path.resolve(src)
    this.header = header ? header : { files: {} }
    // this.offset = UINT64(0)
  }

  searchNodeFromDirectory(p) {
    let json = this.header
    const dirs = p.split(path.sep)
    for (const dir of dirs) {
      if (dir !== '.') {
        json = json.files[dir]
      }
    }
    return json
  }

  searchNodeFromPath(p) {
    p = path.relative(this.src, p)
    if (!p) { return this.header }
    const name = path.basename(p)
    const node = this.searchNodeFromDirectory(path.dirname(p))
    if (node.files == null) {
      node.files = {}
    }
    if (node.files[name] == null) {
      node.files[name] = {}
    }
    return node.files[name]
  }

  insertDirectory(p, shouldUnpack) {
    const node = this.searchNodeFromPath(p)
    if (shouldUnpack) {
      node.unpacked = shouldUnpack
    }
    node.files = {}
    return node.files
  }

  listFiles(options) {
    const files = []
    const fillFilesFromHeader = function(p, json) {
      if (!json.files) {
        return
      }
      return (() => {
        const result = []
        for (const f in json.files) {
          const fullPath = path.join(p, f)
          const packState = json.files[f].unpacked === true ? 'unpack' : 'pack  '
          files.push((options && options.isPack) ? `${packState} : ${fullPath}` : fullPath)
          result.push(fillFilesFromHeader(fullPath, json.files[f]))
        }
        return result
      })()
    }

    fillFilesFromHeader('/', this.header)
    return files
  }

  getNode(p) {
    const node = this.searchNodeFromDirectory(path.dirname(p))
    const name = path.basename(p)
    if (name) {
      return node.files[name]
    } else {
      return node
    }
  }

  getFile(p, followLinks) {
    followLinks = typeof followLinks === 'undefined' ? true : followLinks
    const info = this.getNode(p)

    // if followLinks is false we don't resolve symlinks
    if (info.link && followLinks) {
      return this.getFile(info.link)
    } else {
      return info
    }
  }
}




let filesystemCache = {}

function extractFile(archive, filename) {
  const filesystem = readFilesystemSync(archive)

  return readFileSync(filesystem, filename, filesystem.getFile(filename))
}

function readFileSync(filesystem, filename, info) {

  let buffer = Buffer.alloc(info.size)
  if (info.size <= 0) { return buffer }
  if (info.unpacked) {
    // it's an unpacked file, copy it.
    buffer = fs.readFileSync(path.join(`${filesystem.src}.unpacked`, filename))
  } else {
    // Node throws an exception when reading 0 bytes into a 0-size buffer,
    // so we short-circuit the read in this case.
    const fd = fs.openSync(filesystem.src, 'r')
    try {
      const offset = 8 + filesystem.headerSize + parseInt(info.offset)
      fs.readSync(fd, buffer, 0, info.size, offset)
    } finally {
      fs.closeSync(fd)
    }
  }
  return buffer
}


function readArchiveHeaderSync(archive) {
  const fd = fs.openSync(archive, 'r')
  let size
  let headerBuf
  try {
    const sizeBuf = Buffer.alloc(8)
    // 假设 fd = 4
    // sizeBuf = 8
    // readSync 写入数据 给 sizeBuf 
    if (fs.readSync(fd, sizeBuf, 0, 8, null) !== 8) {
      throw new Error('Unable to read header size')
    }
    const sizePickle = pickle.createFromBuffer(sizeBuf)
    size = sizePickle.createIterator().readUInt32()

    headerBuf = Buffer.alloc(size)
    if (fs.readSync(fd, headerBuf, 0, size, null) !== size) {
      throw new Error('Unable to read header')
    }
  } finally {
    fs.closeSync(fd)
  }

  const headerPickle = pickle.createFromBuffer(headerBuf)
  const header = headerPickle.createIterator().readString()
  return { header: JSON.parse(header), headerSize: size }
}




function readFilesystemSync(archive) {
  if (!filesystemCache[archive]) {
    const header = readArchiveHeaderSync(archive)
    const filesystem = new Filesystem(archive)
    filesystem.header = header.header
    filesystem.headerSize = header.headerSize
    filesystemCache[archive] = filesystem
  }
  return filesystemCache[archive]
}



/**
 * 2021-12-27 新增打包API
 */


/**
 * 获取二进制的asar文件header
 * @param {*} buffer 
 * @returns 
 */
const bufferHeaderSync = (buffer) => {
  if (!buffer) throw ('no buffer')
  let oneBuf = buffer.slice(0, 8) // 获取第一个字节
  let sizeBuf = Buffer.from(oneBuf); // 写入第一个字节
  const sizePickle = pickle.createFromBuffer(sizeBuf) // 初始化一个对象
  size = sizePickle.createIterator().readUInt32()  // 获取头步字节长度
  let headerBuf = Buffer.alloc(size)
  headerBuf = buffer.slice(sizeBuf.length, headerBuf.length + sizeBuf.length)
  const headerPickle = pickle.createFromBuffer(headerBuf)
  const header = headerPickle.createIterator().readString()
  return { header: JSON.parse(header), headerSize: size }
}


/**
 *  获取对应文件流
 * @param {*} buffer 
 * @param {*} filename 文件目录地址 开头不需要斜杠(/);正确写法：filex/icon.png
 * @returns 
 */
const bufferFlie = (buffer, filename) => {
  let headerBuffer = bufferHeaderSync(buffer)
  let header = headerBuffer.header
  filesystem = new Filesystem(filename, header)
  let info = filesystem.getFile(filename)
  const offset = 8 + headerBuffer.headerSize + parseInt(info.offset)
  let bufferData = buffer.slice(offset, (offset + info.size))
  return bufferData
}



exports.bufferFlie = bufferFlie
exports.extractFile = extractFile
exports.disk = {
  readFilesystemSync
}

