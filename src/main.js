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
import { useAuthStore } from './stores/auth'
import { supabase, hasSupabaseEnv, maskSupabaseKey, supabaseAnonKey, supabaseUrl } from './services/supabase'
import { generateDiagnosticDump, isDebugEnabled, setupDebugHooks } from './debug'

const capturedBootstrapErrors = []
const MEDLUX_DEBUG_KEY = 'MEDLUX_DEBUG'

const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const queryEnabled = params.get('debug') === '1'
  const storageEnabled = window.localStorage?.getItem(MEDLUX_DEBUG_KEY) === '1'
  return import.meta.env.DEV || queryEnabled || storageEnabled
}

const getBuildSha = () =>
  import.meta.env.VITE_COMMIT_SHA ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
  import.meta.env.VITE_COMMIT_HASH ||
  import.meta.env.VITE_APP_VERSION ||
  'indisponível'

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const normalizeError = (errorLike) => {
  if (!errorLike) {
    return { message: 'Erro desconhecido', stack: null, name: 'UnknownError' }
  }

  if (errorLike instanceof Error) {
    return {
      message: errorLike.message || 'Erro sem mensagem',
      stack: errorLike.stack || null,
      name: errorLike.name || 'Error'
    }
  }

  return {
    message: typeof errorLike === 'string' ? errorLike : JSON.stringify(errorLike),
    stack: null,
    name: typeof errorLike
  }
}

const pushBootstrapError = (errorLike, context = {}) => {
  const normalized = normalizeError(errorLike)
  capturedBootstrapErrors.unshift({
    timestamp: new Date().toISOString(),
    context,
    ...normalized
  })
  if (capturedBootstrapErrors.length > 20) {
    capturedBootstrapErrors.length = 20
  }
}

const getAppVersion = () => getBuildSha()

const buildDiagnosticPayload = async () => {
  const basePayload = {
    generatedAt: new Date().toISOString(),
    appVersion: getAppVersion(),
    url: typeof window !== 'undefined' ? window.location.href : 'indisponível',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'indisponível',
    runtime: {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      debugEnabled: isDebugEnabled()
    },
    env: {
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || null,
      VITE_SUPABASE_URL: supabaseUrl || null,
      VITE_SUPABASE_ANON_KEY: maskSupabaseKey(supabaseAnonKey),
      hasSupabaseEnv
    },
    supabase: {
      clientCreated: Boolean(supabase),
      hasAuthApi: Boolean(supabase?.auth),
      url: supabaseUrl || null
    },
    bootstrapErrors: capturedBootstrapErrors
  }

  if (!isDebugEnabled()) return basePayload

  try {
    const debugPayload = await generateDiagnosticDump()
    return { ...basePayload, debug: debugPayload }
  } catch (error) {
    pushBootstrapError(error, { source: 'generateDiagnosticDump' })
    return { ...basePayload, debug: { error: error?.message || 'Falha ao gerar diagnóstico debug.' } }
  }
}

const downloadDiagnosticFile = (payload) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '_')
  const filename = `diagnostico_${stamp}.json`
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(href)
  return json
}

const copyDiagnosticToClipboard = async (json) => {
  if (!navigator?.clipboard?.writeText) {
    return { copied: false, reason: 'clipboard indisponível' }
  }

  try {
    await navigator.clipboard.writeText(json)
    return { copied: true }
  } catch (error) {
    pushBootstrapError(error, { source: 'clipboard.writeText' })
    return { copied: false, reason: 'falha ao copiar para clipboard' }
  }
}

const attachDiagnosticButtonHandler = () => {
  const button = document.getElementById('diagnostic-btn')
  const result = document.getElementById('diagnostic-result')

  if (!button) return

  button.addEventListener('click', async () => {
    const payload = await buildDiagnosticPayload()
    const json = downloadDiagnosticFile(payload)
    const clipboard = await copyDiagnosticToClipboard(json)

    if (result) {
      result.textContent = clipboard.copied
        ? 'Diagnóstico baixado e copiado para a área de transferência.'
        : `Diagnóstico baixado (${clipboard.reason || 'não foi possível copiar'}).`
    }
  })
}

const renderFatalOverlay = (errorLike) => {
  const root = document.getElementById('app')
  if (!root) return

  const normalized = normalizeError(errorLike)
  const message = escapeHtml(normalized.message)
  const stack = escapeHtml(normalized.stack || 'Stack indisponível')

  root.innerHTML = `
    <section style="font-family: Inter, Arial, sans-serif; min-height: 100vh; background: #040714; color: #e5e7eb; padding: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="width: min(960px, 100%); background: rgba(17,24,39,0.92); border: 1px solid rgba(248,113,113,0.4); border-radius: 12px; padding: 20px; box-shadow: 0 18px 60px rgba(0,0,0,0.45);">
        <h1 style="margin: 0 0 10px; color: #fecaca; font-size: 24px;">Falha ao iniciar</h1>
        <p style="margin: 0 0 16px; color: #d1d5db;">A aplicação encontrou um erro crítico durante o bootstrap.</p>
        <pre style="white-space: pre-wrap; overflow: auto; max-height: 45vh; margin: 0 0 16px; padding: 14px; border-radius: 8px; background: #0f172a; border: 1px solid rgba(148,163,184,0.35);"><strong>${message}</strong>\n\n${stack}</pre>
        <button id="diagnostic-btn" type="button" style="background: #2563eb; color: #fff; border: 0; border-radius: 8px; padding: 10px 14px; font-weight: 600; cursor: pointer;">Gerar Diagnóstico Completo</button>
        <p id="diagnostic-result" style="margin-top: 10px; color: #93c5fd;"></p>
      </div>
    </section>
  `

  attachDiagnosticButtonHandler()
}

const registerGlobalErrorHandlers = (diagnosticsStore) => {
  window.onerror = (message, source, line, column, error) => {
    const normalized = error || new Error(String(message || 'Erro global sem mensagem'))
    pushBootstrapError(normalized, { source, line, column, type: 'window.onerror' })
    diagnosticsStore?.captureGlobalError(normalized, { source, line, column })
    return false
  }

  window.onunhandledrejection = (event) => {
    const reason = event?.reason instanceof Error ? event.reason : new Error(String(event?.reason || 'Promise rejection sem detalhe'))
    pushBootstrapError(reason, { type: 'window.onunhandledrejection' })
    diagnosticsStore?.captureUnhandledRejection(reason, { source: 'window.unhandledrejection' })
  }
}

const registerFetchFailureInterceptor = (diagnosticsStore) => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return

  const originalFetch = window.fetch.bind(window)
  if (window.__MEDLUX_FETCH_INTERCEPTED__) return

  window.fetch = async (...args) => {
    const [resource, config] = args
    const url = typeof resource === 'string' ? resource : resource?.url || 'unknown'
    const method = config?.method || (typeof resource !== 'string' ? resource?.method : null) || 'GET'

    try {
      const response = await originalFetch(...args)
      if (!response.ok) {
        diagnosticsStore?.pushRequest({
          type: 'fetch',
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          failed: true
        })
      }
      return response
    } catch (error) {
      diagnosticsStore?.pushRequest({
        type: 'fetch',
        url,
        method,
        status: null,
        statusText: 'network_error',
        failed: true,
        error: normalizeError(error)
      })
      throw error
    }
  }

  window.__MEDLUX_FETCH_INTERCEPTED__ = true
}

const initApp = () => {
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

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(vuetify)

  const diagnosticsStore = useDiagnosticsStore(pinia)
  const authStore = useAuthStore(pinia)
  registerGlobalErrorHandlers(diagnosticsStore)
  registerFetchFailureInterceptor(diagnosticsStore)

  app.config.errorHandler = (error, instance, info) => {
    diagnosticsStore.pushEvent({
      type: 'vue-error',
      message: error?.message || `Erro Vue: ${info}`,
      stack: error?.stack || null,
      component: instance?.type?.name || instance?.type?.__name || 'Componente desconhecido',
      route: router.currentRoute.value?.fullPath || null,
      info,
      error
    })
    console.error('[vue:errorHandler]', error, info)
  }

  // Popular dados demo ao iniciar
  popularDadosDemo()

  app.mount('#app')

setupDebugHooks({
  router,
  pinia,
  authStore,
  diagnosticsStore
})

if (isDebugEnabled()) {
  const runtimeMeta = {
    buildSha: getBuildSha(),
    env: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  }

  window.supabase = supabase
  window.supabaseClient = supabase
  window.__MEDLUX_DEBUG__ = runtimeMeta

  console.log('[MEDLUX DIAG] Debug runtime habilitado', runtimeMeta)
}


  return app
}

try {
  initApp()
} catch (error) {
  pushBootstrapError(error, { type: 'bootstrap' })
  console.error('[bootstrap] Falha ao inicializar aplicação', error)
  renderFatalOverlay(error)
}
