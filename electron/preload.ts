const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ipc', {
  openFile: () => ipcRenderer.invoke("openFileDialog"),
  readFile: (filePath: string) => ipcRenderer.invoke("readFile", filePath),
  onOpenFile(callback: any) {
    ipcRenderer.on("open-file", (_event: any, args: string[]) => callback(args))
  }
});
