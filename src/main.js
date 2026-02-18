import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import './styles/main.css'

import { popularDadosDemo } from './services/db'
import { supabase } from './services/supabase'
import { isDebugEnabled, setupDebugHooks } from './debug'
import { useDiagnosticsStore } from './stores/diagnostics'
import { useAuthStore } from './stores/auth'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#60A5FA',
          secondary: '#001F3F',
          accent: '#7DD3FC',
          success: '#4ADE80',
          warning: '#FCD34D',
          error: '#F87171',
          background: '#0a0e27',
          surface: '#111827',
          info: '#38BDF8'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none; letter-spacing: normal;'
    },
    VCard: {
      elevation: 0
    }
  }
})

const pinia = createPinia()
const app = createApp(App)

app.use(vuetify)
app.use(pinia)
app.use(router)

const diagnosticsStore = useDiagnosticsStore(pinia)
const authStore = useAuthStore(pinia)

popularDadosDemo()

setupDebugHooks({
  router,
  pinia,
  authStore,
  diagnosticsStore
})

if (isDebugEnabled() && typeof window !== 'undefined') {
  window.supabase = supabase
  window.supabaseClient = supabase
  window.__MEDLUX_DEBUG__ = {
    buildSha:
      import.meta.env.VITE_COMMIT_SHA ||
      import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
      import.meta.env.VERCEL_GIT_COMMIT_SHA ||
      null,
    env: {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD
    },
    timestamp: new Date().toISOString()
  }
}

app.mount('#app')
