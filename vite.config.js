import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    fs: {
      strict: false,
    },
    // Enable history API fallback for dev server
    historyApiFallback: true,
  },
  preview: {
    // Enable history API fallback for preview server
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      // Handle SPA routing for production
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  plugins: [
    react(),
    tailwindcss()
  ],
})
