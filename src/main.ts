import { createApp } from 'vue'
import type { App } from 'vue'
import AppComponent from "./components/App.vue";

let app: App<any>|null = null;
window.ipc.onOpenFile((argv: string[]) => {
  if (app) app.unmount();
  console.log(argv)
  app = createApp(AppComponent, {defaultFilePathA: argv[0] || null, defaultFilePathB: argv[1] || null})
  app.mount('#app')
})
