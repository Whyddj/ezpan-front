import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 1024,
    hmr: true,
    proxy: {
      "/api": {
        target: "http://localhost:8070",
        changeOrigin: true,
        // pathRewrite: {
        //   "^/api": "/api"
        // }
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
