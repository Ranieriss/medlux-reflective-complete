const getClientEnv = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {}
  }

  return import.meta.env
}

const env = getClientEnv()

export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || ''
const anonKeyFromEnv = env.VITE_SUPABASE_ANON_KEY?.trim() || ''

export const supabaseKeySource = anonKeyFromEnv ? 'VITE_SUPABASE_ANON_KEY' : ''

export const supabaseAnonKey = anonKeyFromEnv

const isValidSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
const looksLikeProjectRef = /^prj_/i.test(supabaseAnonKey)
const isLikelyJwt = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(supabaseAnonKey)
const isPublishableKey = /^sb_publishable_/i.test(supabaseAnonKey)
const isServiceRoleKey = /service_role/i.test(supabaseAnonKey)
const hasAnySupabaseKey = !!anonKeyFromEnv

export const missingSupabaseEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !hasAnySupabaseKey ? 'VITE_SUPABASE_ANON_KEY' : null
].filter(Boolean)

export const invalidSupabaseEnvVars = [
  supabaseUrl && !isValidSupabaseUrl ? 'VITE_SUPABASE_URL (esperado formato https://<project-ref>.supabase.co)' : null,
  looksLikeProjectRef ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (valor prj_... não é chave pública válida)` : null,
  isPublishableKey
    ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (sb_publishable_ detectada; use a anon/public key JWT que começa com eyJ...)`
    : null,
  isServiceRoleKey
    ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (service_role não pode ser usada no frontend)`
    : null,
  supabaseAnonKey && !looksLikeProjectRef && !isLikelyJwt && !isPublishableKey && !isServiceRoleKey
    ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (esperado JWT anon/public com formato header.payload.signature)`
    : null
].filter(Boolean)

export const hasSupabaseEnv = missingSupabaseEnvVars.length === 0 && invalidSupabaseEnvVars.length === 0

const envProblems = [...missingSupabaseEnvVars, ...invalidSupabaseEnvVars]

export const supabaseEnvErrorMessage = hasSupabaseEnv
  ? ''
  : `Configuração Supabase inválida/ausente. Corrija: ${envProblems.join(', ')}. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel (Production/Preview/Development) e gere um novo deploy.`

export function maskSupabaseKey(key) {
  if (!key) {
    return 'não definida'
  }

  if (key.length <= 8) {
    return `${key.slice(0, 2)}***`
  }

  return `${key.slice(0, 6)}...${key.slice(-4)}`
}
