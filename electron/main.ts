const fs = require("node:fs")
const path = require("node:path")
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const { program } = require ("commander")

// second-instance イベント時につくオプションを parse できるようにしておく
program
  .option("--allow-file-access-from-files")
  .option("--enable-avfoundation")

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

function parseArguments(args: string[]) {
  program.parse(args, {from: "user"})
  const binary = args[0];
  return path.basename(binary) === "Electron" ? program.args.slice(2) : program.args.slice(1)
}

let currentWindow: any = null;
let initialOpenFiles: string[] = [];

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on("open-file", (event: Event, path: string) => {
  event.preventDefault();
  if (currentWindow) {
    currentWindow.webContents.send("open-file", [path]);
  } else {
    initialOpenFiles.push(path);
  }
})

app.whenReady().then(() => {
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on('second-instance', (_e: any, argv: any) => {
    if (currentWindow.isMinimized()) currentWindow.restore();
    currentWindow.focus();

    // レンダラープロセスへファイルパスを送信
    currentWindow.webContents.send("log", "second-instance", argv);
    currentWindow.webContents.send('open-file', parseArguments(argv));
  });


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
    w.webContents.send("log", "launched", process.argv);
    w.webContents.send("open-file", parseArguments(process.argv));

    for (const file of initialOpenFiles) {
      w.webContents.send("open-file", [file]);
    }
    currentWindow = w
  })
})
