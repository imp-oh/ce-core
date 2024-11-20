/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-08 10:58:12
 * @LastEditTime: 2021-12-04 12:43:59
 * @Description: ...每位新修改者自己的信息
 */

const promises_1 = require("fs/promises");
const stat_mode_1 = require("stat-mode");
const fs_extra_1 = require("fs-extra");
const bluebird_lst_1 = require("bluebird-lst");
const path = require("path")
const USE_HARD_LINKS = (file) => true;
exports.USE_HARD_LINKS = USE_HARD_LINKS;
exports.MAX_FILE_REQUESTS = 8;
exports.CONCURRENCY = { concurrency: exports.MAX_FILE_REQUESTS };

const _isUseHardLink = process.platform !== "win32" && process.env.USE_HARD_LINKS !== "false" && (isCI || process.env.USE_HARD_LINKS === "true");
class CopyFileTransformer {
  constructor(afterCopyTransformer) {
    this.afterCopyTransformer = afterCopyTransformer;
  }
}
class FileCopier {
  constructor(isUseHardLinkFunction, transformer) {
    this.isUseHardLinkFunction = isUseHardLinkFunction;
    this.transformer = transformer;
    if (isUseHardLinkFunction === exports.USE_HARD_LINKS) {
      this.isUseHardLink = true;
    }
    else {
      this.isUseHardLink = _isUseHardLink && isUseHardLinkFunction !== exports.DO_NOT_USE_HARD_LINKS;
    }
  }
  async copy(src, dest, stat) {

    let afterCopyTransformer = null;
  
    if (this.transformer != null && stat != null && stat.isFile()) {
      let data = this.transformer(src); // 获取的都是 package.json 文件类型
      if (data != null) {
        if (typeof data === "object" && "then" in data) {
          data = await data;
        }
        if (data != null) {
          if (data instanceof CopyFileTransformer) {
            afterCopyTransformer = data.afterCopyTransformer;
          }
          else {
            // json
            await promises_1.writeFile(dest, data);
            return;
          }
        }
      }
    }
    const isUseHardLink = afterCopyTransformer == null && (!this.isUseHardLink || this.isUseHardLinkFunction == null ? this.isUseHardLink : this.isUseHardLinkFunction(dest));
    await copyOrLinkFile(src, dest, stat, isUseHardLink, isUseHardLink
      ? () => {
        // files are copied concurrently, so, we must not check here currentIsUseHardLink — our code can be executed after that other handler will set currentIsUseHardLink to false
        if (this.isUseHardLink) {
          this.isUseHardLink = false;
          return true;
        }
        else {
          return false;
        }
      }
      : null);
    if (afterCopyTransformer != null) {
      await afterCopyTransformer(dest);
    }
  }
}
exports.FileCopier = FileCopier;


function copyOrLinkFile(src, dest, stats, isUseHardLink, exDevErrorHandler) {
  if (isUseHardLink === undefined) {
    isUseHardLink = _isUseHardLink;
  }
  if (stats != null) {
    const originalModeNumber = stats.mode;
    const mode = new stat_mode_1.Mode(stats);
    if (mode.owner.execute) {
      mode.group.execute = true;
      mode.others.execute = true;
    }
    mode.group.read = true;
    mode.others.read = true;
    mode.setuid = false;
    mode.setgid = false;
    // if (originalModeNumber !== stats.mode) {
    //   if (log_1.log.isDebugEnabled) {
    //     const oldMode = new stat_mode_1.Mode({ mode: originalModeNumber });
    //     log_1.log.debug({ file: dest, oldMode, mode }, "permissions fixed from");
    //   }
    //   // https://helgeklein.com/blog/2009/05/hard-links-and-permissions-acls/
    //   // Permissions on all hard links to the same data on disk are always identical. The same applies to attributes.
    //   // That means if you change the permissions/owner/attributes on one hard link, you will immediately see the changes on all other hard links.
    //   if (isUseHardLink) {
    //     isUseHardLink = false;
    //     log_1.log.debug({ dest }, "copied, but not linked, because file permissions need to be fixed");
    //   }
    // }
  }
  // if (isUseHardLink) {
  //   return promises_1.link(src, dest).catch(e => {
  //     if (e.code === "EXDEV") {
  //       const isLog = exDevErrorHandler == null ? true : exDevErrorHandler();
  //       if (isLog && log_1.log.isDebugEnabled) {
  //         log_1.log.debug({ error: e.message }, "cannot copy using hard link");
  //       }
  //       return doCopyFile(src, dest, stats);
  //     }
  //     else {
  //       throw e;
  //     }
  //   });
  // }
  return doCopyFile(src, dest, stats);
}

function doCopyFile(src, dest, stats) {
  const promise = fs_extra_1.copyFile(src, dest);
  if (stats == null) {
    return promise;
  }
  return promise.then(() => promises_1.chmod(dest, stats.mode));
}




const walk = async (initialDirPath, filter, consumer) => {
  let result = [];
  const queue = [initialDirPath];
  let addDirToResult = false;
  const isIncludeDir = consumer == null ? false : consumer.isIncludeDir === true;
  while (queue.length > 0) {
    const dirPath = queue.pop();
    if (isIncludeDir) {
      if (addDirToResult) {
        result.push(dirPath);
      }
      else {
        addDirToResult = true;
      }
    }
    const childNames = await orIfFileNotExist(promises_1.readdir(dirPath), []);
    childNames.sort();
    let nodeModuleContent = null;
    const dirs = [];
    const sortedFilePaths = await bluebird_lst_1.default.map(childNames, name => {
      if (name === ".DS_Store" || name === ".gitkeep") {
        return null;
      }
      const filePath = dirPath + path.sep + name;
      return promises_1.lstat(filePath).then(stat => {
        if (filter != null && !filter(filePath, stat)) {
          return null;
        }


        const consumerResult = consumer == null ? null : consumer.consume(filePath, stat, dirPath, childNames);
        if (consumerResult === false) {
          return null;
        }
        else if (consumerResult == null || !("then" in consumerResult)) {
          if (stat.isDirectory()) {
            dirs.push(name);
            return null;
          }
          else {
            return filePath;
          }
        }
        else {
          return consumerResult.then((it) => {
            if (it != null && Array.isArray(it)) {
              nodeModuleContent = it;
              return null;
            }
            // asarUtil can return modified stat (symlink handling)
            if ((it != null && "isDirectory" in it ? it : stat).isDirectory()) {
              dirs.push(name);
              return null;
            }
            else {
              return filePath;
            }
          });
        }
      });
    }, exports.CONCURRENCY);

    for (const child of sortedFilePaths) {
      if (child != null) {
        result.push(child);
      }
    }
    dirs.sort();
    for (const child of dirs) {
      queue.push(dirPath + path.sep + child);
    }
    if (nodeModuleContent != null) {
      result = result.concat(nodeModuleContent);
    }
  }
  return result;
}





exports.walk = walk;


const orIfFileNotExist = (promise, fallbackValue) => {
  return promise.catch(e => {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return fallbackValue;
    }
    throw e;
  });
}

exports.orIfFileNotExist = orIfFileNotExist;