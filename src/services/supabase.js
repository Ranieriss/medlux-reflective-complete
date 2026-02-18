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

if (!hasSupabaseEnv) {
  if (missingSupabaseEnvVars.length > 0) {
    console.error('⚠️ [supabase] variáveis de ambiente ausentes:', missingSupabaseEnvVars.join(', '))
  }
  if (invalidSupabaseEnvVars.length > 0) {
    console.error('⚠️ [supabase] variáveis de ambiente inválidas:', invalidSupabaseEnvVars.join(', '))
  }
  console.error('ℹ️ [supabase] configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente da Vercel e gere novo deploy.')
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
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : buildMissingEnvProxy()

export {
  hasSupabaseEnv,
  maskSupabaseKey,
  missingSupabaseEnvVars,
  supabaseAnonKey,
  supabaseEnvErrorMessage,
  supabaseKeySource,
  supabaseUrl
}

function formatarErroSupabase(error, fallback = 'Erro inesperado no Supabase.') {
  return {
    message: error?.message || fallback,
    code: error?.code || null,
    status: error?.status || null,
    hint: error?.hint || null,
    details: error?.details || null
  }
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

export async function getCurrentProfile() {
  try {
    const sessionResult = await requireSession()
    if (!sessionResult.success) {
      return sessionResult
    }

    const { session } = sessionResult.data

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, perfil, nome, email, ativo')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      const profileError = new Error('Perfil de usuário não encontrado')
      profileError.code = 'PROFILE_NOT_FOUND'
      throw profileError
    }

    return { success: true, data: { ...data, session } }
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
    if (perfil !== 'ADMIN') {
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
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return { success: true, data: data?.user || null }
  } catch (error) {
    const info = formatarErroSupabase(error, 'Erro ao obter usuário')
    return { success: false, error: info.message, details: info }
  }
}

export async function signUp(email, password, nome, perfil = 'TECNICO') {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })
    if (authError) throw authError
    if (!authData?.user?.id) throw new Error('Usuário não retornado pelo Supabase Auth')

    const perfilPadrao = (perfil || 'TECNICO').toString().trim().toUpperCase()

    const payloadComAuthUserId = {
      auth_user_id: authData.user.id,
      email,
      nome,
      perfil: perfilPadrao,
      ativo: true,
      senha_hash: 'managed_by_supabase_auth'
    }

    const payloadComId = {
      id: authData.user.id,
      email,
      nome,
      perfil: perfilPadrao,
      ativo: true,
      senha_hash: 'managed_by_supabase_auth'
    }

    let userError = null
    const { error: insertWithAuthUserIdError } = await supabase
      .from('usuarios')
      .insert([payloadComAuthUserId])
      .select()
      .single()

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
          .single()

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
      .order('created_at', { ascending: false })

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

    const { data, error } = await supabase
      .from('equipamentos')
      .insert([equipamento])
      .select()
      .maybeSingle()

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
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'equipamentos' },
      (payload) => callback(payload)
    )
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
    const { data } = await supabase.auth.getUser()

    const { error } = await supabase.from('auditoria').insert([
      {
        usuario_id: data?.user?.id || null,
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
    console.error('❌ Erro ao registrar auditoria (best-effort):', {
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
