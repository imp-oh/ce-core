/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-02 13:51:55
 * @LastEditTime: 2021-09-08 15:50:04
 * @Description: ...每位新修改者自己的信息
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandMacro = void 0;
function expandMacro(pattern, arch, appInfo, extra = {}, isProductNameSanitized = true) {

  if (arch == null) {
    pattern = pattern
      // tslint:disable-next-line:no-invalid-template-strings
      .replace("-${arch}", "")
      // tslint:disable-next-line:no-invalid-template-strings
      .replace(" ${arch}", "")
      // tslint:disable-next-line:no-invalid-template-strings
      .replace("_${arch}", "")
      // tslint:disable-next-line:no-invalid-template-strings
      .replace("/${arch}", "");
  }
  return pattern.replace(/\${([_a-zA-Z./*]+)}/g, (match, p1) => {
    switch (p1) {
      case "productName":
        return isProductNameSanitized ? appInfo.sanitizedProductName : appInfo.productName;
      case "arch":
        if (arch == null) {
          // see above, we remove macro if no arch
          return "";
        }
        return arch;
      case "author": {
        const companyName = appInfo.companyName;
        if (companyName == null) {
          throw `cannot expand pattern "${pattern}": author is not specified`
        }
        return companyName;
      }
      case "platform":
        return process.platform;
      case "channel":
        return appInfo.channel || "latest";
      default: {
        if (p1 in appInfo) {
          return appInfo[p1];
        }
        if (p1.startsWith("env.")) {
          const envName = p1.substring("env.".length);
          const envValue = process.env[envName];
          if (envValue == null) {
            throw `cannot expand pattern "${pattern}": env ${envName} is not defined`
          }
          return envValue;
        }
        const value = extra[p1];
        if (value == null) {
          throw new `cannot expand pattern "${pattern}": macro ${p1} is not defined`
        }
        else {
          return value;
        }
      }
    }
  });
}
exports.expandMacro = expandMacro;
