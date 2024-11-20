/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-01 14:46:30
 * @LastEditTime: 2021-09-15 15:49:16
 * @Description: ...每位新修改者自己的信息
 */
const filter_1 = require("./filter")
const path = require("path")
const minimatch_1 = require("minimatch")
// https://github.com/electron-userland/electron-builder/issues/733
const minimatchOptions = { dot: true }
// noinspection SpellCheckingInspection
exports.excludedNames = ".git,.hg,.svn,CVS,RCS,SCCS," +
  "__pycache__,.DS_Store,thumbs.db,.gitignore,.gitkeep,.gitattributes,.npmignore," +
  ".idea,.vs,.flowconfig,.jshintrc,.eslintrc,.circleci," +
  ".yarn-integrity,.yarn-metadata.json,yarn-error.log,yarn.lock,package-lock.json,npm-debug.log," +
  "appveyor.yml,.travis.yml,circle.yml,.nyc_output"
exports.excludedExts = "iml,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,suo,xproj,cc,d.ts"
function ensureNoEndSlash (file) {
  if (path.sep !== "/") {
    file = file.replace(/\//g, path.sep)
  }
  if (path.sep !== "\\") {
    file = file.replace(/\\/g, path.sep)
  }
  if (file.endsWith(path.sep)) {
    return file.substring(0, file.length - 1)
  }
  else {
    return file
  }
}

function asArray (v) {
  if (v == null) {
    return []
  }
  else if (Array.isArray(v)) {
    return v
  }
  else {
    return [v]
  }
}

/** @internal */
class FileMatcher {
  constructor (from, to, macroExpander, patterns) {
    this.macroExpander = macroExpander
    this.excludePatterns = null
    this.from = ensureNoEndSlash(macroExpander(from))
    this.to = ensureNoEndSlash(macroExpander(to))
    this.patterns = asArray(patterns).map(it => this.normalizePattern(it))
    this.isSpecifiedAsEmptyArray = Array.isArray(patterns) && patterns.length === 0
  }
  normalizePattern (pattern) {
    if (pattern.startsWith("./")) {
      pattern = pattern.substring("./".length)
    }
    return path.posix.normalize(this.macroExpander(pattern.replace(/\\/g, "/")))
  }
  addPattern (pattern) {
    this.patterns.push(this.normalizePattern(pattern))
  }
  prependPattern (pattern) {
    this.patterns.unshift(this.normalizePattern(pattern))
  }
  isEmpty () {
    return this.patterns.length === 0
  }
  containsOnlyIgnore () {
    return !this.isEmpty() && this.patterns.find(it => !it.startsWith("!")) == null
  }
  computeParsedPatterns (result, fromDir) {

    const relativeFrom = fromDir == null ? null : path.relative(fromDir, this.from)
    if (this.patterns.length === 0 && relativeFrom != null) {
      // 文件映射，从这里是一个文件
      result.push(new minimatch_1.Minimatch(relativeFrom, minimatchOptions))
      return
    }
    for (let pattern of this.patterns) {
      if (relativeFrom != null) {
        pattern = path.join(relativeFrom, pattern)
      }
      const parsedPattern = new minimatch_1.Minimatch(pattern, minimatchOptions)
      result.push(parsedPattern)
      // 不添加if包含点(可能文件，如果有扩展名)
      if (!pattern.includes(".") && !filter_1.hasMagic(parsedPattern)) {
        // https://github.com/electron-userland/electron-builder/issues/545
        // add **/*
        result.push(new minimatch_1.Minimatch(`${pattern}/**/*`, minimatchOptions))
      }
    }

  }
  createFilter () {
    const parsedPatterns = []
    this.computeParsedPatterns(parsedPatterns)
    return filter_1.createFilter(this.from, parsedPatterns, this.excludePatterns)
  }
  toString () {
    return `from: ${this.from}, to: ${this.to}, patterns: ${this.patterns.join(", ")}`
  }
}
exports.FileMatcher = FileMatcher


function getNodeModuleFileMatcher (appDir, destination, macroExpander, platformSpecificBuildOptions, packager) {
  // https://github.com/electron-userland/electron-builder/pull/2948#issuecomment-392241632
  // grab only excludes
  const matcher = new FileMatcher(appDir, destination, macroExpander)
  function addPatterns (patterns) {
    if (patterns == null) {
      return
    }
    else if (!Array.isArray(patterns)) {
      if (typeof patterns === "string" && patterns.startsWith("!")) {
        matcher.addPattern(patterns)
        return
      }
      // ignore object form
      return
    }
    for (const pattern of patterns) {
      if (typeof pattern === "string") {
        if (pattern.startsWith("!")) {
          matcher.addPattern(pattern)
        }
      }
      else {
        const fileSet = pattern
        if (fileSet.from == null || fileSet.from === ".") {
          for (const p of asArray(fileSet.filter)) {
            matcher.addPattern(p)
          }
        }
      }
    }
  }
  addPatterns([{ filter: packager.config.files }])
  addPatterns(platformSpecificBuildOptions.files)
  if (!matcher.isEmpty()) {
    matcher.prependPattern("**/*")
  }

  return matcher
}

exports.getNodeModuleFileMatcher = getNodeModuleFileMatcher



function getFileMatchers (config, name, defaultDestination, options) {

  const defaultMatcher = new FileMatcher(options.defaultSrc, defaultDestination, options.macroExpander)
  const fileMatchers = []
  function addPatterns (patterns) {
    if (patterns == null) {
      return
    }
    else if (!Array.isArray(patterns)) {
      if (typeof patterns === "string") {
        defaultMatcher.addPattern(patterns)
        return
      }
      patterns = [patterns]
    }
    for (const pattern of patterns) {
      if (typeof pattern === "string") {
        // use normalize to transform ./foo to foo
        defaultMatcher.addPattern(pattern)
      }
      else if (name === "asarUnpack") {
        throw new Error(`Advanced file copying not supported for "${name}"`)
      }
      else {
        const from = pattern.from == null ? options.defaultSrc : path.resolve(options.defaultSrc, pattern.from)
        const to = pattern.to == null ? defaultDestination : path.resolve(defaultDestination, pattern.to)
        fileMatchers.push(new FileMatcher(from, to, options.macroExpander, pattern.filter))
      }
    }
  }
  if (name !== "extraDistFiles") {
    addPatterns(config[name])
  }
  // addPatterns(options.customBuildOptions[name]);
  if (!defaultMatcher.isEmpty()) {
    // default matcher should be first in the array
    fileMatchers.unshift(defaultMatcher)
  }


  // we cannot exclude the whole out dir, because sometimes users want to use some file in the out dir in the patterns
  const relativeOutDir = defaultMatcher.normalizePattern(path.relative(options.defaultSrc, options.globalOutDir))
  if (!relativeOutDir.startsWith(".")) {
    defaultMatcher.addPattern(`!${relativeOutDir}/*-unpacked{,/**/*}`)
  }


  return fileMatchers.length === 0 ? null : fileMatchers
}
exports.getFileMatchers = getFileMatchers