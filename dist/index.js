#!/usr/bin/env node

// src/index.ts
import fs3 from "node:fs";

// src/detect-root.ts
import * as fs from "fs/promises";
import * as path from "path";
import simpleGit from "simple-git";
var layers = ["app", "pages", "widgets", "features", "entities", "shared"];
var defaultIgnoredFolders = ["node_modules", ".git", "dist", "build"];
async function getLayersCountInFolder(folderPath) {
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  return files.filter((file) => file.isDirectory()).map((file) => path.join(folderPath, file.name)).filter((file) => layers.includes(path.basename(file))).length;
}
async function filterIgnoredFolders(folders) {
  if (folders.length === 0) {
    return [];
  }
  const git = simpleGit();
  const ignoredByGit = (await git.checkIgnore(folders)).map(
    (folder) => path.normalize(folder.slice(1, -1))
  );
  const filteredByGit = folders.filter(
    (folder) => !ignoredByGit.includes(folder)
  );
  const filteredByDefaults = filteredByGit.filter(
    (folder) => !defaultIgnoredFolders.includes(path.basename(folder))
  );
  return filteredByDefaults;
}
async function detectFsdRoot() {
  const cwd = path.resolve(process.cwd());
  const cwdLayersCount = await getLayersCountInFolder(cwd);
  if (cwdLayersCount >= 2) {
    return cwd;
  }
  const git = simpleGit();
  const isGitRepo = await git.checkIsRepo();
  const queue = [cwd];
  let maxLayersCount = 0;
  let foldersWithMaxLayers = [];
  while (queue.length > 0) {
    const currentDirectory = queue.shift();
    const directoryContent = await fs.readdir(currentDirectory, {
      withFileTypes: true
    });
    const directories = directoryContent.filter((item) => item.isDirectory()).map((item) => path.join(currentDirectory, item.name));
    const filteredDirectories = isGitRepo ? await filterIgnoredFolders(directories) : directories.filter(
      (item) => !defaultIgnoredFolders.includes(path.basename(item))
    );
    let layerCount = 0;
    for (const item of filteredDirectories) {
      queue.push(item);
      if (layers.includes(path.basename(item))) {
        layerCount++;
      }
    }
    if (layerCount > maxLayersCount) {
      maxLayersCount = layerCount;
      foldersWithMaxLayers = [currentDirectory];
    } else if (layerCount === maxLayersCount) {
      foldersWithMaxLayers.push(currentDirectory);
    }
  }
  if (maxLayersCount === 0) {
    return cwd;
  }
  if (foldersWithMaxLayers.length === 1) {
    return foldersWithMaxLayers[0];
  }
  return foldersWithMaxLayers;
}

// src/constants.ts
var fsdRoot = await detectFsdRoot();
if (Array.isArray(fsdRoot)) {
  fsdRoot = fsdRoot[0];
} else if (!fsdRoot.split("/").includes("src")) {
  fsdRoot = `${fsdRoot}/src`;
}

// src/index.ts
import { join as join2 } from "node:path";

// src/detect-unused-pages.ts
import fs2 from "fs";

// src/local-storage.ts
import { LocalStorage } from "node-localstorage";
var localStorages = {
  pages: new LocalStorage("./pages"),
  assets: new LocalStorage("./assets"),
  components: new LocalStorage("./components"),
  entities: new LocalStorage("./entities"),
  router: new LocalStorage("./router"),
  routes: new LocalStorage("./routes"),
  utils: new LocalStorage("./utils"),
  constants: new LocalStorage("./constants"),
  services: new LocalStorage("./services"),
  features: new LocalStorage("./features"),
  widgets: new LocalStorage("./widgets"),
  shared: new LocalStorage("./shared")
};
var setData = (what, data) => {
  localStorages[what].setItem(data.key, data.value);
};
var getData = (what, key) => {
  return localStorages[what].getItem(key);
};

// src/detect-unused-pages.ts
var routerImports = [];
var unusedPages = {};
var extractImports = (filePath) => {
  try {
    const fileContent = fs2.readFileSync(filePath, "utf8");
    const importRegex = /import\s+.*?['"`].*?['"`]/g;
    const asyncImportRegex = /['"]@\/([^'"]+)['"]/g;
    const importStatements = fileContent.match(importRegex);
    const asyncImports = fileContent.match(asyncImportRegex);
    if (asyncImports) {
      asyncImports.forEach((importStatement) => {
        routerImports.push(extractImportPathOnly(importStatement));
      });
      setData("router", {
        key: "cachedPages2",
        value: JSON.stringify(routerImports)
      });
    }
    if (importStatements) {
      importStatements.forEach((importStatement) => {
        routerImports.push(extractImportPathOnly(importStatement));
        setData("router", {
          key: "cachedPages2",
          value: JSON.stringify(routerImports)
        });
      });
    } else {
    }
  } catch (err) {
    console.error("Error reading the file:", err);
  }
};
var discoverUnusedPages = async (project2) => {
  let routerImportsCached = getData("router", "cachedPages2");
  if (!routerImportsCached) {
    project2.router.forEach((route) => {
      extractImports(route);
    });
  } else {
    routerImportsCached = JSON.parse(routerImportsCached);
  }
  if (!routerImportsCached && routerImports.length)
    routerImportsCached = routerImports;
  project2.pages.forEach((pagePath) => {
    const pageName = extractNameFromPath(pagePath);
    routerImportsCached.forEach((routerImport) => {
      if (!matchImportWithPagePath(routerImport, pagePath)) {
        unusedPages[pageName] = pagePath;
      } else {
        delete unusedPages[pageName];
      }
    });
  });
  console.log(`Total Unused: ${Object.keys(unusedPages).length}`);
};
var extractNameFromPath = (path2) => {
  const fileNameRegex = /\/([^\/]+)$/;
  const match = path2.match(fileNameRegex);
  if (match) {
    const name = match[1].replace(/['"]/g, "");
    const last = name.split(".");
    return last[0];
  }
  return "";
};
var matchImportWithPagePath = (importPath, path2) => {
  importPath = importPath.replace(/['"@]/g, "").replace(/\.\w+$/, "");
  path2 = path2.replace(/['"@]/g, "").replace(/\.\w+$/, "");
  const ArrImp = importPath.split("/");
  const ArrPa = path2.split("/");
  let result = false;
  console.log(`Comparing: ${importPath} with ${path2}`);
  ArrImp.forEach((el) => {
    if (!ArrPa.includes(el)) {
      result = false;
    } else {
      result = true;
    }
  });
  return false;
};
var extractImportPathOnly = (importStatement) => {
  const pathRegex = /from\s+['"]([^'"]+)['"]/;
  const match = importStatement.match(pathRegex);
  return match ? match[1] : "";
};

// src/index.ts
var project = {
  pages: [],
  assets: [],
  components: [],
  entities: [],
  router: [],
  routes: [],
  utils: [],
  constants: [],
  services: [],
  features: [],
  widgets: [],
  shared: []
};
var projectPaths = {
  pages: "",
  components: "",
  entities: "",
  router: "",
  assets: "",
  services: "",
  utils: "",
  constants: "",
  routes: "",
  features: "",
  widgets: "",
  shared: ""
};
var ignorePaths = [
  "node_modules",
  "dist",
  ".git",
  ".husky",
  ".github",
  ".idea",
  ".vscode"
];
var routeWithinSrc = false;
var exploredPaths = /* @__PURE__ */ new Set();
var discoverSrc = async (exploreDir = null, checkRootDir = true) => {
  const rootArr = exploreDir ? exploreDir : fsdRoot.toString().split("/");
  let dir = rootArr;
  if (rootArr[rootArr.length - 1] !== "src" && Array.isArray(rootArr) && checkRootDir) {
    const indexOfSrc = rootArr.indexOf("src");
    dir = rootArr.slice(0, indexOfSrc + 1).join("/");
  } else if (Array.isArray(rootArr)) {
    dir = rootArr.join("/");
  }
  if (!await manualConfirmNotDirectory(dir.toString())) {
    return;
  }
  const entries = await fs3.promises.readdir(dir.toString(), { withFileTypes: true });
  for (const entry of entries) {
    projectPaths[entry.name] = `${entry.path}/${entry.name}`;
    if (typeof entry.name !== "undefined" && typeof projectPaths[entry.name] !== "undefined" && typeof project[entry.name] !== "undefined") {
      await discoverDirectories(entry.name, projectPaths[entry.name]);
    } else {
      await discoverSrc(projectPaths[entry.name], false);
    }
  }
  if (project.pages.length) {
    discoverUnusedPages(project);
  }
};
var discoverDirectories = async (what, path2 = "") => {
  if (exploredPaths.has(path2) && path2 !== "") {
    return;
  }
  exploredPaths.add(path2);
  const dir = path2 ? path2 : `${fsdRoot}/${what}`;
  const dirArr = dir.split("/");
  const hasIgnoredPaths = dir.split("/").filter((currDir) => ignorePaths.includes(currDir));
  if (hasIgnoredPaths.length || !dirArr.includes(what)) {
    return;
  }
  try {
    const stats = await fs3.promises.stat(dir);
    if (stats.isDirectory() && await manualConfirmNotDirectory(dir)) {
      const entries = await fs3.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = join2(dir, entry.name);
        const entryArr = entryPath.split("/");
        if (entryArr.includes("route") || entryArr.includes("router")) {
          routeWithinSrc = true;
        }
        if (entry.isDirectory() && await manualConfirmNotDirectory(dir)) {
          if (!exploredPaths.has(entryPath)) {
            await discoverDirectories(what, entryPath);
          }
        } else if (entry.isFile() && typeof project[what] !== "undefined") {
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
var manualConfirmNotDirectory = async (path2) => {
  const pathArr = path2.split("/");
  const last = pathArr[pathArr.length - 1].split(".");
  if (last.length > 1) {
    return false;
  }
  return true;
};
discoverSrc();
