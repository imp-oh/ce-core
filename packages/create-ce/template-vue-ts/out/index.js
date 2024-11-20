"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const service_1 = require("./service");
electron_1.contextBridge.exposeInMainWorld("$app", {
    $desktop: service_1.$desktop
});
