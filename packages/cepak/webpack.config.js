/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-06-18 15:49:32
 * @LastEditTime: 2021-12-15 22:12:14
 * @Description: ...每位新修改者自己的信息
 */



"use strict"


const path = require("path")
// const { CleanWebpackPlugin } = require("clean-webpack-plugin")
// let WebpackObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin')

// 如果是 webpack 4，使用：
// https://zhuanlan.zhihu.com/p/52990313



let config = {
  mode: "production",
  target: "node",
  externals: {
    // "sqlite3": 'require("sqlite3")',
  },
  context: path.resolve(__dirname),
  entry: {
    main: "./src/index.js"
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, './dist')
  },
  optimization: {
    minimizer: [
      // 解决打包生成的注解
      new TerserPlugin({
        extractComments: false
      })
    ]
  },
  plugins: [
    // new CleanWebpackPlugin(),
    // new WebpackObfuscator({
    //   compact: true, // 压缩代码
    //   controlFlowFlattening: false, // 是否启用控制流扁平化(降低1.5倍的运行速度)
    //   deadCodeInjection: false, /// 随机的死代码块(增加了混淆代码的大小)
    //   debugProtection: false, // 此选项几乎不可能使用开发者工具的控制台选项卡
    //   debugProtectionInterval: false, // 如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
    //   disableConsoleOutput: false, // 通过用空函数替换它们来禁用console.log，console.info,console.error和console.warn。这使得调试器的使用更加困难。
    //   identifierNamesGenerator: 'hexadecimal', // 标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
    //   log: false,
    //   renameGlobals: false, // 是否启用全局变量和函数名称的混淆
    //   rotateStringArray: true, // 通过固定和随机（在代码混淆时生成）的位置移动数组。这使得将删除的字符串的顺序与其原始位置相匹配变得更加困难。如果原始源代码不小，建议使用此选项，因为辅助函数可以引起注意。
    //   selfDefending: true, // 混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
    //   stringArray: true, // 删除字符串文字并将它们放在一个特殊的数组中
    //   stringArrayEncoding: ['base64'],
    //   stringArrayThreshold: 0.75,
    //   unicodeEscapeSequence: false// 允许启用/禁用字符串转换为unicode转义序列。Unicode转义序列大大增加了代码大小，并且可以轻松地将字符串恢复为原始视图。建议仅对小型源代码启用此选项。
    // }, [])
  ],

}



module.exports = config
