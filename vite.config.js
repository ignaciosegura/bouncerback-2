import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build also loads from the Capacitor WebView
  base: './',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // PixiJS in its own chunk keeps the main bundle under the 500 kB warning
          groups: [{ name: 'pixi', test: /node_modules[\\/](pixi\.js|@pixi)[\\/]/ }]
        }
      }
    }
  }
})
