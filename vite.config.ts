/** @type {import('vite').UserConfig} */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "electron/main.ts",
        preload: "electron/preload.ts",
        renderer: "src/main.ts",
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      }
    }
  },
  plugins: [
    vue(),
  ]
})
