#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const process_1 = require("process");
var Unit;
(function (Unit) {
    Unit[Unit["KB"] = 3] = "KB";
    Unit[Unit["MB"] = 6] = "MB";
    Unit[Unit["GB"] = 9] = "GB";
})(Unit || (Unit = {}));
let params = { recurse: false, unit: "MB", fixedPoint: 3 };
const extractAssignment = (str) => {
    const arr = str.split("=");
    if (arr.length === 2)
        return [arr[0], arr[1]];
    return null;
};
const processParam = (param, value) => {
    if (param === "unit") {
        try {
            if (value !== "KB" && value !== "MB" && value !== "GB") {
                throw new Error();
            }
            params.unit = value;
        }
        catch (_err) {
            console.error(`Unit value incorrect. Received ${value}, but expected one of: ${Object.values(Unit)
                .filter((v) => typeof v === "string")
                .join(", ")}.`);
        }
    }
    if (param === "-r" || param === "-recurse") {
        params.recurse = true;
    }
};
const unitScale = 1 / 10 ** Unit[params.unit];
const analyzeDir = (path, offsetCounter = -1) => {
    const dirContent = (0, fs_1.readdirSync)(path, { withFileTypes: true });
    let dirData = {
        content: "",
        size: 0,
    };
    for (const item of dirContent) {
        for (let i = 0; i < offsetCounter; i++) {
            dirData.content += " |  ";
        }
        const itemPath = path_1.default.join(item.parentPath, item.name);
        const isDirectory = item.isDirectory();
        let itemDirData = {
            content: "",
            size: 0,
        };
        if (params.recurse && isDirectory) {
            itemDirData = analyzeDir(itemPath, offsetCounter + 1);
        }
        const size = (0, fs_1.statSync)(itemPath).size + itemDirData.size;
        const content = `${offsetCounter >= 0 ? " |__ " : ""}${item.name}${isDirectory && size === 0 ? "" : ` ${(size * unitScale).toFixed(params.fixedPoint)} ${params.unit}`}\n${itemDirData.content}`;
        dirData.size += size;
        dirData.content += content;
    }
    return dirData;
};
const args = process.argv.slice(2);
for (const arg of args) {
    if (arg.includes("-")) {
        processParam(arg);
        continue;
    }
    const assignment = extractAssignment(arg);
    if (Array.isArray(assignment)) {
        const [param, value] = assignment;
        processParam(param, value);
        continue;
    }
}
console.log(analyzeDir((0, process_1.cwd)()).content);
