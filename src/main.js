import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Estilos globais
import './styles/main.css'

// Banco de dados
import { popularDadosDemo } from './services/db'
import { useDiagnosticsStore } from './stores/diagnostics'

// Configurar Vuetify com tema dark
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#60A5FA',      // Azul claro para melhor contraste
          secondary: '#001F3F',
          accent: '#7DD3FC',       // Cyan mais claro
          success: '#4ADE80',      // Verde mais claro
          warning: '#FCD34D',      // Amarelo mais claro
          error: '#F87171',        // Vermelho mais claro
          background: '#0a0e27',
          surface: '#111827',
          info: '#38BDF8',         // Azul info claro
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

// Criar app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)


const diagnosticsStore = useDiagnosticsStore(pinia)

window.addEventListener('error', (event) => {
  diagnosticsStore.captureGlobalError(event.error || new Error(event.message), {
    source: event.filename,
    line: event.lineno,
    column: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  diagnosticsStore.captureUnhandledRejection(event.reason, { source: 'window.unhandledrejection' })
})

// Popular dados demo ao iniciar
popularDadosDemo()

app.mount('#app')
