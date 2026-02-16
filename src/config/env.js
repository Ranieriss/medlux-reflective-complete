const getClientEnv = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {}
  }

  return import.meta.env
}

const env = getClientEnv()

export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || ''
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || ''

export const missingSupabaseEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null
].filter(Boolean)

export const hasSupabaseEnv = missingSupabaseEnvVars.length === 0

export const supabaseEnvErrorMessage = hasSupabaseEnv
  ? ''
  : `Configuração Supabase ausente. Defina ${missingSupabaseEnvVars.join(', ')} nas variáveis de ambiente do Vercel/Vite e gere um novo deploy.`
