import { createApp } from 'vue'
import App from "./components/App.vue";

window.ipc.argv().then((argv) => {
  // createApp(App, {defaultFilePathA: argv[0] || null, defaultFilePathB: argv[1] || null}).mount('#app').$nextTick(() => {
  createApp(App, {defaultFilePathA: null, defaultFilePathB: null}).mount('#app').$nextTick(() => {
    // Remove Preload scripts loading
    postMessage({ payload: 'removeLoading' }, '*')

    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      console.log(message)
    })
  })
})

