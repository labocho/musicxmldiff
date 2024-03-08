const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ipc', {
  openFile: () => ipcRenderer.invoke("openFileDialog"),
  readFile: (filePath: string) => ipcRenderer.invoke("readFile", filePath),
  argv: () => ipcRenderer.invoke("argv"),
});
