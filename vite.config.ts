import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset URLs so the built bundle works when served from
  // file:///android_asset/www/index.html inside the Android WebView.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
