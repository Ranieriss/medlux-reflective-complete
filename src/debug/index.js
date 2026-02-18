import { hasSupabaseEnv, supabase, supabaseUrl } from '@/services/supabase'

const MAX_NETWORK_ITEMS = 50
const MAX_ERROR_ITEMS = 50
const MAX_LOG_ITEMS = 200
const MAX_STORAGE_ITEMS = 200

const debugState = {
  enabled: false,
  initialized: false,
  appVersion: null,
  buildTime: null,
  env: null,
  routes: [],
  stores: [],
  errors: [],
  logs: [],
  network: [],
  storageOps: [],
  rlsHints: []
}

let originalFetch = null
let originalXhrOpen = null
let originalXhrSend = null
let originalConsole = null

const toIso = () => new Date().toISOString()

const maskValue = (value) => {
  if (value === null || value === undefined) return value
  const text = String(value)
  if (text.length <= 8) return '***'
  return `${text.slice(0, 4)}***${text.slice(-4)}`
}

const cloneSafe = (value, depth = 0) => {
  if (depth > 4) return '[max-depth]'
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map((item) => cloneSafe(item, depth + 1))
  if (typeof value === 'object') {
    const result = {}
    for (const [key, item] of Object.entries(value)) {
      result[key] = sanitizeByKey(key, item, depth + 1)
    }
    return result
  }
  if (typeof value === 'string' && value.length > 3000) return `${value.slice(0, 3000)}…`
  return value
}

const sanitizeByKey = (key, value, depth = 0) => {
  const lower = String(key || '').toLowerCase()
  if (['authorization', 'token', 'access_token', 'refresh_token', 'apikey', 'api_key', 'jwt', 'password', 'secret', 'anon_key'].some((term) => lower.includes(term))) {
    return value ? maskValue(value) : value
  }
  return cloneSafe(value, depth)
}

const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return url
  try {
    const parsed = new URL(url, window.location.origin)
    const keysToMask = ['token', 'access_token', 'refresh_token', 'apikey', 'api_key', 'jwt', 'authorization']
    keysToMask.forEach((key) => {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, maskValue(parsed.searchParams.get(key)))
      }
    })
    return parsed.toString()
  } catch {
    return url
  }
}

const pushWithLimit = (list, item, max) => {
  list.unshift(item)
  if (list.length > max) list.length = max
}

const parseHeaders = (headersInit) => {
  const result = {}
  if (!headersInit) return result

  try {
    if (headersInit instanceof Headers) {
      headersInit.forEach((value, key) => {
        result[key] = sanitizeByKey(key, value)
      })
      return result
    }

    if (Array.isArray(headersInit)) {
      headersInit.forEach(([key, value]) => {
        result[key] = sanitizeByKey(key, value)
      })
      return result
    }

    Object.entries(headersInit).forEach(([key, value]) => {
      result[key] = sanitizeByKey(key, value)
    })
  } catch {
    return {}
  }

  return result
}

const recordRlsHint = (errorLike, origin = 'unknown') => {
  if (!errorLike) return
  const status = errorLike.status || errorLike?.response?.status || null
  const code = errorLike.code || null
  const message = errorLike.message || String(errorLike)
  const details = errorLike.details || errorLike.error_description || null

  const isPostgrest = code?.startsWith?.('PGRST') || status === 401 || status === 403 || status === 406 || message.toLowerCase().includes('rls')
  if (!isPostgrest) return

  pushWithLimit(
    debugState.rlsHints,
    {
      timestamp: toIso(),
      origin,
      status,
      code,
      message,
      details: sanitizeByKey('details', details)
    },
    MAX_ERROR_ITEMS
  )
}

const interceptConsole = () => {
  if (originalConsole || typeof window === 'undefined') return

  originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  }

  ;['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
    console[level] = (...args) => {
      const payload = {
        timestamp: toIso(),
        level,
        args: cloneSafe(args)
      }
      pushWithLimit(debugState.logs, payload, MAX_LOG_ITEMS)

      if (level === 'error') {
        const errorArg = args.find((item) => item instanceof Error) || args[0]
        pushWithLimit(
          debugState.errors,
          {
            timestamp: toIso(),
            message: errorArg?.message || String(errorArg || 'console.error sem detalhes'),
            stack: errorArg?.stack || null,
            name: errorArg?.name || 'ConsoleError'
          },
          MAX_ERROR_ITEMS
        )
        recordRlsHint(errorArg, 'console.error')
      }

      originalConsole[level](...args)
    }
  })
}

const interceptStorage = () => {
  if (typeof Storage === 'undefined') return
  const methods = ['setItem', 'getItem', 'removeItem', 'clear']

  methods.forEach((method) => {
    const original = Storage.prototype[method]
    if (typeof original !== 'function') return

    Storage.prototype[method] = function storageProxy(...args) {
      try {
        const key = args[0]
        const value = args[1]
        pushWithLimit(
          debugState.storageOps,
          {
            timestamp: toIso(),
            storage: this === localStorage ? 'localStorage' : 'sessionStorage',
            method,
            key,
            value: sanitizeByKey(key, value)
          },
          MAX_STORAGE_ITEMS
        )
      } catch {
        // noop
      }
      return original.apply(this, args)
    }
  })
}

const interceptFetch = () => {
  if (typeof window === 'undefined' || originalFetch) return

  originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init = {}) => {
    const startedAt = performance.now()
    const requestUrl = typeof input === 'string' ? input : input?.url
    const method = init.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET'

    try {
      const response = await originalFetch(input, init)
      const elapsedMs = Math.round(performance.now() - startedAt)

      pushWithLimit(
        debugState.network,
        {
          timestamp: toIso(),
          type: 'fetch',
          request: {
            url: sanitizeUrl(requestUrl),
            method,
            headers: parseHeaders(init.headers || (typeof input !== 'string' ? input?.headers : null))
          },
          response: {
            status: response.status,
            ok: response.ok,
            headers: parseHeaders(response.headers)
          },
          durationMs: elapsedMs
        },
        MAX_NETWORK_ITEMS
      )

      return response
    } catch (error) {
      const elapsedMs = Math.round(performance.now() - startedAt)

      pushWithLimit(
        debugState.network,
        {
          timestamp: toIso(),
          type: 'fetch',
          request: {
            url: sanitizeUrl(requestUrl),
            method,
            headers: parseHeaders(init.headers || (typeof input !== 'string' ? input?.headers : null))
          },
          error: {
            message: error?.message || String(error),
            name: error?.name || 'FetchError'
          },
          durationMs: elapsedMs
        },
        MAX_NETWORK_ITEMS
      )
      recordRlsHint(error, 'fetch')
      throw error
    }
  }
}

const interceptXhr = () => {
  if (typeof XMLHttpRequest === 'undefined' || originalXhrOpen) return

  originalXhrOpen = XMLHttpRequest.prototype.open
  originalXhrSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function openProxy(method, url, ...rest) {
    this.__medlux_debug = {
      method,
      url
    }
    return originalXhrOpen.call(this, method, url, ...rest)
  }

  XMLHttpRequest.prototype.send = function sendProxy(body) {
    const startedAt = performance.now()
    const context = this.__medlux_debug || {}

    this.addEventListener('loadend', () => {
      pushWithLimit(
        debugState.network,
        {
          timestamp: toIso(),
          type: 'xhr',
          request: {
            url: sanitizeUrl(context.url),
            method: context.method || 'GET'
          },
          response: {
            status: this.status,
            ok: this.status >= 200 && this.status < 400
          },
          durationMs: Math.round(performance.now() - startedAt)
        },
        MAX_NETWORK_ITEMS
      )
    })

    return originalXhrSend.call(this, body)
  }
}

const maskSupabaseUrl = (value) => {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return `${parsed.origin}/***`
  } catch {
    return maskValue(value)
  }
}

const getRuntimeInfo = () => ({
  userAgent: navigator?.userAgent || 'indisponível',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'indisponível',
  locale: navigator?.language || 'indisponível',
  online: navigator?.onLine ?? null,
  screen: {
    width: window?.screen?.width || null,
    height: window?.screen?.height || null,
    pixelRatio: window?.devicePixelRatio || 1
  },
  memory: performance?.memory
    ? {
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize
      }
    : null
})

const runSupabaseChecks = async ({ session } = {}) => {
  const checks = {
    db: [],
    storage: []
  }

  if (!hasSupabaseEnv) {
    checks.db.push({ table: 'supabase-env', ok: false, error: { message: 'Variáveis do Supabase não configuradas.' } })
    checks.storage.push({ action: 'supabase-env', ok: false, error: { message: 'Variáveis do Supabase não configuradas.' } })
    return checks
  }

  if (!session) {
    checks.db.push({ action: 'skipped', ok: true, reason: 'not_logged_in' })
    checks.storage.push({ action: 'skipped', ok: true, reason: 'not_logged_in' })
    return checks
  }

  const tables = ['usuarios', 'equipamentos', 'criterios_retrorrefletancia']

  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('id', { count: 'exact' }).limit(1)
      if (error) {
        recordRlsHint(error, `db:${table}`)
        checks.db.push({ table, ok: false, status: status || error?.status || null, error: sanitizeByKey('error', error) })
      } else {
        checks.db.push({ table, ok: true, status: status || 200, rows: data?.length || 0 })
      }
    } catch (error) {
      recordRlsHint(error, `db:${table}:catch`)
      checks.db.push({ table, ok: false, error: sanitizeByKey('error', error) })
    }
  }

  const bucket = supabase.storage.from('medicoes')

  try {
    const { data, error } = await bucket.list('debug', { limit: 1 })
    if (error) {
      recordRlsHint(error, 'storage:list')
      checks.storage.push({
        action: 'list',
        bucket: 'medicoes',
        path: 'debug',
        ok: false,
        status: error?.status || null,
        message: error?.message || null,
        error: sanitizeByKey('error', error)
      })
    } else {
      checks.storage.push({
        action: 'list',
        bucket: 'medicoes',
        path: 'debug',
        ok: true,
        status: 200,
        entries: data?.length || 0,
        message: 'list_ok'
      })
    }
  } catch (error) {
    recordRlsHint(error, 'storage:list:catch')
    checks.storage.push({
      action: 'list',
      bucket: 'medicoes',
      path: 'debug',
      ok: false,
      status: error?.status || null,
      message: error?.message || String(error),
      error: sanitizeByKey('error', error)
    })
  }

  try {
    const { data, error } = await bucket.createSignedUploadUrl('debug/dummy.txt')
    if (error) {
      recordRlsHint(error, 'storage:signed-upload-url')
      checks.storage.push({
        action: 'signedUploadUrlDummy',
        bucket: 'medicoes',
        ok: false,
        status: error?.status || null,
        message: error?.message || null,
        error: sanitizeByKey('error', error),
        storageError: {
          status: error?.status || null,
          code: error?.code || null,
          body: error?.message || null
        }
      })
    } else {
      checks.storage.push({
        action: 'signedUploadUrlDummy',
        bucket: 'medicoes',
        ok: true,
        status: 200,
        hasSignedUrl: Boolean(data?.signedUrl),
        hasToken: Boolean(data?.token),
        signedUrlMasked: data?.signedUrl ? sanitizeUrl(data.signedUrl) : null,
        message: 'signed_upload_url_ok'
      })
    }
  } catch (error) {
    recordRlsHint(error, 'storage:signed-upload-url:catch')
    checks.storage.push({
      action: 'signedUploadUrlDummy',
      bucket: 'medicoes',
      ok: false,
      status: error?.status || null,
      message: error?.message || String(error),
      error: sanitizeByKey('error', error),
      storageError: {
        status: error?.status || null,
        code: error?.code || null,
        body: error?.message || String(error)
      }
    })
  }

  return checks
}

export const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const queryEnabled = params.get('debug') === '1'
  const storageEnabled = localStorage.getItem('MEDLUX_DEBUG') === '1'
  return queryEnabled || storageEnabled
}

const createAppWindowState = ({ router, authStore, diagnosticsStore }) => ({
  get version() {
    return debugState.appVersion
  },
  get env() {
    return debugState.env
  },
  get routes() {
    return debugState.routes
  },
  get stores() {
    return debugState.stores
  },
  get currentUser() {
    return sanitizeByKey('currentUser', authStore?.usuario)
  },
  get session() {
    return sanitizeByKey('session', authStore?.session)
  },
  get isAdmin() {
    return Boolean(authStore?.isAdmin)
  },
  get lastErrors() {
    return [...debugState.errors, ...(diagnosticsStore?.events || [])].slice(0, MAX_ERROR_ITEMS)
  },
  get lastNetwork() {
    return debugState.network.slice(0, MAX_NETWORK_ITEMS)
  },
  get lastStorageOps() {
    return debugState.storageOps.slice(0, MAX_STORAGE_ITEMS)
  }
})

export const generateDiagnosticDump = async ({ authStore, diagnosticsStore } = {}) => {
  let session = null
  let sessionError = null

  if (hasSupabaseEnv) {
    try {
      const sessionResponse = await supabase.auth.getSession()
      session = sessionResponse?.data?.session || null
      sessionError = sessionResponse?.error || null
    } catch (error) {
      sessionError = error
    }
  }

  if (sessionError) recordRlsHint(sessionError, 'auth:getSession')

  const checks = await runSupabaseChecks({ session })

  const authInfo = {
    loggedIn: Boolean(session),
    session: session
      ? {
          userId: session?.user?.id || null,
          exp: session?.expires_at || null,
          provider: session?.user?.app_metadata?.provider || null
        }
      : null,
    reason: session ? null : 'not_logged_in',
    currentUser: sanitizeByKey('currentUser', authStore?.usuario || null)
  }

  return {
    generatedAt: toIso(),
    build: {
      appVersion: debugState.appVersion || import.meta.env.VITE_APP_VERSION || 'indisponível',
      commitHash:
        import.meta.env.VITE_COMMIT_SHA ||
        import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
        import.meta.env.VERCEL_GIT_COMMIT_SHA ||
        'indisponível',
      buildTime: debugState.buildTime || import.meta.env.VITE_BUILD_TIME || null,
      viteMode: import.meta.env.MODE
    },
    runtime: getRuntimeInfo(),
    env: {
      mode: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      isDev: import.meta.env.DEV,
      baseURL: window.location.origin,
      VITE_SUPABASE_URL: maskSupabaseUrl(supabaseUrl)
    },
    auth: authInfo,
    db: checks.db,
    storage: {
      checks: checks.storage,
      error: checks.storage.find((item) => item?.storageError)?.storageError || null
    },
    rlsHints: debugState.rlsHints.slice(0, MAX_ERROR_ITEMS),
    logs: {
      internal: debugState.logs.slice(0, MAX_LOG_ITEMS),
      errors: [...debugState.errors, ...(diagnosticsStore?.events || [])].slice(0, MAX_ERROR_ITEMS)
    },
    network: debugState.network.slice(0, MAX_NETWORK_ITEMS),
    storageOps: debugState.storageOps.slice(0, MAX_STORAGE_ITEMS)
  }
}

export const setupDebugHooks = ({ router, pinia, authStore, diagnosticsStore }) => {
  debugState.enabled = isDebugEnabled()
  if (!debugState.enabled || debugState.initialized) return debugState.enabled

  localStorage.setItem('MEDLUX_DEBUG', '1')

  debugState.initialized = true
  debugState.appVersion = import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_COMMIT_SHA || 'indisponível'
  debugState.buildTime = import.meta.env.VITE_BUILD_TIME || toIso()
  debugState.env = {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    debugEnabled: true
  }
  debugState.routes = router
    ?.getRoutes?.()
    ?.map((route) => ({
      name: route.name || null,
      path: route.path,
      requiresAuth: Boolean(route.meta?.requiresAuth),
      requiresAdmin: Boolean(route.meta?.requiresAdmin)
    }))
  debugState.stores = Object.keys(pinia?.state?.value || {})

  interceptConsole()
  interceptFetch()
  interceptXhr()
  interceptStorage()

  window.supabase = supabase
  window.__app__ = createAppWindowState({ router, authStore, diagnosticsStore })
  window.__medlux_debug_dump = async () => generateDiagnosticDump({ authStore, diagnosticsStore })

  window.addEventListener('error', (event) => {
    const error = event?.error || new Error(String(event?.message || 'Erro desconhecido'))
    pushWithLimit(
      debugState.errors,
      {
        timestamp: toIso(),
        message: error.message,
        stack: error.stack || null,
        name: error.name || 'WindowError'
      },
      MAX_ERROR_ITEMS
    )
    recordRlsHint(error, 'window.error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    const error = event?.reason instanceof Error ? event.reason : new Error(String(event?.reason || 'Promise rejection sem detalhe'))
    pushWithLimit(
      debugState.errors,
      {
        timestamp: toIso(),
        message: error.message,
        stack: error.stack || null,
        name: error.name || 'UnhandledRejection'
      },
      MAX_ERROR_ITEMS
    )
    recordRlsHint(error, 'window.unhandledrejection')
  })

  console.info('🛠️ [MEDLUX DEBUG] modo diagnóstico ativado', {
    queryDebug: new URLSearchParams(window.location.search).get('debug') === '1',
    localStorageDebug: localStorage.getItem('MEDLUX_DEBUG') === '1'
  })
  console.info('🛠️ [MEDLUX DEBUG] hooks disponíveis: window.supabase, window.__app__, window.__medlux_debug_dump()')

  return true
}
