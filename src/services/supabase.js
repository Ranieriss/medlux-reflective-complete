// MEDLUX Reflective - Supabase Integration Service
// Serviço central para comunicação com o Supabase (PostgreSQL + Realtime)

import { createClient } from '@supabase/supabase-js'
import {
  hasSupabaseEnv,
  invalidSupabaseEnvVars,
  maskSupabaseKey,
  missingSupabaseEnvVars,
  supabaseAnonKey,
  supabaseEnvErrorMessage,
  supabaseKeySource,
  supabaseUrl
} from '@/config/env'
import { RESET_PASSWORD_REDIRECT_URL } from '@/config/urls'
import { formatSupabaseError } from '@/utils/formatSupabaseError'
import { PERFIS, normalizePerfil } from '@/types/perfis'

if (!hasSupabaseEnv) {
  if (missingSupabaseEnvVars.length > 0) {
    console.error('⚠️ [supabase] variáveis de ambiente ausentes:', missingSupabaseEnvVars.join(', '))
  }
  if (invalidSupabaseEnvVars.length > 0) {
    console.error('⚠️ [supabase] variáveis de ambiente inválidas:', invalidSupabaseEnvVars.join(', '))
  }
  console.error(
    'ℹ️ [supabase] configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente da Vercel e gere novo deploy.'
  )
  console.error(supabaseEnvErrorMessage)
}

const buildMissingEnvProxy = () => {
  const error = new Error(supabaseEnvErrorMessage)
  return new Proxy(
    {},
    {
      get() {
        throw error
      }
    }
  )
}

// Criar cliente Supabase
export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : buildMissingEnvProxy()

// ===============================
// DEBUG MODE - expõe supabase no window
// ===============================
const debugEnabled =
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1') ||
  (typeof window !== 'undefined' && window.localStorage.getItem('MEDLUX_DEBUG') === '1')

// IMPORTANTE: expor apenas quando env está OK (evita expor Proxy que lança erro)
if (debugEnabled && typeof window !== 'undefined' && hasSupabaseEnv) {
  window.supabaseClient = supabase
  window.supabase = supabase
  console.log('[MEDLUX DEBUG] window.supabaseClient disponível')
}

const AUTH_ERROR_STATUS = new Set([401, 403])

function isAuthError(error) {
  const status = Number(error?.status)
  const code = String(error?.code || '').toUpperCase()
  return AUTH_ERROR_STATUS.has(status) || code === '401' || code === '403' || code === 'SESSION_EXPIRED'
}

export async function executeWithAuthRetry(operationName, operation) {
  try {
    return await operation()
  } catch (error) {
    if (!isAuthError(error)) throw error

    console.warn('⚠️ [supabase] falha de autenticação, tentando refresh da sessão', {
      operationName,
      status: error?.status || null,
      code: error?.code || null,
      message: error?.message || 'sem mensagem'
    })

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshData?.session) {
      console.error('❌ [supabase] refresh de sessão falhou; relogin necessário', {
        operationName,
        status: refreshError?.status || null,
        code: refreshError?.code || null,
        message: refreshError?.message || error?.message || 'sem mensagem'
      })

      const reloginError = new Error('Sessão expirada, faça login novamente')
      reloginError.code = 'SESSION_EXPIRED'
      reloginError.status = 401
      throw reloginError
    }

    console.info('🔁 [supabase] sessão renovada com sucesso; repetindo operação', { operationName })
    return operation()
  }
}

if (hasSupabaseEnv && import.meta.env.DEV) {
  console.info('[supabase] health-check', {
    url: supabaseUrl,
    key: maskSupabaseKey(supabaseAnonKey),
    source: supabaseKeySource || 'VITE_SUPABASE_ANON_KEY'
  })
}

export {
  hasSupabaseEnv,
  maskSupabaseKey,
  missingSupabaseEnvVars,
  supabaseAnonKey,
  supabaseEnvErrorMessage,
  supabaseKeySource,
  supabaseUrl
}

const PERFIL_DUPLICADO_CODES = new Set(['PGRST116'])

const isMissingColumnError = (error, columnName) => {
  const message = (error?.message || '').toLowerCase()
  return error?.code === '42703' || message.includes(columnName.toLowerCase())
}

function formatarErroSupabase(error, fallback = 'Erro inesperado no Supabase.') {
  return formatSupabaseError(error, fallback)
}

async function obterPerfilPorUsuarioId(userId) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('auth_user_id', userId).maybeSingle()

  if (error) {
    if (PERFIL_DUPLICADO_CODES.has(error.code) || (error.message || '').toLowerCase().includes('multiple')) {
      const duplicated = new Error(
        'Perfil duplicado detectado em public.usuarios para este usuário. Contate o suporte para remover duplicidades e aplique UNIQUE(auth_user_id).'
      )
      duplicated.code = 'PROFILE_DUPLICATED'
      duplicated.status = 409
      throw duplicated
    }

    throw error
  }

  return { data, error: null, nextFallback: data ? null : 'id' }
}

async function criarPerfilAusente(user) {
  const email = user?.email || ''
  const nomeFallback = (user?.user_metadata?.nome || email.split('@')[0] || 'Usuário').toString().slice(0, 120)

  const payloads = [
    {
      user_id: user.id,
      auth_user_id: user.id,
      email,
      nome: nomeFallback,
      perfil: PERFIS.OPERADOR,
      ativo: true
    },
    {
      auth_user_id: user.id,
      email,
      nome: nomeFallback,
      perfil: PERFIS.OPERADOR,
      ativo: true
    },
    {
      id: user.id,
      email,
      nome: nomeFallback,
      perfil: PERFIS.OPERADOR,
      ativo: true
    }
  ]

  let lastError = null
  for (const payload of payloads) {
    const { data, error } = await supabase.from('usuarios').insert([payload]).select('*').maybeSingle()
    if (!error) return data

    lastError = error

    if (error?.code === '23505') {
      return null
    }

    if (!isMissingColumnError(error, 'user_id') && !isMissingColumnError(error, 'auth_user_id')) {
      throw error
    }
  }

  if (lastError) throw lastError
  return null
}

function getMensagemPermissao(error) {
  const status = error?.status
  if (error?.code === 'SESSION_EXPIRED') return 'Sessão expirada, faça login novamente'
  if (error?.code === 'FORBIDDEN_ADMIN_ONLY') return 'Somente ADMIN'
  if (error?.code === '42501' || status === 403) {
    return 'Permissão negada (RLS). Verifique se o usuário está como ADMIN no cadastro e se as policies do Supabase foram aplicadas.'
  }
  return null
}

export async function requireSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    const session = data?.session || null
    if (!session) {
      const sessionError = new Error('Sessão expirada, faça login novamente')
      sessionError.code = 'SESSION_EXPIRED'
      throw sessionError
    }

    return { success: true, data: { session } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Sessão expirada, faça login novamente')
    return { success: false, error: info.message, details: info }
  }
}

export async function ensureSessionAndProfile() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!session) return null

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData?.user) return null

    let perfil = null
    const perfilByUserId = await obterPerfilPorUsuarioId(userData.user.id)
    perfil = perfilByUserId.data

    if (!perfil && perfilByUserId.nextFallback === 'id') {
      const { data: perfilById, error: perfilByIdError } = await supabase.from('usuarios').select('*').eq('id', userData.user.id).maybeSingle()

      if (perfilByIdError) throw perfilByIdError
      perfil = perfilById || null
    }

    if (!perfil) {
      perfil = await criarPerfilAusente(userData.user)

      if (!perfil) {
        const { data: perfilRecuperado, error: perfilRecuperadoError } = await supabase.from('usuarios').select('*').eq('id', userData.user.id).maybeSingle()

        if (perfilRecuperadoError) throw perfilRecuperadoError
        perfil = perfilRecuperado || null
      }
    }

    return {
      session,
      user: userData.user,
      perfil
    }
  } catch (error) {
    console.error('❌ Falha ao garantir sessão e perfil:', {
      message: error?.message || String(error),
      code: error?.code || null,
      status: error?.status || null
    })
    return null
  }
}

export async function getCurrentProfile() {
  try {
    const ctx = await ensureSessionAndProfile()
    if (!ctx) {
      const sessionError = new Error('Sessão expirada, faça login novamente')
      sessionError.code = 'SESSION_EXPIRED'
      throw sessionError
    }

    if (!ctx.perfil) {
      const profileError = new Error('Perfil de usuário não encontrado')
      profileError.code = 'PROFILE_NOT_FOUND'
      throw profileError
    }

    return { success: true, data: { ...ctx.perfil, session: ctx.session } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Falha ao carregar perfil do usuário')
    return { success: false, error: info.message, details: info }
  }
}

export async function requireAdmin() {
  try {
    const profileResult = await getCurrentProfile()
    if (!profileResult.success) {
      return profileResult
    }

    const { session, ...usuario } = profileResult.data
    const perfil = (usuario?.perfil || '').toString().trim().toUpperCase()
    if (normalizePerfil(perfil) !== PERFIS.ADMIN) {
      const forbiddenError = new Error('Somente ADMIN')
      forbiddenError.code = 'FORBIDDEN_ADMIN_ONLY'
      throw forbiddenError
    }

    return { success: true, data: { session, usuario } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Falha ao validar permissão ADMIN')
    return { success: false, error: getMensagemPermissao(error) || info.message, details: info }
  }
}

// Mantém compatibilidade com código antigo que chamava usuarioAtualEhAdmin()
export async function usuarioAtualEhAdmin() {
  try {
    const result = await requireAdmin()
    return !!result.success
  } catch {
    return false
  }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error

    return { success: true, data: { user: data.user, session: data.session } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao fazer login')
    return { success: false, error: info.message, details: info }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true, data: null }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao sair')
    return { success: false, error: info.message, details: info }
  }
}

export async function getCurrentUser() {
  try {
    const ctx = await ensureSessionAndProfile()
    return { success: true, data: ctx?.user || null }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao obter usuário')
    return { success: false, error: info.message, details: info }
  }
}

export async function signUp(email, password, nome, perfil = PERFIS.OPERADOR) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })
    if (authError) throw authError
    if (!authData?.user?.id) throw new Error('Usuário não retornado pelo Supabase Auth')

    const perfilPadrao = normalizePerfil(perfil || PERFIS.OPERADOR)

    const payloadComAuthUserId = {
      auth_user_id: authData.user.id,
      email,
      nome,
      perfil: perfilPadrao,
      ativo: true
    }

    const payloadComId = {
      id: authData.user.id,
      email,
      nome,
      perfil: perfilPadrao,
      ativo: true
    }

    let userError = null
    const { error: insertWithAuthUserIdError } = await supabase
      .from('usuarios')
      .insert([payloadComAuthUserId])
      .select()
      .maybeSingle()

    if (insertWithAuthUserIdError) {
      const mensagem = (insertWithAuthUserIdError.message || '').toLowerCase()
      const authUserIdNaoExiste = insertWithAuthUserIdError?.code === '42703' || mensagem.includes('auth_user_id')

      if (!authUserIdNaoExiste) {
        userError = insertWithAuthUserIdError
      } else {
        const { error: insertWithIdError } = await supabase
          .from('usuarios')
          .insert([payloadComId])
          .select()
          .maybeSingle()

        if (insertWithIdError) {
          userError = insertWithIdError
        }
      }
    }

    if (userError) throw userError

    return { success: true, data: authData.user }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao cadastrar usuário')
    return { success: false, error: info.message, details: info }
  }
}

export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_PASSWORD_REDIRECT_URL
    })
    if (error) throw error

    return { success: true, data: { message: 'Email de recuperação enviado com sucesso!' } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao enviar recuperação de senha')
    return { success: false, error: info.message, details: info }
  }
}

export async function updatePassword(newPassword) {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (!sessionData?.session) {
      return {
        success: false,
        error: 'Sessão de recuperação ausente. Abra novamente o link enviado por e-mail.',
        details: { code: 'SESSION_EXPIRED', status: 401 }
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error

    return { success: true, data: { message: 'Senha atualizada com sucesso!' } }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao atualizar senha')
    return { success: false, error: info.message, details: info }
  }
}

// ============================================
// EQUIPAMENTOS
// ============================================

export async function getEquipamentos(filtros = {}) {
  try {
    let query = supabase
      .from('equipamentos')
      .select(
        `
        *,
        usuario_atual:usuarios!equipamentos_usuario_atual_id_fkey(id, nome, email)
      `
      )
      .order('codigo', { ascending: true })

    if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
    if (filtros.status) query = query.eq('status', filtros.status)
    if (filtros.busca) query = query.or(`codigo.ilike.%${filtros.busca}%,nome.ilike.%${filtros.busca}%`)

    const { data, error } = await query
    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: error?.message || 'Erro ao buscar equipamentos' }
  }
}

export async function getEquipamento(id) {
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select(
        `
        *,
        usuario_atual:usuarios!equipamentos_usuario_atual_id_fkey(id, nome, email)
      `
      )
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return { success: false, error: 'Equipamento não encontrado.' }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error?.message || 'Erro ao buscar equipamento' }
  }
}

export async function createEquipamento(equipamento) {
  try {
    const adminResult = await requireAdmin()
    if (!adminResult.success) return adminResult

    const { data, error } = await supabase.from('equipamentos').insert([equipamento]).select().maybeSingle()

    if (error) throw error
    if (!data) return { success: false, error: 'Equipamento não retornou dados após criação.' }

    await registrarAuditoria('equipamentos', data.id, 'CREATE', null, data)

    return { success: true, data }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao criar equipamento')
    return { success: false, error: friendly || info.message, details: info }
  }
}

export async function updateEquipamento(id, updates) {
  try {
    const adminResult = await requireAdmin()
    if (!adminResult.success) return adminResult

    const { data: dadosAnteriores } = await supabase.from('equipamentos').select('*').eq('id', id).maybeSingle()

    const { data, error } = await supabase.from('equipamentos').update(updates).eq('id', id).select().maybeSingle()

    if (error) throw error
    if (!data) return { success: false, error: 'Equipamento não encontrado para atualização.' }

    await registrarAuditoria('equipamentos', id, 'UPDATE', dadosAnteriores || null, data)

    return { success: true, data }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao atualizar equipamento')
    return { success: false, error: friendly || info.message, details: info }
  }
}

export async function deleteEquipamento(id) {
  try {
    const adminResult = await requireAdmin()
    if (!adminResult.success) return adminResult

    const { data: dadosAnteriores } = await supabase.from('equipamentos').select('*').eq('id', id).maybeSingle()

    const { error } = await supabase.from('equipamentos').delete().eq('id', id)
    if (error) throw error

    await registrarAuditoria('equipamentos', id, 'DELETE', dadosAnteriores || null, null)

    return { success: true }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao deletar equipamento')
    return { success: false, error: friendly || info.message, details: info }
  }
}

// ============================================
// REALTIME - SINCRONIZAÇÃO EM TEMPO REAL
// ============================================

export function subscribeToEquipamentos(callback) {
  const channel = supabase
    .channel('equipamentos-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipamentos' }, (payload) => callback(payload))
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================
// DASHBOARD - ESTATÍSTICAS
// ============================================

export async function getDashboardStats() {
  try {
    const { data, error } = await supabase.from('vw_dashboard_stats').select('*').maybeSingle()
    if (error) throw error
    return { success: true, data: data || {} }
  } catch (error) {
    return { success: false, error: error?.message || 'Erro ao buscar estatísticas' }
  }
}

// ============================================
// AUDITORIA
// ============================================

export async function registrarAuditoria(entidade, entidadeId, acao, dadosAnteriores, dadosNovos) {
  try {
    const ctx = await ensureSessionAndProfile()

    const { error } = await supabase.from('auditoria').insert([
      {
        // Preferir o ID do perfil (public.usuarios.id). Fallback para auth.users.id se seu schema usar isso.
        usuario_id: ctx?.perfil?.id || ctx?.user?.id || null,
        entidade,
        entidade_id: entidadeId,
        acao,
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos
      }
    ])

    if (error) {
      throw error
    }
  } catch (error) {
    const isPermissionError = error?.code === '42501' || error?.status === 403
    const logger = isPermissionError ? console.warn : console.error
    logger('⚠️ Erro ao registrar auditoria (best-effort):', {
      message: error?.message || String(error),
      code: error?.code || null,
      status: error?.status || null,
      details: error?.details || null
    })
  }
}

export async function getAuditoria(filtros = {}) {
  try {
    let query = supabase
      .from('auditoria')
      .select(
        `
        *,
        usuario:usuarios(id, nome, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (filtros.entidade) query = query.eq('entidade', filtros.entidade)
    if (filtros.entidadeId) query = query.eq('entidade_id', filtros.entidadeId)

    const { data, error } = await query
    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: error?.message || 'Erro ao buscar auditoria' }
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

export async function testConnection() {
  try {
    const { error } = await supabase.from('equipamentos').select('*', { count: 'exact', head: true })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error?.message || 'Erro de conexão com Supabase' }
  }
}

export default supabase
