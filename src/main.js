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
    defaultTheme: 'premiumDark',
    themes: {
      premiumDark: {
        dark: true,
        colors: {
          primary: '#FBBF24',
          secondary: '#FDE68A',
          background: '#070B1A',
          surface: '#0B122A',
          'surface-variant': '#0F1B3D',
          'on-background': '#F8FAFC',
          'on-surface': '#F8FAFC',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#F87171',
          info: '#22D3EE',
          accent: '#FDE047'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      height: 40,
      variant: 'flat',
      style: 'text-transform: none; letter-spacing: 0; font-weight: 700;'
    },
    VCard: {
      elevation: 0,
      rounded: 'xl'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
    },
    VDataTable: {
      density: 'comfortable'
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
