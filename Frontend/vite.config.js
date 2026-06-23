import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Polyfill global for libraries that expect Node.js globals (e.g. @react-pdf/renderer)
    global: 'globalThis',
  },
  resolve: {
    caseSensitive: false,
    alias: {
      // Polyfill buffer for browser usage
      buffer: 'buffer/',
    },
  },
  server: {
    host: '127.0.0.1',
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws',
    },
    fs: {
      strict: false
    }
  }
})
