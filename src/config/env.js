const getClientEnv = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {}
  }

  return import.meta.env
}

const env = getClientEnv()

export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || ''
const anonKeyFromEnv = env.VITE_SUPABASE_ANON_KEY?.trim() || ''
const publishableKeyFromEnv = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || ''

export const supabaseKeySource = anonKeyFromEnv
  ? 'VITE_SUPABASE_ANON_KEY'
  : (publishableKeyFromEnv ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : '')

export const supabaseAnonKey = anonKeyFromEnv || publishableKeyFromEnv

const isValidSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
const looksLikeProjectRef = /^prj_/i.test(supabaseAnonKey)
const isLikelyJwt = supabaseAnonKey.startsWith('eyJ')
const isPublishableKey = /^sb_publishable_/i.test(supabaseAnonKey)
const hasAnySupabaseKey = !!anonKeyFromEnv || !!publishableKeyFromEnv

export const missingSupabaseEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !hasAnySupabaseKey ? 'VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY' : null
].filter(Boolean)

export const invalidSupabaseEnvVars = [
  supabaseUrl && !isValidSupabaseUrl ? 'VITE_SUPABASE_URL (esperado formato https://<project-ref>.supabase.co)' : null,
  looksLikeProjectRef ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (valor prj_... não é chave pública válida)` : null,
  supabaseAnonKey && !looksLikeProjectRef && !isLikelyJwt && !isPublishableKey
    ? `${supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'} (esperado token iniciando com eyJ... ou sb_publishable_...)`
    : null
].filter(Boolean)

export const hasSupabaseEnv = missingSupabaseEnvVars.length === 0 && invalidSupabaseEnvVars.length === 0

const envProblems = [...missingSupabaseEnvVars, ...invalidSupabaseEnvVars]

export const supabaseEnvErrorMessage = hasSupabaseEnv
  ? ''
  : `Configuração Supabase inválida/ausente. Corrija: ${envProblems.join(', ')}. Defina as variáveis no Vercel (Production/Preview/Development), use a Publishable key (sb_publishable_...) e gere um novo deploy.`

export function maskSupabaseKey(key) {
  if (!key) {
    return 'não definida'
  }

  if (key.length <= 8) {
    return `${key.slice(0, 2)}***`
  }

  return `${key.slice(0, 6)}...${key.slice(-4)}`
}
