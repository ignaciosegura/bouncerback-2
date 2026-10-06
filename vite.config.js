import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build also loads from the Capacitor WebView
  base: './',
  build: {
    // PixiJS's chunk is just over Vite's default 500 kB since the CRT effect (meshes, shaders)
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      // lottie-web runs the animation's expressions (loopOut) through eval by design
      onLog (level, log, handler) {
        if (log.code === 'EVAL' && log.id?.includes('lottie-web')) return
        handler(level, log)
      },
      output: {
        codeSplitting: {
          // PixiJS and lottie-web in their own chunks keep each chunk under the size warning
          groups: [
            { name: 'pixi', test: /node_modules[\\/](pixi\.js|@pixi)[\\/]/ },
            { name: 'lottie', test: /node_modules[\\/]lottie-web[\\/]/ }
          ]
        }
      }
    }
  }
})
