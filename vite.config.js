import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: {
        labs: false,
      },
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
