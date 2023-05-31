/*
 * @Author: Chen
 * @Email: impoh@qq.com
 * @Date: 2021-12-13 09:10:54
 * @LastEditTime: 2022-03-07 15:01:48
 * @Description: ...每位新修改者自己的信息
 */



const { Command } = require('commander')

const path = require('path')
const fs = require('fs')


const __require = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

const cli = require('./cli')
const __cmd = process.cwd() // 获取要打包的文件
const program = new Command()
const Build = require("../build/index")

const { zipbuild } = require('../build/zip')


program
  .option('-l,-launch_appid [value]', 'appid') //小程序默认启动
  .option('-v,-versions', 'versions')
  .action(async (cmd) => {
    if (!cmd.launch_appid) {
      cli.yarn()
    }
  })


// 小程序打包命令
program
  .command('build').alias('bui')
  .action((cmd, options) => {
    console.time('build')
    // 打包函数时关闭
    const fun = (row) => {
      zipbuild(row)
      process.exit()
    }

    // const appCE = new Build({
    //   appDir: 'D:\\Hui\\Github\\applet\\ce-task-tag',
    // }, fun);

    // 生成环境
    const appCE = new Build({
      appDir: __cmd
    }, fun)

    appCE.initPackage()

    console.timeEnd('build')
  })


/**
 * 默认开发模式启动
 */
program
  .command('.')
  .option('-e,--env [value]', 'env') // 默认环境
  .action((cmd) => {
    global.__dirname = __cmd
    cli.run(cmd)
  })



// 项目初始化
program
  .command('init')
  .action((cmd) => {
    cli.init()
  })



// 解压ZIP项目
program
  .command('unce')
  .arguments('<fileName...>')
  .action(row => {
    cli.unce(row)
  })



// 全局依赖添加
program
  .command('global')
  .arguments('<packageName>')
  .action((packageName) => {
    cli._global(packageName)
  })


// 添加依赖
program
  .command('add')
  .arguments('<packageName>')
  .option('-D, --dev', 'dev')
  .action((packageName, option) => {
    cli.add(packageName, option)
  })


// 移除依赖
program
  .command('remove')
  .arguments('<packageName>')
  .action(packageName => {
    cli.remove(packageName)
  })




program.parse();


