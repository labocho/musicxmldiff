import { createApp } from 'vue'
import App from "./components/App.vue";

window.ipc.argv().then((argv) => {
  createApp(App, {defaultFilePathA: argv[0] || null, defaultFilePathB: argv[1] || null}).mount('#app')
})

