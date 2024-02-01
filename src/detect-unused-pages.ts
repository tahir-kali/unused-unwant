import fs from 'fs';
import { getData, setData } from './local-storage';
// import { TDirs } from "./types";
let distPath = "";
const routerImports:string[] = [];
const unusedPages = {};
const extractImports=(filePath:string)=> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Regular expression to match import statements
    const importRegex = /import\s+.*?['"`].*?['"`]/g;
    const asyncImportRegex = /['"]@\/([^'"]+)['"]/g;
    // Extract import statements from the file content
    const importStatements = fileContent.match(importRegex);
    const asyncImports = fileContent.match(asyncImportRegex);
    if(asyncImports){
        asyncImports.forEach((importStatement) => {
            routerImports.push(extractImportPathOnly(importStatement));
        });
        setData('router',{
          key:'cachedPages2',value:JSON.stringify(routerImports)
        })
    }
    // Log or process the import statements
    if (importStatements) {
      importStatements.forEach((importStatement) => {

        routerImports.push(extractImportPathOnly(importStatement));
        setData('router',{
            key:'cachedPages2',value:JSON.stringify(routerImports)
          })
      });
    } else {
    //   console.log('No import statements found in the file.');
    }
  } catch (err) {
    console.error('Error reading the file:', err);
  }

}



export const discoverUnusedPages = async (project) => {
    let routerImportsCached = getData('router','cachedPages2');
    
    if(!routerImportsCached){
        project.router.forEach(route=>{
            extractImports(route);
        })
    }else{
        routerImportsCached = JSON.parse(routerImportsCached);
    }
    if(!routerImportsCached && routerImports.length) routerImportsCached = routerImports;

    project.pages.forEach(pagePath=>{
        const pageName = extractNameFromPath(pagePath);
    
        routerImportsCached.forEach(routerImport=>{
            if(!matchImportWithPagePath(routerImport,pagePath)){
                
                unusedPages[pageName] = pagePath;
            }else{
                delete unusedPages[pageName];
            }
        })
    });
    console.log(`Total Unused: ${Object.keys(unusedPages).length}`);
};

const extractNameFromPath = (path:string)=>{

const fileNameRegex = /\/([^\/]+)$/; // This regex captures the last part after the last '/'

const match = path.match(fileNameRegex);

if (match) {
  const name = match[1].replace(/['"]/g, '');
  const last = name.split(".");
  return last[0]
}

return ""
}

const matchImportWithPagePath = (importPath:string,path:string)=>{
  importPath = importPath.replace(/['"@]/g,'').replace(/\.\w+$/, '');
  path = path.replace(/['"@]/g,'').replace(/\.\w+$/, '');
  const ArrImp = importPath.split('/');
  const ArrPa = path.split('/');
  let result = false;
  console.log(`Comparing: ${importPath} with ${path}`);
  ArrImp.forEach(el=>{
    if(!ArrPa.includes(el)){
      result = false;
    }else{
      
      result = true;
    }
  })

  return false;

}

const extractImportPathOnly = (importStatement: string)=>{
  // Regular expression to capture the path inside single or double quotes
const pathRegex = /from\s+['"]([^'"]+)['"]/;

// Use match to extract the captured path
const match = importStatement.match(pathRegex);

// Extracted path is in the second group (index 1) of the match result
return match ? match[1] : "";
}