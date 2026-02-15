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
          primary: '#0074D9',
          secondary: '#001F3F',
          accent: '#39CCCC',
          success: '#2ECC40',
          warning: '#FFDC00',
          error: '#FF4136',
          background: '#0a0e27',
          surface: '#111827',
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

// Popular dados demo ao iniciar
popularDadosDemo()

app.mount('#app')
