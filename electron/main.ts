const fs = require("node:fs")
const path = require("node:path")
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')

// シングルインスタンスの強制
const gotTheLock: boolean = app.requestSingleInstanceLock();
if (!gotTheLock) app.exit();

async function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })


  await win.loadFile(path.join(__dirname, 'index.html'))
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

  app.on('second-instance', (_e: any, argv: any) => {
    if (currentWindow.isMinimized()) currentWindow.restore();
    currentWindow.focus();

    // ファイルからインスタンスが開始された場合
    if (argv.length >= 3) {
      const filepath = argv[argv.length - 1];

      // レンダラープロセスへファイルパスを送信
      currentWindow.webContents.send('open-file', argv.slice(4));
    }
  });

  let currentWindow: any = null;

  ipcMain.handle("openFileDialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(currentWindow!, {properties: ['openFile']})
    if (!canceled) {
      return filePaths[0];
    }
  });

  ipcMain.handle("readFile", (_event: any, filePath: string) => {
    return new Promise((resolve) => {
      resolve({
        data: fs.readFileSync(filePath, "utf-8"),
        name: path.basename(filePath),
      });
    })
  });

  createWindow().then((w) => {
    w.webContents.send("open-file", process.argv.slice(2));
    currentWindow = w
  })
})
