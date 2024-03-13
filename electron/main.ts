const fs = require("node:fs")
const path = require("node:path")
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const { program } = require("commander")

import type { BrowserWindow as BrowserWindowType } from "electron"

// second-instance イベント時につくオプションを parse できるようにしておく
program
  .option("--allow-file-access-from-files")
  .option("--enable-avfoundation")

// シングルインスタンスの強制
const gotTheLock: boolean = app.requestSingleInstanceLock();
if (!gotTheLock) app.exit();

let windows: {fileA: string|null, fileB: string|null, window: BrowserWindowType}[] = [];
let initialOpenFiles: string[] = [];
let appReady = false

async function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })


  await win.loadFile(path.join(__dirname, 'index.html'))
  return win
}

function openFile(files: string[]) {
  if (files.length === 0) {
    return
  } else if (files.length > 1) {
    const fileA = files[0]
    const fileB = files[1]
    const w = windows.find((w) => w.fileA === null && w.fileB === null)
    if (w === undefined) {
      createWindow().then((newWindow) => {
        newWindow.webContents.send("open-file", [fileA, fileB]);
        windows.push({fileA, fileB, window: newWindow})
        console.log(windows)
      })
    } else {
      w.fileA = fileA
      w.fileB = fileB
      w.window.webContents.send("open-file", [fileA, fileB]);
      if (w.window.isMinimized()) w.window.restore();
      w.window.focus();
      console.log(windows)
    }
    return
  } else {
    const file = files[0]
    const w = windows.find((w) => w.fileA === null || w.fileB === null)
    if (w === undefined) {
      createWindow().then((newWindow) => {
        newWindow.webContents.send("open-file", [file]);
        windows.push({fileA: file, fileB: null, window: newWindow})
        console.log(windows)
      })
    } else {
      w.fileA === null ? (w.fileA = file) : (w.fileB = file)
      w.window.webContents.send("open-file", [file]);
      if (w.window.isMinimized()) w.window.restore();
      w.window.focus();
      console.log(windows)
    }
  }
}

function parseArguments(args: string[]) {
  program.parse(args, {from: "user"})
  const binary = args[0];
  return path.basename(binary) === "Electron" ? program.args.slice(2) : program.args.slice(1)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

/* @ts-ignore */
app.on("open-file", (event: Event, path: string) => {
  event.preventDefault();
  if (appReady) {
    openFile([path])
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
    openFile(parseArguments(argv))
  });

  ipcMain.handle("openFileDialog", async (event: any) => {
    const w = windows.find((e) => e.window.webContents.id === event.sender.id);
    const { canceled, filePaths } = await dialog.showOpenDialog(w!.window, {properties: ['openFile']})
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

  // w.webContents.send("log", "launched", process.argv);
  openFile(parseArguments(process.argv))
  openFile(initialOpenFiles);

  if (windows.length === 0) {
    createWindow().then((newWindow) => {
      newWindow.webContents.send("open-file", []);
      windows.push({fileA: null, fileB: null, window: newWindow})
      console.log(windows)
    })
  }

  appReady = true
})
