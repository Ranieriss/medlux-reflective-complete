import { ensureSessionAndProfile } from './supabase'
import { PERFIS, normalizePerfil } from '@/types/perfis'

function notify(notifyFn, message) {
  if (typeof notifyFn === 'function') {
    notifyFn(message)
  }
}

export async function getSessionOrThrow(notifyFn) {
  const ctx = await ensureSessionAndProfile()

  if (!ctx?.session?.user?.id) {
    notify(notifyFn, 'Sessão expirada')
    throw new Error('Sessão expirada')
  }

  return ctx.session
}

export async function getCurrentProfile(notifyFn) {
  const ctx = await ensureSessionAndProfile()

  if (!ctx?.session?.user?.id) {
    notify(notifyFn, 'Sessão expirada')
    throw new Error('Sessão expirada')
  }

  if (!ctx?.perfil) {
    notify(notifyFn, 'Perfil de usuário não encontrado')
    throw new Error('Perfil de usuário não encontrado')
  }

  return {
    ...ctx.perfil,
    perfilNormalizado: normalizePerfil(ctx.perfil.perfil)
  }
}

export async function requireAdmin(notifyFn) {
  const profile = await getCurrentProfile(notifyFn)

  if (profile.perfilNormalizado !== PERFIS.ADMIN) {
    notify(notifyFn, 'Somente ADMIN')
    throw new Error('Somente ADMIN')
  }

  return profile
}
