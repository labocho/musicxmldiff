const fs = require("node:fs")
const path = require("node:path")
const { app, BrowserWindow, ipcMain, dialog } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })


  win.loadFile(path.join(__dirname, 'index.html'))
  return win
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});


app.whenReady().then(() => {
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  let currentWindow: (BrowserWindow|null) = null;

  ipcMain.handle("argv", async () => process.argv.slice(2));

  ipcMain.handle("openFileDialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(currentWindow!, {properties: ['openFile']})
    if (!canceled) {
      return filePaths[0];
    }
  });

  ipcMain.handle("readFile", (_event, filePath: string) => {
    return new Promise((resolve) => {
      resolve({
        data: fs.readFileSync(filePath, "utf-8"),
        name: path.basename(filePath),
      });
    })
  });
  currentWindow = createWindow()
})
