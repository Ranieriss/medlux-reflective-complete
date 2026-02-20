const isObject = (value) => typeof value === 'object' && value !== null

const lower = (value) => (value || '').toString().toLowerCase()

export function formatSupabaseError(error, fallback = 'Erro inesperado no Supabase.') {
  const message = isObject(error) ? (error.message || fallback) : fallback
  const code = isObject(error) ? (error.code || null) : null
  const status = isObject(error) ? (error.status || null) : null
  const details = isObject(error) ? (error.details || null) : null
  const hint = isObject(error) ? (error.hint || null) : null

  const joined = `${lower(message)} ${lower(code)} ${lower(details)} ${lower(hint)}`.trim()

  if (
    joined.includes('invalid api key') ||
    joined.includes('apikeyinvalid') ||
    joined.includes('project not found') ||
    joined.includes('invalid jwt') ||
    joined.includes('jwt malformed')
  ) {
    return {
      message: 'Chave do Supabase inválida/ausente no deploy. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel (Production e Preview) e faça novo deploy.',
      code,
      status,
      details,
      hint
    }
  }

  if (code === 'PGRST116' || status === 406 || joined.includes('cannot coerce the result to a single json object')) {
    return {
      message: 'Cadastro de perfil não encontrado ou duplicado em public.usuarios. O app tentou seguir automaticamente; se persistir, revise UNIQUE(auth_user_id) e duplicidades.',
      code,
      status,
      details,
      hint
    }
  }

  if (status === 401 || status === 403 || code === '42501' || joined.includes('permission denied')) {
    return {
      message: 'Sem permissão para acessar o Supabase (RLS/Policies). Verifique as políticas da tabela public.usuarios para auth.uid().',
      code,
      status,
      details,
      hint
    }
  }

  return { message, code, status, details, hint }
}
