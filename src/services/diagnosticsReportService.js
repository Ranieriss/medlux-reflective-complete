import { db } from './db'
import { supabase, supabaseAnonKey, supabaseUrl } from './supabase'
import { maskSupabaseKey } from '@/config/env'

const getBuildSha = () =>
  import.meta.env.VITE_COMMIT_SHA ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
  import.meta.env.VITE_COMMIT_HASH ||
  import.meta.env.VITE_APP_VERSION ||
  'indisponível'

const getProjectRef = (url) => {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace('.supabase.co', '')
  } catch {
    return null
  }
}

const getIndexedDbSummary = async () => {
  try {
    await db.open()

    const tables = await Promise.all(
      db.tables.map(async (table) => ({
        table: table.name,
        count: await table.count()
      }))
    )

    const totalRecords = tables.reduce((acc, item) => acc + item.count, 0)

    return {
      status: 'ok',
      dbName: db.name,
      totalRecords,
      tables
    }
  } catch (error) {
    return {
      status: 'error',
      message: error?.message || String(error)
    }
  }
}

export const buildCompleteDiagnostics = async ({ diagnosticsStore, route = null } = {}) => {
  const now = new Date().toISOString()
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : null

  let sessionResult = null
  let userResult = null

  try {
    const { data, error } = await supabase.auth.getSession()
    sessionResult = {
      ok: !error,
      error: error
        ? {
            message: error.message,
            code: error.code || null,
            status: error.status || null
          }
        : null,
      session: data?.session || null
    }

    userResult = data?.session?.user
      ? {
          id: data.session.user.id || null,
          email: data.session.user.email || null
        }
      : null
  } catch (error) {
    sessionResult = {
      ok: false,
      error: {
        message: error?.message || String(error),
        code: error?.code || null,
        status: error?.status || null
      },
      session: null
    }
  }

  const indexedDb = await getIndexedDbSummary()
  const failedRequests = (diagnosticsStore?.requests || [])
    .filter((item) => item?.failed)
    .slice(0, 50)

  const errors = (diagnosticsStore?.events || []).slice(0, 50)

  const payload = {
    generatedAt: now,
    app: {
      version: import.meta.env.VITE_APP_VERSION || null,
      commit: getBuildSha(),
      mode: import.meta.env.MODE,
      env: import.meta.env.PROD ? 'production' : 'development'
    },
    runtime: {
      url: typeof window !== 'undefined' ? window.location.href : null,
      route: route || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      online: isOnline
    },
    indexedDb,
    supabase: {
      url: supabaseUrl || null,
      project: getProjectRef(supabaseUrl),
      anonKeyMasked: maskSupabaseKey(supabaseAnonKey),
      anonKeyPrefix: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 12)}...` : null
    },
    session: sessionResult,
    user: userResult,
    errors,
    failedRequests
  }

  return payload
}

export const exportDiagnosticsPayload = async ({ diagnosticsStore, route = null, logToConsole = false } = {}) => {
  const payload = await buildCompleteDiagnostics({ diagnosticsStore, route })
  const json = JSON.stringify(payload, null, 2)

  if (logToConsole) {
    console.log('[MEDLUX DIAG] Diagnóstico completo', payload)
  }

  return { payload, json }
}
