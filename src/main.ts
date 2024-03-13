import { createApp } from 'vue'
import type { App } from 'vue'
import AppComponent from "./components/App.vue";

let app: App<any>|null = null;
let fileA: string|null = null;
let fileB: string|null = null;

window.ipc.onOpenFile((files: string[]) => {
  console.log(files)
  if (app) app.unmount();

  if (files.length > 1) {
    fileA = files[0]
    fileB = files[1]
  } else {
    if (fileA && fileB === null) {
      fileB = files[0] || null;
    } else {
      fileA = files[0] || null;
      fileB = null;
    }
  }
  console.log("createApp", fileA, fileB)

  app = createApp(AppComponent, {defaultFilePathA: fileA, defaultFilePathB: fileB})
  app.mount('#app')
})
