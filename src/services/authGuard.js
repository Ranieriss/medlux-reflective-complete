import { supabase } from './supabase'

const ADMIN_PROFILES = new Set(['ADMIN', 'ADMINISTRADOR'])

function normalizePerfil(perfil) {
  return (perfil || '').toString().trim().toUpperCase()
}

function notify(notifyFn, message) {
  if (typeof notifyFn === 'function') {
    notifyFn(message)
  }
}

export async function getSessionOrThrow(notifyFn) {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    notify(notifyFn, 'Sessão expirada')
    throw Object.assign(new Error('Sessão expirada'), { cause: error })
  }

  const session = data?.session
  if (!session?.user?.id) {
    notify(notifyFn, 'Sessão expirada')
    throw new Error('Sessão expirada')
  }

  return session
}

export async function getCurrentProfile(notifyFn) {
  const session = await getSessionOrThrow(notifyFn)

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, perfil, nome, email, ativo')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    notify(notifyFn, 'Falha ao carregar perfil do usuário')
    throw error
  }

  if (!data) {
    notify(notifyFn, 'Perfil de usuário não encontrado')
    throw new Error('Perfil de usuário não encontrado')
  }

  return {
    ...data,
    perfilNormalizado: normalizePerfil(data.perfil)
  }
}

export async function requireAdmin(notifyFn) {
  const profile = await getCurrentProfile(notifyFn)

  if (!ADMIN_PROFILES.has(profile.perfilNormalizado)) {
    notify(notifyFn, 'Somente ADMIN')
    throw new Error('Somente ADMIN')
  }

  return profile
}
