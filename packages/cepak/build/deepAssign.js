/*
 * @Author: Chen
 * @Email: cnblogco@qq.com
 * @Date: 2021-09-08 11:31:40
 * @LastEditTime: 2021-09-17 16:33:37
 * @Description: ...每位新修改者自己的信息
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepAssign = void 0;
function isObject(x) {
    if (Array.isArray(x)) {
        return false;
    }
    const type = typeof x;
    return type === "object" || type === "function";
}
function assignKey(target, from, key) {
    const value = from[key];
    // https://github.com/electron-userland/electron-builder/pull/562
    if (value === undefined) {
        return;
    }
    const prevValue = target[key];
    if (prevValue == null || value == null || !isObject(prevValue) || !isObject(value)) {
        target[key] = value;
    }
    else {
        target[key] = assign(prevValue, value);
    }
}
function assign(to, from) {
    if (to !== from) {
        for (const key of Object.getOwnPropertyNames(from)) {
            assignKey(to, from, key);
        }
    }
    return to;
}
function deepAssign(target, ...objects) {
    for (const o of objects) {
        if (o != null) {
            assign(target, o);
        }
    }
    return target;
}
exports.deepAssign = deepAssign;