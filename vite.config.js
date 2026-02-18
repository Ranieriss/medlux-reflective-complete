import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      },
      sass: {
        api: 'modern-compiler'
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf'
          }

          if (id.includes('html2canvas')) {
            return 'canvas'
          }

          if (id.includes('date-fns')) {
            return 'date'
          }

          if (id.includes('@mdi/font') || id.includes('materialdesignicons')) {
            return 'icons'
          }
          if (id.includes('vuetify/lib/components')) {
            return 'vuetify-components'
          }

          if (id.includes('vuetify/lib/directives') || id.includes('vuetify/lib/labs')) {
            return 'vuetify-labs'
          }

          if (id.includes('vuetify')) {
            return 'vuetify'
          }

          if (id.includes('@supabase') || id.includes('dexie')) {
            return 'data'
          }

          if (id.includes('xlsx') || id.includes('file-saver')) {
            return 'export'
          }

          if (id.includes('chart.js') || id.includes('vue-chartjs') || id.includes('qrcode')) {
            return 'charts'
          }

          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vendor'
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    hmr: {
      protocol: 'wss',
      host: '3000-ie4tc4um27gylss7lvwlv-d0b9e1e2.sandbox.novita.ai',
      clientPort: 443
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  }
})
