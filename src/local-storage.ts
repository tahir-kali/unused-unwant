import { LocalStorage } from 'node-localstorage';

// Creating an instance of LocalStorage with a given directory

const localStorages: {[key:string]:any} = {
    pages: new LocalStorage('./pages'),
    assets: new LocalStorage('./assets'),
    components: new LocalStorage('./components'),
    entities: new LocalStorage('./entities'),
    router: new LocalStorage('./router'),
    routes: new LocalStorage('./routes'),
    utils:new LocalStorage('./utils'),
    constants:new LocalStorage('./constants'),
    services:new LocalStorage('./services'),
    features: new LocalStorage('./features'),
    widgets: new LocalStorage('./widgets'),
    shared: new LocalStorage('./shared'),
  };
export const setData = (what:string,data:{key:string,value:any})=>{
  localStorages[what].setItem(data.key, data.value);
}

export const getData = (what:string,key:string)=>{
    return localStorages[what].getItem(key);
}

