const { contextBridge, ipcRenderer } = require('electron')

// renderer から呼ばれる
contextBridge.exposeInMainWorld('ipc', {
  openFile: () => ipcRenderer.invoke("openFileDialog"),
  readFile: (filePath: string) => ipcRenderer.invoke("readFile", filePath),
  onOpenFile(callback: any) {
    ipcRenderer.on("open-file", (_event: any, args: string[]) => callback(args))
  },
});


// main から呼ばれる
ipcRenderer.on("log", (_event: any, ...args: any) => console.log(args))
