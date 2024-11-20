"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cehub_1 = __importDefault(require("cehub"));
const { APP_USER_DATA } = cehub_1.default.process;
console.log(APP_USER_DATA);
const extensions = new cehub_1.default.ElectronStore({
    name: 'extensions',
    cwd: path_1.default.join(APP_USER_DATA, 'extensions') // 存储位置
});
exports.default = extensions;
