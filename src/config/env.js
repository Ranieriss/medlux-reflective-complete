const getClientEnv = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {}
  }

  return import.meta.env
}

const env = getClientEnv()

export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || ''
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || ''

const isValidSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)
const looksLikeProjectRef = /^prj_/i.test(supabaseAnonKey)
const isLikelyJwt = supabaseAnonKey.startsWith('eyJ')

export const missingSupabaseEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null
].filter(Boolean)

export const invalidSupabaseEnvVars = [
  supabaseUrl && !isValidSupabaseUrl ? 'VITE_SUPABASE_URL (esperado formato https://<project-ref>.supabase.co)' : null,
  looksLikeProjectRef ? 'VITE_SUPABASE_ANON_KEY (valor prj_... não é anon key)' : null,
  supabaseAnonKey && !looksLikeProjectRef && !isLikelyJwt ? 'VITE_SUPABASE_ANON_KEY (esperado token iniciando com eyJ...)' : null
].filter(Boolean)

export const hasSupabaseEnv = missingSupabaseEnvVars.length === 0 && invalidSupabaseEnvVars.length === 0

const envProblems = [...missingSupabaseEnvVars, ...invalidSupabaseEnvVars]

export const supabaseEnvErrorMessage = hasSupabaseEnv
  ? ''
  : `Configuração Supabase inválida/ausente. Corrija: ${envProblems.join(', ')}. Defina as variáveis no Vercel (não dependa de .env.local em produção) e gere um novo deploy.`
