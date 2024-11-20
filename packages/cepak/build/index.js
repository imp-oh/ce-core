/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-01 16:23:39
 * @LastEditTime: 2022-03-02 16:21:22
 * @Description: ...每位新修改者自己的信息
 */
const fs = require("fs")
const fs_1 = require("./fs")
const path = require("path")
const bluebird_lst_1 = require("bluebird-lst")
const { expandMacro: macroExpander } = require("./macroExpander")
const AppFileWalker_1 = require("./AppFileWalker")
const promises_1 = require('fs/promises')
const minimatch_1 = require("minimatch")
const filter_1 = require("./filter")
const deep_assign = require("./deepAssign")
const fileMatcher_1 = require("./fileMatcher")
const appFileCopier_1 = require("./appFileCopier")
const minimatchOptions = { dot: true }
const asarUtil_1 = require("./asarUtil")
const fileTransformer_1 = require("./fileTransformer")
// const crypto = require('crypto')


class Build {
  constructor (options, fun = () => { }) {
    this.filesList = []
    this.nodeDependencyInfo = new Map()
    this.appDir = options.appDir
    this._isPrepackedAppAsar = false
    this.fun = fun
    this.ce = options
  }
  deleteDirectory (dir) {
    // console.log(fs.existsSync(dir))
    // if (fs.existsSync(dir) == true) {
    //   try {
    //     console.log(dir)

    //   } catch (error) {
    //     console.log("delete ======")
    //     return error
    //   }
    // }

    let _this = this
    try {
      if (fs.existsSync(dir) == true) {
        var files = fs.readdirSync(dir)
        files.forEach(function (item) {
          var item_path = path.join(dir, item)
          if (fs.statSync(item_path).isDirectory()) {
            _this.deleteDirectory(item_path)
          } else {
            fs.unlinkSync(item_path) //删除文件
          }
        })
        fs.rmdirSync(dir) // 删除目录
      }
    } catch (error) {
      console.log(error)
    }
  }
  isElectronCompileUsed (info) {
    if (info.config.electronCompile != null) {
      return info.config.electronCompile
    }
    // if in devDependencies - it means that babel is used for precompilation or for some reason user decided to not use electron-compile for production
    return this.hasDep("electron-compile", info)
  }
  hasDep (name, info) {
    const deps = info.metadata.dependencies
    return deps != null && name in deps
  }
  initPackage () {
    let appDir = this.appDir
    const appPackageFile = path.join(appDir, "package.json")
    const str = fs.readFileSync(appPackageFile, 'utf-8')
    let _package = JSON.parse(str)
    if (!_package.build) {
      _package.build = {
        "asar": true,
        "directories": {
          "output": "release"
        }
      }
    }

    this.config = _package.build
    this.metadata = _package


    this.ce = {
      ...this.ce,
      name: _package.name,
      main: _package.main,
      icon: _package.icon || "",
      version: _package.version || "",
      appid: _package.appid || "ce" + new Date().getTime(), // 生成证书ID
      description: _package.description || "",
      projectDir: appDir,
      appDir: appDir,
      asar: _package.build ? _package.build.asar : false,
      directories: _package.build && _package.build.directories ? _package.build.directories : { output: "release" },
      files: _package.build && _package.build.files ? JSON.parse(JSON.stringify(_package.build.files)) : [],
    }


    if (this.ce.icon && this.ce.icon.length !== 0) {
      let imgType = ['.ico', '.ICO']
      let extname = path.extname(this.ce.icon)
      if (!imgType.includes(extname)) throw new Error('package.json The extension format of the icon is .ico')
      fs.accessSync(path.join(this.ce.appDir, this.ce.icon)) //icon path 校验
    }

    this.ce.destination = path.join(appDir, this.ce.directories.output)
    this.ce.outDir = path.join(appDir, this.ce.directories.output)
    const asarOptions = this.ce.asar ? {} : null

    let deleteError = this.deleteDirectory(this.ce.outDir)
    if (deleteError) return this.fun(deleteError)



    const isElectronCompile = asarOptions != null && this.isElectronCompileUsed(this)
    const mainMatchers = this.getMainFileMatchers(this.ce)

    const config = this.config
    const excludePatterns = []

    if (excludePatterns.length > 0) {
      for (const matcher of mainMatchers) {
        matcher.excludePatterns = excludePatterns
      }
    }


    const transformer = this.createTransformer(appDir, this.config, isElectronCompile
      ? {
        originalMain: this.info.metadata.main,
        main: appFileCopier_1.ELECTRON_COMPILE_SHIM_FILENAME,
        ...config.extraMetadata,
      }
      : config.extraMetadata, null)

    this.transformer = transformer

    const _computeFileSets = (mainMatchers) => {
      return this.computeFileSets(mainMatchers, this.ce.asar ? null : transformer, this, mainMatchers.isElectronCompile)
        .then(async result => {
          if (!this._isPrepackedAppAsar && !this.ce.areNodeModulesHandledExternally) {
            const moduleFileMatcher = fileMatcher_1.getNodeModuleFileMatcher(appDir, this.ce.destination, macroExpander, {}, this)

            /* 处理node_modules */
            result = result.concat(await appFileCopier_1.computeNodeModuleFileSets(this, moduleFileMatcher))
          }
          return result.filter(it => it.files.length > 0)
        })
    }

    // 复制目录
    const CopyDirectory = (src, dest) => {
      if (fs.existsSync(dest) == false) {
        fs.mkdirSync(dest)
      }
      if (fs.existsSync(src) == false) {
        return false
      }
      // 拷贝新的内容进去
      var dirs = fs.readdirSync(src)
      dirs.forEach(function (item) {
        var item_path = path.join(src, item)
        var temp = fs.statSync(item_path)
        if (temp.isFile()) { // 是文件
          fs.copyFileSync(item_path, path.join(dest, item))
        } else if (temp.isDirectory()) { // 是目录
          CopyDirectory(item_path, path.join(dest, item))
        }
      })
    }

    // 复制 extraResources 文件对象
    const extraResources = () => {
      // from  => 文件位置
      // top   => 目标地址
      let data = config.extraResources || []
      let isObject = !Array.isArray(data) && (typeof data) === 'object'

      if (!Array.isArray(data) && !isObject) return

      let i = 0
      let resources = path.join(this.ce.outDir, 'resources')
      if (isObject) data = [data] // 如果是对象哲转换未数组

      while (i < data.length) {
        let item = data[i]
        if (!fs.existsSync(path.join(resources, item.to))) fs.mkdirSync(path.join(resources, item.to), { recursive: true })
        CopyDirectory(path.join(appDir, item.from), path.join(resources, item.to))
        i++
      }
    }


    if (this.ce.asar) {
      const unpackPattern = fileMatcher_1.getFileMatchers(config, "asarUnpack", this.ce.destination, {
        macroExpander,
        customBuildOptions: {}, // 这是应用程序配置，后期优化去掉
        globalOutDir: this.ce.outDir,
        defaultSrc: appDir,
      })
      const fileMatcher = unpackPattern == null ? null : unpackPattern[0]
      _computeFileSets([mainMatchers]).then(async (fileSets) => {
        for (const fileSet of fileSets) {
          await appFileCopier_1.transformFiles(transformer, fileSet)
        }

        // asar 入口
        await new asarUtil_1.AsarPackager(appDir, this.ce.outDir, asarOptions, fileMatcher == null ? null : fileMatcher.createFilter()).pack(fileSets, this)
        await extraResources()
        // await certificate()
        this.fun({ type: this.ce.asar, outDir: this.ce.outDir, name: this.ce.name })
      })

    } else {
      const transformerForExtraFiles = this.createTransformerForExtraFiles(this.ce)
      const combinedTransformer = file => {
        if (transformerForExtraFiles != null) {
          const result = transformerForExtraFiles(file)
          if (result != null) {
            return result
          }
        }
        return transformer(file)
      }

      // 2021-12-04 注释时间
      // bluebird_lst_1.default.each(_computeFileSets([mainMatchers]), it => this.copyAppFiles(it, this.ce, combinedTransformer)).then(res => {
      //   extraResources()
      //   this.fun({ type: this.ce.asar, outDir: this.ce.outDir })
      // })

      extraResources()
      bluebird_lst_1.default.each(_computeFileSets([mainMatchers]), it => this.copyAppFiles(it, this.ce, combinedTransformer)).then(async () => {
        // certificate()  // 注释时间 2022-03-02 
        setTimeout(() => {
          this.fun({ type: this.ce.asar, outDir: this.ce.outDir, name: this.ce.name })
        }, 100)
      })
    }



  }



  getNodeDependencyInfo (platform) {
    let key = ""
    let excludedDependencies = null

    if (platform != null && this.framework.getExcludedDependencies != null) {
      excludedDependencies = this.framework.getExcludedDependencies(platform)
      if (excludedDependencies != null) {
        key += `-${platform.name}`
      }
    }
    let result = this.nodeDependencyInfo.get(key)
    if (result == null) {
      result = packageDependencies_1.createLazyProductionDeps(this.appDir, excludedDependencies)
      this.nodeDependencyInfo.set(key, result)
    }
    return result
  }
  // eslint-disable-next-line
  createTransformerForExtraFiles (packContext) {
    return null
  }



  createTransformer (srcDir, configuration, extraMetadata, extraTransformer) {
    const mainPackageJson = path.join(srcDir, "package.json")
    const isRemovePackageScripts = configuration.removePackageScripts !== false
    const isRemovePackageKeywords = configuration.removePackageKeywords !== false
    const packageJson = path.sep + "package.json"
    const appid = this.ce.appid
    return file => {
      if (file === mainPackageJson) {
        return modifyMainPackageJson(file, extraMetadata, isRemovePackageScripts, isRemovePackageKeywords)
      }
      if (file.endsWith(packageJson) && file.includes(fileTransformer_1.NODE_MODULES_PATTERN)) {
        return promises_1.readFile(file, "utf-8")
          .then(it => cleanupPackageJson(JSON.parse(it), {
            isMain: false,
            isRemovePackageScripts,
            isRemovePackageKeywords,
          }))
          .catch(e => builder_util_1.log.warn(e))
      }
      else if (extraTransformer != null) {
        return extraTransformer(file)
      }
      else {
        return null
      }
    }
  }

  isLibOrExe (file) {
    return file.endsWith(".dll") || file.endsWith(".exe") || file.endsWith(".dylib") || file.endsWith(".so")
  }
  async copyAppFiles (fileSet, packager, transformer) {
    const metadata = fileSet.metadata
    const createdParentDirs = new Set()
    const fileCopier = new fs_1.FileCopier(file => {
      // https://github.com/electron-userland/electron-builder/issues/3038
      return !(this.isLibOrExe(file) || file.endsWith(".node"))
    }, transformer)

    const links = []

    for (let i = 0, n = fileSet.files.length; i < n; i++) {
      const sourceFile = fileSet.files[i]
      const stat = metadata.get(sourceFile)

      if (stat == null) {
        // dir
        continue
      }
      const destinationFile = appFileCopier_1.getDestinationPath(sourceFile, fileSet)
      if (stat.isSymbolicLink()) {  // 判断是否是链接
        links.push({ file: destinationFile, link: await promises_1.readlink(sourceFile) })
        continue
      }
      const fileParent = path.dirname(destinationFile) //获取文件目录
      if (!createdParentDirs.has(fileParent)) {
        createdParentDirs.add(fileParent)
        await promises_1.mkdir(fileParent, { recursive: true }) // 创建文件目录
      }
      fileCopier.copy(sourceFile, destinationFile, stat)
    }
  }

  getMainFileMatchers (redcap) {
    const customFirstPatterns = []
    const matcher = {
      macroExpander,
      excludePatterns: null,
      from: redcap.appDir,
      to: redcap.outDir,
      patterns: redcap.files,
      isSpecifiedAsEmptyArray: false
    }
    const patterns = matcher.patterns

    if (!matcher.isSpecifiedAsEmptyArray) {
      customFirstPatterns.push("**/*")
    }
    const relativeBuildResourceDir = path.relative(matcher.from, (redcap.directories.buildResourceDir || "build"))

    if (relativeBuildResourceDir.length !== 0 && !relativeBuildResourceDir.startsWith(".")) {
      customFirstPatterns.push(`!${relativeBuildResourceDir}{,/**/*}`)
    }

    const relativeOutDir = path.relative(redcap.projectDir, redcap.outDir)
    if (!relativeOutDir.startsWith(".")) {
      customFirstPatterns.push(`!${relativeOutDir}{,/**/*}`)
    }
    let insertIndex = 0
    for (let i = patterns.length - 1; i >= 0; i--) {
      if (patterns[i].startsWith("**/")) {
        insertIndex = i + 1
        break
      }
    }
    patterns.splice(insertIndex, 0, ...customFirstPatterns)
    patterns.push(`!**/*.{${fileMatcher_1.excludedExts}${this.config.includePdb === true ? "" : ",pdb"}}`)
    patterns.push("!**/._*")
    patterns.push("!**/electron-builder.{yaml,yml,json,json5,toml}")
    patterns.push(`!**/{${fileMatcher_1.excludedNames}}`)
    patterns.push("!.yarn{,/**/*}")
    patterns.push("!.editorconfig")
    patterns.push("!.yarnrc.yml")

    matcher.computeParsedPatterns = (result, fromDir) => {
      const relativeFrom = fromDir == null ? null : path.relative(fromDir, matcher.from)
      if (matcher.patterns.length === 0 && relativeFrom != null) {
        // file mappings, from here is a file
        result.push(new minimatch_1.Minimatch(relativeFrom, minimatchOptions))
        return
      }
      for (let pattern of matcher.patterns) {
        if (relativeFrom != null) {
          pattern = path.join(relativeFrom, pattern)
        }
        const parsedPattern = new minimatch_1.Minimatch(pattern, minimatchOptions)
        result.push(parsedPattern)
        // do not add if contains dot (possibly file if has extension)
        if (!pattern.includes(".") && !filter_1.hasMagic(parsedPattern)) {
          // https://github.com/electron-userland/electron-builder/issues/545
          // add **/*
          result.push(new minimatch_1.Minimatch(`${pattern}/**/*`, minimatchOptions))
        }
      }

    }

    matcher.createFilter = () => {
      const parsedPatterns = []
      matcher.computeParsedPatterns(parsedPatterns)
      return filter_1.createFilter(matcher.from, parsedPatterns, matcher.excludePatterns)
    }

    matcher.isEmpty = () => {
      return matcher.patterns.length === 0
    }

    matcher.containsOnlyIgnore = () => {
      return !matcher.isEmpty() && matcher.patterns.find(it => !it.startsWith("!")) == null
    }

    return matcher
  }


  async statOrNull (file) {
    return fs_1.orIfFileNotExist(promises_1.stat(file))
  }


  async computeFileSets (matchers, transformer, platformPackager, isElectronCompile) {
    const fileSets = []

    const packager = platformPackager
    for (const matcher of matchers) {
      const fileWalker = new AppFileWalker_1.AppFileWalker(matcher, packager)
      const fromStat = await this.statOrNull(this.ce.projectDir)
      if (fromStat == null) {
        // `fromStat doesn't exist`
        continue
      }

      const files = await fs_1.walk(matcher.from, fileWalker.filter, fileWalker)  // 通过walk 处理文件对象
      const metadata = fileWalker.metadata
      fileSets.push(appFileCopier_1.validateFileSet({ src: matcher.from, files, metadata, destination: matcher.to }))
    }

    // if (isElectronCompile) {
    //   fileSets.unshift(await compileUsingElectronCompile(fileSets[0], packager));
    // }

    return fileSets
  }
}


const ignoredPackageMetadataProperties = new Set(["dist", "gitHead", "build", "jspm", "ava", "xo", "nyc", "eslintConfig", "contributors", "bundleDependencies", "tags"])

// 删除package.json dev
function cleanupPackageJson (data, options) {
  const deps = data.dependencies
  // https://github.com/electron-userland/electron-builder/issues/507#issuecomment-312772099
  const isRemoveBabel = deps != null && typeof deps === "object" && !Object.getOwnPropertyNames(deps).some(it => it.startsWith("babel"))
  try {
    let changed = false
    for (const prop of Object.getOwnPropertyNames(data)) {
      // removing devDependencies from package.json breaks levelup in electron, so, remove it only from main package.json
      if (prop[0] === "_" ||
        ignoredPackageMetadataProperties.has(prop) ||
        (options.isRemovePackageScripts && prop === "scripts") ||
        (options.isRemovePackageKeywords && prop === "keywords") ||
        (options.isMain && prop === "devDependencies") ||
        (!options.isMain && prop === "bugs") ||
        (isRemoveBabel && prop === "babel")) {
        delete data[prop]
        changed = true
      }
    }
    if (changed) {
      // if (!data.appid) data.appid = options.appid
      return JSON.stringify(data, null, 2)
    }
  }
  catch (e) {
    // builder_util_1.debug(e);
    throw new Error(e)
  }
  return null
}



async function modifyMainPackageJson (file, extraMetadata, isRemovePackageScripts, isRemovePackageKeywords) {
  const mainPackageData = JSON.parse(await promises_1.readFile(file, "utf-8"))
  if (extraMetadata != null) {
    deep_assign.deepAssign(mainPackageData, extraMetadata)
  }
  // https://github.com/electron-userland/electron-builder/issues/1212
  const serializedDataIfChanged = cleanupPackageJson(mainPackageData, {
    isMain: true,
    isRemovePackageScripts,
    isRemovePackageKeywords,
  })
  if (serializedDataIfChanged != null) {
    return serializedDataIfChanged
  }
  else if (extraMetadata != null) {
    return JSON.stringify(mainPackageData, null, 2)
  }
  return null
}



module.exports = Build


