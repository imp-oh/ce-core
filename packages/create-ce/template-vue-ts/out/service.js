"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.$desktop = void 0;
const cehub_1 = __importDefault(require("cehub"));
const extensions_1 = __importDefault(require("./stores/extensions"));
const electron_1 = require("electron");
const appletList = () => {
    const lists = [];
    try {
        const getList = extensions_1.default;
        const rows = getList.get() || {};
        cehub_1.default.store.set('user', 1231);
        console.log(cehub_1.default.store.get('user'));
        for (let i in rows) {
            const row = rows[i];
            if (row)
                lists.push(row);
        }
        return lists;
    }
    catch (error) {
        cehub_1.default.log.error(error);
        return lists;
    }
};
/**
 * 打开小程序
 * @param params
 * @returns
 */
const openApplet = (params) => {
    const env = cehub_1.default.process;
    processSpawn(env.APP_EXEC_DIR, params.build.appId);
    return {};
};
/**
 * 打开程序方法
 * @param pathExe
 * @param target
 */
const processSpawn = (pathExe, target) => {
    try {
        var spawn = require('child_process').spawn;
        spawn(pathExe, [`-launch_appid=${target}`]);
    }
    catch (error) {
        console.log(error);
        electron_1.shell.openPath(pathExe);
    }
};
/**
 * [删除小程序]
 * @param appId
 */
const deleteApplet = (appId) => {
    process.noAsar = true; // 禁用asar文件后解压
    // const app: any = extensions.get(appId)
    // console.log(app.build.path)
    try {
        // cehub.fs.removeSync(app.build.path)
        // extensions.delete(appId)
        return {
            code: 200,
            msg: '删除成功'
        };
    }
    catch (error) {
        return {
            code: 400,
            msg: '删除错误'
        };
    }
    finally {
        process.noAsar = false;
    }
};
const functionMap = {
    appletList,
    openApplet,
    deleteApplet
};
const $desktop = ({ type, data }) => __awaiter(void 0, void 0, void 0, function* () {
    const func = functionMap[type];
    if (!func) {
        throw new Error(type + ' 方法未实现');
    }
    return func(data);
});
exports.$desktop = $desktop;
