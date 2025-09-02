import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Copy weights to public directory so they're available via HTTP
const copyWeights = () => {
  const srcWeights = join(__dirname, 'weights', 'det_500m.onnx')
  const destDir = join(__dirname, 'public', 'weights')
  const destWeights = join(destDir, 'det_500m.onnx')
  
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true })
  }
  
  if (existsSync(srcWeights)) {
    copyFileSync(srcWeights, destWeights)
    console.log('✅ Copied ONNX model to public/weights/')
  } else {
    console.warn('⚠️ ONNX model not found at:', srcWeights)
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-weights',
      buildStart() {
        copyWeights()
      },
      configureServer() {
        copyWeights()
      }
    }
  ],
  build: {
    outDir: "dist-react"
  },
  server: {
    port: 5123,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  }
 })