# create-ce 是一个 ce 引擎启动框架

此框架用于electron 小程序开发启动框架使用

此框架还在升级中，兼容electron ，支持win 。
1.0.4 版本新增适配小程序跟electron应用程序小程序 跟 electron应用 可以共用一个 ce-core 依赖

# 小程序启动实现案例
[code-engine](https://github.com/impohcom/code-engine)
code-engine 是利用electron框架，通过 process.argv 获取appid，来切换不同的小程序。
https://github.com/impohcom/code-engine



#  模块更新记录
1. 升级electron,升级sqlite3，实现主程序跟视图 单开吊用，升级小程序启动方式，移除历史store，小程序数据存储进 sqlite数据库中
2. 更新模块 process.env , 用于跟视图通讯，改写视图 Module 方法，实现主程序跟渲染程序同步



# 生命周期
1. beforeCreate（创建前）
2. created （创建后）
<!-- 3. beforeMount (载入前) -->
<!-- 4. mounted （载入后） -->



## 搭建第一个 ce 项目

  #### 兼容警告 
  ce 需要 [Node.js](https://nodejs.org/en/)版本 14.18+，16+。然而，有些模板需要依赖更高的 Node 版本才能正常运行，当你的包管理器发出警告时，请注意升级你的 Node 版本。

使用 NPM:

```sh
$ npm create ce@latest
```

使用 Yarn:

```sh
$ yarn create ce
```

使用 PNPM:

```sh
$ pnpm create ce
```

然后按照提示操作即可！

你还可以通过附加的命令行选项直接指定项目名称和你想要使用的模板。例如，要构建一个 Vite + Vue 项目，运行:

``` sh
# npm 6.x
npm create ce@latest my-vue-app --template vue

# npm 7+, extra double-dash is needed:
npm create ce@latest my-vue-app -- --template vue

# yarn
yarn create ce my-vue-app --template vue

# pnpm
pnpm create ce my-vue-app --template vue

```

查看 [create-vite](https://github.com/impohcom/ce-core/tree/main/packages/create-ce) 以获取每个模板的更多细节：`ce`,`vanilla`，`vanilla-ts`, `vue`, `vue-ts`，`react`，`react-ts`，`react-swc`，`react-swc-ts`，`preact`，`preact-ts`，`svelte`，`svelte-ts`。

