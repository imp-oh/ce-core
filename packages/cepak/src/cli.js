/*
 * @Author: Chen
 * @Email: impoh@qq.com
 * @Date: 2021-12-13 09:15:08
 * @LastEditTime: 2022-03-07 15:27:47
 * @Description: ...每位新修改者自己的信息
 */
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const __cmd = process.cwd() // 获取要打包的文件
const AdmZip = require('adm-zip')
const spawn = require('cross-spawn')

function uuid (len, prefix) {
  var chars = 'ab0cd1ef2gh3ij4kl5mn6op7qr8st9uvwxyz'.split('')
  var uuid = [],
    i
  var radix = chars.length

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
  } else {
    // rfc4122, version 4 form
    var r
    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r]
      }
    }
  }

  return prefix + uuid.join('')
}



async function init () {
  try {
    let appid = uuid(16, 'ce')
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'package name:',
        default: 'cetest',
      },
      {
        type: 'input',
        name: 'version',
        message: 'version:',
        default: '0.0.1',
      },
      {
        type: 'input',
        name: 'shortcutName',
        message: 'shortcutName:',
        default: '',
      },
      {
        type: 'input',
        name: 'description',
        message: 'description:',
        default: '',
      },
      {
        type: 'input',
        name: 'main',
        message: 'entry point:',
        default: 'index.js',
      },
      {
        type: 'input',
        name: 'appid',
        message: 'appid:',
        default: appid,
      },
      {
        type: 'input',
        name: 'author',
        message: 'author:',
        default: '',
      },
      {
        type: 'input',
        name: 'license',
        message: 'license:',
        default: 'MIT',
      },
      // {
      //   type: 'list',
      //   name: 'type',
      //   message: '项目类型',
      //   default: 'vue',
      //   choices: [
      //     { name: 'vue', value: 'vue' },
      //     { name: 'react', value: 'react' },
      //     { name: 'jq', value: 'jq' },
      //   ]
      // }
    ])

    answers.scripts = {
      "dev": "chcp 65001 && ce .",
      "dev:mac": "ce .",
      "build": "ce build"
    }
    answers.keywords = []

    fs.writeFileSync(__cmd + '/package.json', JSON.stringify(answers, null, '\t'))
    const indexjs = fs.readFileSync(path.join(__dirname, 'template/index.js'))
    const indexhtml = fs.readFileSync(path.join(__dirname, 'template/index.html'))

    fs.writeFileSync(__cmd + '/index.js', indexjs)
    fs.writeFileSync(__cmd + '/index.html', indexhtml)

  } catch (error) {
    console.log(`错误: ${error}`)
  }
}



/**
 * 项目启动
 */
function run (options) {
  var spawn = require('child_process').spawn
  let dirPaht = path.join(path.dirname(process.execPath), 'CodeEngine.exe')
  let env = ['.']
  if (options.env) env.push(`--env=${options.env}`)
  let ls = spawn(dirPaht, env)

  ls.stdout.on('data', (data) => {
    console.log(`${data}`)
  })

  ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })

}


/**
 * 解压.codeengine 文件
 * @param {*} row 
 */
let unce = (row) => {
  let [fileName, outFilePath] = row
  let isFile = ['.codeengine', '.CodeEngine', '.CODEENGINE']

  if (!isFile.includes(path.extname(fileName))) return console.error('file type error!')
  // let __cmd = 'D:\\company\\Github\\cwd\\release'

  let newPath = __cmd
  if (outFilePath && outFilePath.length !== 0) newPath = path.join(newPath, outFilePath)
  try {
    let filePath = path.join(__cmd, fileName)
    let admZip = new AdmZip(filePath)
    admZip.extractAllTo(newPath, true)
    console.log('Unpack the success!')
  } catch (error) {
    console.error(error)
  }
}




/** --------------------cli 脚手架-------------------- */


let yarn = () => {
  // let __cmd = 'D:\\company\\Github\\cwd'
  const child = spawn('yarn', [], {
    cwd: __cmd,
    stdio: 'inherit'
  })
  child.on('error', (error) => {
    console.log(error)
  })
}


let add = (packageName, option) => {
  // let __cmd = 'D:\\company\\Github\\cwd'
  let type = option.dev ? '-D' : "-S"
  const child = spawn('yarn', ['add', packageName, type], {
    cwd: __cmd,
    stdio: 'inherit'
  })
  child.on('error', (error) => {
    console.log(error)
  })
}



let remove = (packageName) => {
  // let __cmd = 'D:\\company\\Github\\cwd'
  const child = spawn('yarn', ['remove', packageName], {
    cwd: __cmd,
    stdio: 'inherit'
  })
  child.on('error', (error) => {
    console.log(error)
  })
}



let _global = (packageName) => {
  const child = spawn('yarn', ['global', packageName], {
    cwd: __cmd,
    stdio: 'inherit'
  })
  child.on('error', (error) => {
    console.log(error)
  })
}






module.exports = {
  init,
  uuid,
  run,
  unce,

  /** cli */
  yarn,
  add,
  remove,
  _global
}