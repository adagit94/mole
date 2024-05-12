#!/usr/bin/env node
import platformPath from "path";
import { readdirSync, statSync } from "fs";
import { cwd } from "process";

enum Unit {
  KB = 3,
  MB = 6,
  GB = 9,
}

type Params = { recurse: boolean; unit: "KB" | "MB" | "GB"; fixedPoint: number };

let params: Params = { recurse: false, unit: "MB", fixedPoint: 3 };

const extractAssignment = (str: string): [string, string] | null => {
  const arr = str.split("=");

  if (arr.length === 2) return [arr[0], arr[1]];

  return null;
};

const processParam = (param: string, value?: string) => {
  if (param === "unit") {
    try {
      if (value !== "KB" && value !== "MB" && value !== "GB") {
        throw new Error();
      }

      params.unit = value;
    } catch (_err) {
      console.error(
        `Unit value incorrect. Received ${value}, but expected one of: ${Object.values(Unit)
          .filter((v) => typeof v === "string")
          .join(", ")}.`
      );
    }
  }

  if (param === "-r" || param === "-recurse") {
    params.recurse = true;
  }
};

type DirData = {
  content: string;
  size: number;
};

const unitScale = 1 / 10 ** Unit[params.unit];

const analyzeDir = (path: string, offsetCounter = -1): DirData => {
  const dirContent = readdirSync(path, { withFileTypes: true });
  let dirData: DirData = {
    content: "",
    size: 0,
  };

  for (const item of dirContent) {
    for (let i = 0; i < offsetCounter; i++) {
      dirData.content += " |  ";
    }

    const itemPath = platformPath.join(item.parentPath, item.name);
    const isDirectory = item.isDirectory()
    let itemDirData: DirData = {
      content: "",
      size: 0,
    };

    if (params.recurse && isDirectory) {
      itemDirData = analyzeDir(itemPath, offsetCounter + 1);
    }

    const size = statSync(itemPath).size + itemDirData.size;
    const content = `${offsetCounter >= 0 ? " |__ " : ""}${item.name}${isDirectory && size === 0 ? "" : ` ${(size * unitScale).toFixed(params.fixedPoint)} ${params.unit}`}\n${itemDirData.content}`;

    dirData.size += size
    dirData.content += content
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
    const [param, value] = assignment
    
    processParam(param, value);
    continue;
  }
}

console.log(analyzeDir(cwd()).content);
