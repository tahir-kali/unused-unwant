#!/usr/bin/env node

import fs from "node:fs";
import { fsdRoot } from "./constants";
import { join } from "node:path";
import { discoverUnusedPages } from "./detect-unused-pages";
import { TDirs } from "./types";

const project: TDirs = {
  pages: [],
  assets: [],
  components: [],
  entities: [],
  router: [],
  routes: [],
  utils:[],
  constants:[],
  services:[],
  features: [],
  widgets: [],
  shared: [],
};
const projectPaths: { [key: string]: string } = {
  pages: "",
  components: "",
  entities: "",
  router: "",
  assets:"",
  services:"",
  utils:"",
  constants:"",
  routes:"",
  features: "",
  widgets: "",
  shared: "",
};

const ignorePaths = [
  'node_modules',
  'dist',
  '.git',
  '.husky',
  '.github',
  '.idea',
  '.vscode',
];
let routeWithinSrc = false;
const exploredPaths = new Set();

const discoverSrc = async (exploreDir: string | null = null, checkRootDir: boolean = true) => {
  const rootArr = exploreDir ? exploreDir : fsdRoot.toString().split('/');
  let dir: string | string[] = rootArr;

  if (rootArr[rootArr.length - 1] !== 'src' && Array.isArray(rootArr) && checkRootDir) {
    const indexOfSrc = rootArr.indexOf('src');
    dir = rootArr.slice(0, indexOfSrc + 1).join('/');
  }else if(Array.isArray(rootArr)){
    dir = rootArr.join('/')
  }
  

  if (!(await manualConfirmNotDirectory(dir.toString()))) {
    return;
  }

  const entries = await fs.promises.readdir(dir.toString(), { withFileTypes: true });

  for (const entry of entries) {
    projectPaths[entry.name] = `${entry.path}/${entry.name}`;
    if (typeof entry.name !== 'undefined' && typeof projectPaths[entry.name] !== 'undefined' && typeof project[entry.name] !== 'undefined') {
      await discoverDirectories(entry.name, projectPaths[entry.name]);
    } else {
      await discoverSrc(projectPaths[entry.name], false);
    }
  }
  if(project.pages.length){
    discoverUnusedPages(project);
  }
 
};

const discoverDirectories = async (what: string, path: string = "") => {
  if (exploredPaths.has(path) && path !== "") {
    return;
  }

  exploredPaths.add(path);
  const dir = path ? path : `${fsdRoot}/${what}`;
  const dirArr = dir.split('/');
  const hasIgnoredPaths = dir.split('/').filter(currDir => ignorePaths.includes(currDir));

  if (hasIgnoredPaths.length || !dirArr.includes(what)) {
    return;
  }

  try {
    const stats = await fs.promises.stat(dir);

    if (stats.isDirectory() && (await manualConfirmNotDirectory(dir))) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = join(dir, entry.name);
        const entryArr = entryPath.split('/');

        if (entryArr.includes('route') || entryArr.includes('router')) {
          routeWithinSrc = true;
        }

        if (entry.isDirectory() && (await manualConfirmNotDirectory(dir))) {
          if (!exploredPaths.has(entryPath)) {
            await discoverDirectories(what, entryPath);
          }
        } else if (entry.isFile() && typeof project[what] !== 'undefined') {
          project[what].push(entryPath);
        }
      }
    } else {
      console.log(`Cannot determine either file or folder: ${JSON.stringify(stats)}`);
    }
  } catch (e) {
    console.log(`Error reading: ${dir}`);
  }
};

const manualConfirmNotDirectory = async (path: string) => {
  const pathArr = path.split('/');
  const last = pathArr[pathArr.length - 1].split('.');

  if (last.length > 1) {
    return false;
  }

  return true;
};

// const discoverDirectoriesOutSideSrc = async () => {
//   const routeArr = fsdRoot.toString().split('/');
//   const outsideSrc = routeArr.slice(0, routeArr.length - 2).join('/');
//   searchingOutsideSrc = true;
//   ignorePaths.push('src');
//   await discoverDirectories('routes', outsideSrc);
// }



discoverSrc();

