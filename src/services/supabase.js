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
import { requireAdmin, getCurrentProfile } from './authGuard'

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

  return new Proxy({}, {
    get() {
      throw error
    }
  })
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
  if (status === 403) return 'Sem permissão para executar esta ação.'
  return null
}

export async function requireSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const session = data?.session || null
  if (!session) {
    const sessionError = new Error('Sessão expirada, faça login novamente')
    sessionError.code = 'SESSION_EXPIRED'
    throw sessionError
  }

  return { session }
}

export async function requireAdmin() {
  const { session } = await requireSession()

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, perfil')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (error) throw error

  const perfil = (data?.perfil || '').toString().trim().toUpperCase()
  if (perfil !== 'ADMIN') {
    const forbiddenError = new Error('Somente ADMIN')
    forbiddenError.code = 'FORBIDDEN_ADMIN_ONLY'
    throw forbiddenError
  }

  return { session, usuario: data }
}

// Mantém compatibilidade com código antigo que chamava usuarioAtualEhAdmin()
export async function usuarioAtualEhAdmin() {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

}

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * Fazer login com email e senha
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    console.log('✅ Login realizado com sucesso:', data.user.email)
    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Fazer logout
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    console.log('✅ Logout realizado com sucesso')
    return { success: true }
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { success: true, user }
  } catch (error) {
    console.error('❌ Erro ao obter usuário:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar novo usuário
 */
export async function signUp(email, password, nome, perfil = 'tecnico') {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) throw authError

    // 2. Inserir dados na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        email,
        nome,
        perfil,
        senha_hash: 'managed_by_supabase_auth'
      }])
      .select()
      .single()

    if (userError) throw userError

    console.log('✅ Usuário cadastrado com sucesso:', email)
    return { success: true, user: authData.user }
  } catch (error) {
    console.error('❌ Erro ao cadastrar usuário:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Enviar email de recuperação de senha
 */
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_PASSWORD_REDIRECT_URL
    })

    if (error) throw error

    console.log('✅ Email de recuperação enviado para:', email)
    console.warn('[auth][reset-password] redirectTo aplicado:', RESET_PASSWORD_REDIRECT_URL)
    return { success: true, message: 'Email de recuperação enviado com sucesso!' }
  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar senha do usuário
 */
export async function updatePassword(newPassword) {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) throw sessionError

    if (!sessionData?.session) {
      console.error('[auth][update-password] updateUser bloqueado por falta de sessão ativa')
      return {
        success: false,
        error: 'Sessão de recuperação ausente. Abra novamente o link enviado por e-mail.'
      }
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    console.log('✅ Senha atualizada com sucesso')
    return { success: true, message: 'Senha atualizada com sucesso!' }
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error.message)
    return { success: false, error: error.message }
  }
}

// ============================================
// EQUIPAMENTOS
// ============================================

/**
 * Buscar todos os equipamentos
 */
export async function getEquipamentos(filtros = {}) {
  try {
    let query = supabase
      .from('equipamentos')
      .select(`
        *,
        usuario_atual:usuarios!equipamentos_usuario_atual_id_fkey(id, nome, email)
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros.busca) {
      query = query.or(`codigo.ilike.%${filtros.busca}%,nome.ilike.%${filtros.busca}%`)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`✅ ${data.length} equipamentos carregados`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar equipamentos:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar equipamento por ID
 */
export async function getEquipamento(id) {
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select(`
        *,
        usuario_atual:usuarios!equipamentos_usuario_atual_id_fkey(id, nome, email)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: false, error: 'Equipamento não encontrado.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar equipamento:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Criar novo equipamento
 */
export async function createEquipamento(equipamento) {
  try {
    await requireAdmin()

    const { data, error } = await supabase
      .from('equipamentos')
      .insert([equipamento])
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
if (error) throw error
if (!data) {
  return { success: false, error: 'Critério não encontrado para os parâmetros informados' }
}

    }

    // Registrar na auditoria
    await registrarAuditoria('equipamentos', data.id, 'CREATE', null, data)

    console.log('✅ Equipamento criado:', data.codigo)
    return { success: true, data }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao criar equipamento')
    console.error('❌ Erro ao criar equipamento:', info)
    return { success: false, error: friendly || info.message, details: info }
  }
}

/**
 * Atualizar equipamento
 */
export async function updateEquipamento(id, updates) {
  try {
    await requireAdmin()

    // Buscar dados anteriores
    const { data: dadosAnteriores } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('equipamentos')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: false, error: 'Equipamento não encontrado para atualização.' }
    }

    // Registrar na auditoria
    await registrarAuditoria('equipamentos', id, 'UPDATE', dadosAnteriores, data)

    console.log('✅ Equipamento atualizado:', data.codigo)
    return { success: true, data }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao atualizar equipamento')
    console.error('❌ Erro ao atualizar equipamento:', info)
    return { success: false, error: friendly || info.message, details: info }
  }
}

/**
 * Deletar equipamento
 */
export async function deleteEquipamento(id) {
  try {
    await requireAdmin()

    // Buscar dados antes de deletar
    const { data: dadosAnteriores } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase
      .from('equipamentos')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Registrar na auditoria
    await registrarAuditoria('equipamentos', id, 'DELETE', dadosAnteriores, null)

    console.log('✅ Equipamento deletado:', id)
    return { success: true }
  } catch (error) {
    const friendly = getMensagemPermissao(error)
    const info = formatarErroSupabase(error, 'Erro ao deletar equipamento')
    console.error('❌ Erro ao deletar equipamento:', info)
    return { success: false, error: friendly || info.message, details: info }
  }
}

// ============================================
// REALTIME - SINCRONIZAÇÃO EM TEMPO REAL
// ============================================

/**
 * Inscrever-se para mudanças em tempo real na tabela de equipamentos
 */
export function subscribeToEquipamentos(callback) {
  console.log('🔔 Inscrevendo-se em mudanças em tempo real de equipamentos...')

  const channel = supabase
    .channel('equipamentos-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'equipamentos'
      },
      (payload) => {
        console.log('🔔 Mudança detectada:', payload.eventType, payload.new || payload.old)
        callback(payload)
      }
    )
    .subscribe()

  // Retornar função para cancelar inscrição
  return () => {
    console.log('🔕 Cancelando inscrição de mudanças em tempo real')
    supabase.removeChannel(channel)
  }
}

// ============================================
// DASHBOARD - ESTATÍSTICAS
// ============================================

/**
 * Obter estatísticas para o dashboard
 */
export async function getDashboardStats() {
  try {
    const { data, error } = await supabase
      .from('vw_dashboard_stats')
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: true, data: {} }
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message)
    return { success: false, error: error.message }
  }
}

// ============================================
// AUDITORIA
// ============================================

/**
 * Registrar ação na auditoria
 */
export async function registrarAuditoria(entidade, entidadeId, acao, dadosAnteriores, dadosNovos) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('auditoria')
      .insert([{
        usuario_id: user?.id,
        entidade,
        entidade_id: entidadeId,
        acao,
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos
      }])

    if (error) throw error
  } catch (error) {
    console.error('❌ Erro ao registrar auditoria:', error.message)
  }
}

/**
 * Buscar histórico de auditoria
 */
export async function getAuditoria(filtros = {}) {
  try {
    let query = supabase
      .from('auditoria')
      .select(`
        *,
        usuario:usuarios(id, nome, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filtros.entidade) {
      query = query.eq('entidade', filtros.entidade)
    }
    if (filtros.entidadeId) {
      query = query.eq('entidade_id', filtros.entidadeId)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar auditoria:', error.message)
    return { success: false, error: error.message }
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Verificar se o Supabase está conectado
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('count')
      .limit(1)

    if (error) throw error

    console.log('✅ Conexão com Supabase OK')
    return { success: true }
  } catch (error) {
    console.error('❌ Erro de conexão com Supabase:', error.message)
    return { success: false, error: error.message }
  }
}

export default supabase
