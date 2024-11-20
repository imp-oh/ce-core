/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-08 14:31:35
 * @LastEditTime: 2021-12-23 08:58:53
 * @Description: ...每位新修改者自己的信息
 */
// 获取node模块文件

const path = require('path')
const fs = require('fs/promises')
const fs_1 = require("./fs")
const fileMatcher_1 = require("./fileMatcher");
const NodeModuleCopyHelper_1 = require("./NodeModuleCopyHelper")
// const NODE_MODULES_PATTERN = `${path.sep}node_modules`;
const bluebird_lst_1 = require("bluebird-lst");
// const minimatch_1 = require("minimatch");
const { getDeps } = require("./platformPackager")

function getDestinationPath(file, fileSet) {
  if (file === fileSet.src) {
    return fileSet.destination;
  } else {
    const src = fileSet.src;
    const dest = fileSet.destination;
    if (file.length > src.length && file.startsWith(src) && file[src.length] === path.sep) {
      return dest + file.substring(src.length);
    } else {
      // hoisted node_modules
      // not lastIndexOf, to ensure that nested module (top-level module depends on) copied to parent node_modules, not to top-level directory
      // project https://github.com/angexis/punchcontrol/commit/cf929aba55c40d0d8901c54df7945e1d001ce022
      let index = file.indexOf(fileTransformer_1.NODE_MODULES_PATTERN);
      if (index < 0 && file.endsWith(`${path.sep}node_modules`)) {
        index = file.length - 13;
      }
      if (index < 0) {
        throw new Error(`File "${file}" not under the source directory "${fileSet.src}"`);
      }
      return dest + file.substring(index);
    }
  }
}
exports.getDestinationPath = getDestinationPath;

const getNodeModuleExcludedExts = (platformPackager) => {
  // do not exclude *.h files (https://github.com/electron-userland/electron-builder/issues/2852)
  const result = [".o", ".obj"].concat(fileMatcher_1.excludedExts.split(",").map(it => `.${it}`));
  if (platformPackager.config.includePdb !== true) {
    result.push(".pdb");
  }
  return result;
}

const validateFileSet = (fileSet) => {
  if (fileSet.src == null || fileSet.src.length === 0) {
    throw new Error("fileset src is empty");
  }
  return fileSet;
}
exports.validateFileSet = validateFileSet;



/**
 *  复制文件依赖
 * @param {*} platformPackager 
 * @param {*} mainMatcher 
 * @returns 
 */
async function computeNodeModuleFileSets(platformPackager, mainMatcher) {
  //  处理依赖包
  const deps = await getDeps(platformPackager.metadata.dependencies, path.join(platformPackager.ce.appDir, 'node_modules'),platformPackager.ce.appDir)
  const nodeModuleExcludedExts = getNodeModuleExcludedExts(platformPackager);
  const result = new Array();
  let index = 0;
  for (const info of deps) {
    const source = info.dir;
    const destination = getDestinationPath(source, { src: mainMatcher.from, destination: mainMatcher.to, files: [], metadata: null });
    const matcher = new fileMatcher_1.FileMatcher(path.dirname(source), destination, mainMatcher.macroExpander, mainMatcher.patterns);
    const copier = new NodeModuleCopyHelper_1.NodeModuleCopyHelper(matcher, platformPackager);
    const files = await copier.collectNodeModules(source, info.deps.map(it => it.name), nodeModuleExcludedExts);
    // node 模块复制到对应文件夹
    result[index++] = validateFileSet({ src: source, destination, files, metadata: copier.metadata });
  }
  return result
}
exports.computeNodeModuleFileSets = computeNodeModuleFileSets;



// used only for ASAR, if no asar, file transformed on the fly
async function transformFiles(transformer, fileSet) {
  if (transformer == null) {
    return;
  }
  let transformedFiles = fileSet.transformedFiles;
  if (fileSet.transformedFiles == null) {
    transformedFiles = new Map();
    fileSet.transformedFiles = transformedFiles;
  }
  const metadata = fileSet.metadata;
  await bluebird_lst_1.default.filter(fileSet.files, (it, index) => {
    const fileStat = metadata.get(it);
    if (fileStat == null || !fileStat.isFile()) {
      return false;
    }
    const transformedValue = transformer(it);
    if (transformedValue == null) {
      return false;
    }
    if (typeof transformedValue === "object" && "then" in transformedValue) {
      return transformedValue.then(it => {
        if (it != null) {
          transformedFiles.set(index, it);
        }
        return false;
      });
    }
    transformedFiles.set(index, transformedValue);
    return false;
  }, fs_1.CONCURRENCY);
}
exports.transformFiles = transformFiles;


