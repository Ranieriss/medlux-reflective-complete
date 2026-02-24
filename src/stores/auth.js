import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ensureSessionAndProfile, hasSupabaseEnv, supabase, supabaseEnvErrorMessage } from '@/services/supabase'
import { formatSupabaseError } from '@/utils/formatSupabaseError'
import { PERFIS, normalizePerfil } from '@/types/perfis'

const STORAGE_KEY = 'medlux_auth'

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

function formatErrorDetails(error) {
  const normalized = formatSupabaseError(error, 'Erro ao realizar login.')
  return {
    status: normalized.status ?? null,
    message: normalized.message,
    code: normalized.code ?? null
  }
}


function mapLoginError(error) {
  const message = getErrorMessage(error, '').toLowerCase()

  if (!hasSupabaseEnv) {
    return supabaseEnvErrorMessage
  }

  if (message.includes('user_banned')) {
    return 'Usuário bloqueado no Auth. Solicite ao ADMIN desbloqueio.'
  }

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'E-mail não confirmado. Confirme no e-mail ou peça ao ADMIN.'
  }

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials') || error?.status === 400) {
    return 'Credenciais inválidas. Verifique e-mail e senha cadastrados.'
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('cors')) {
    return 'Falha de rede/CORS ao conectar ao Supabase. Verifique sua conexão e as configurações de domínio permitido.'
  }

  return formatSupabaseError(error, 'Erro ao realizar login.').message
}

function isEmailConfirmationRequired(error) {
  const message = getErrorMessage(error, '').toLowerCase()
  return message.includes('email not confirmed') || message.includes('email_not_confirmed')
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const isAuthenticated = ref(false)
  const session = ref(null)

  const isAdmin = computed(() => normalizePerfil(usuario.value?.perfil) === PERFIS.ADMIN)
  const isTecnico = computed(() => false)
  const isOperador = computed(() => normalizePerfil(usuario.value?.perfil) === PERFIS.OPERADOR)
  const nomeUsuario = computed(() => usuario.value?.nome || 'Usuário')
  const emailUsuario = computed(() => usuario.value?.email || '')
  const perfilUsuario = computed(() => normalizePerfil(usuario.value?.perfil))

  const salvarSessaoLocal = (dadosUsuario) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: dadosUsuario.id,
      email: dadosUsuario.email,
      nome: dadosUsuario.nome,
      perfil: normalizePerfil(dadosUsuario.perfil),
      ativo: dadosUsuario.ativo
    }))
  }

  const limparSessaoLocal = () => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const carregarPerfilUsuario = async () => {
    const ctx = await ensureSessionAndProfile()
    if (!ctx?.session?.user?.id) {
      throw new Error('Usuário autenticado não encontrado na sessão atual.')
    }

    const authId = ctx.session.user.id

    const perfil = ctx.perfil

    const error = !perfil ? { message: 'Perfil não encontrado', code: 'PROFILE_NOT_FOUND' } : null

    if (error) {
      const lowerMsg = getErrorMessage(error, '').toLowerCase()
      if (lowerMsg.includes('more than 1 row') || lowerMsg.includes('multiple') || error?.code === 'PGRST116' || error?.code === 'PROFILE_DUPLICATED') {
        const { count } = await supabase
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('auth_user_id', authId)

        const mensagem = count > 1
          ? 'Foram encontrados múltiplos cadastros em public.usuarios para este id/auth.uid(). Contate o ADMIN para remover duplicidades.'
          : 'Usuário autenticado, mas sem cadastro em public.usuarios. Solicite ao ADMIN a criação do registro.'

        throw Object.assign(new Error(mensagem), { details: formatErrorDetails(error) })
      }

      throw Object.assign(new Error(`Erro na etapa Perfil (status=${error?.status ?? 'n/a'}, code=${error?.code ?? 'n/a'}): ${getErrorMessage(error, 'sem detalhes')}. Verifique policies RLS em public.usuarios e variáveis de ambiente Supabase.`), { details: formatErrorDetails(error) })
    }

    if (!perfil) {
      throw new Error('Usuário autenticado, mas sem cadastro em public.usuarios (perfil). Contate o ADMIN.')
    }

    if (!perfil?.ativo) {
      throw new Error('Usuário inativo. Entre em contato com o administrador.')
    }

    return { ...perfil, perfil: normalizePerfil(perfil.perfil) }
  }

  const login = async (email, senha) => {
    try {
      const emailLimpo = (email || '').trim()
      const senhaLimpa = senha || ''

      if (!emailLimpo || !emailLimpo.includes('@')) {
        return {
          sucesso: false,
          etapa: 'Auth',
          mensagem: 'Informe um e-mail válido para continuar.',
          detalhes: { status: 400, message: 'E-mail ausente ou inválido.', code: 'invalid_email' }
        }
      }

      if (!senhaLimpa) {
        return {
          sucesso: false,
          etapa: 'Auth',
          mensagem: 'Informe a senha para continuar.',
          detalhes: { status: 400, message: 'Senha ausente.', code: 'missing_password' }
        }
      }

      if (!hasSupabaseEnv) {
        return {
          sucesso: false,
          etapa: 'Configuração',
          mensagem: supabaseEnvErrorMessage,
          detalhes: {
            status: null,
            message: supabaseEnvErrorMessage,
            code: 'missing_supabase_env'
          }
        }
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senhaLimpa
      })

      if (authError) {
        return {
          sucesso: false,
          etapa: 'Auth',
          mensagem: mapLoginError(authError),
          detalhes: formatErrorDetails(authError),
          precisaConfirmarEmail: isEmailConfirmationRequired(authError)
        }
      }

      const ctx = await ensureSessionAndProfile()
      if (!ctx) {
        return {
          sucesso: false,
          etapa: 'Session',
          mensagem: 'Sessão expirada. Faça login novamente.',
          detalhes: { status: 401, message: 'Sessão não encontrada após login.', code: 'session_missing_after_login' }
        }
      }

      const usuarioPerfil = await carregarPerfilUsuario()

      const perfilNormalizado = normalizePerfil(usuarioPerfil.perfil)
      if (perfilNormalizado !== PERFIS.ADMIN && perfilNormalizado !== PERFIS.OPERADOR) {
        return {
          sucesso: false,
          etapa: 'Permissões',
          mensagem: `Perfil inconsistente em public.usuarios: "${usuarioPerfil.perfil || 'vazio'}". Apenas ADMIN ou OPERADOR são aceitos.`,
          detalhes: {
            status: 403,
            message: 'Perfil inválido para autorização no app.',
            code: 'invalid_profile_role'
          }
        }
      }

      usuarioPerfil.perfil = perfilNormalizado

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuarioPerfil.id)

      if (updateError) {
        if ((updateError.message || '').toLowerCase().includes('ultimo_acesso')) {
          console.warn('⚠️ Coluna ultimo_acesso ausente no banco. Execute a migration de correção do Supabase/RLS.')
        } else {
          console.warn('⚠️ Não foi possível atualizar último acesso:', updateError.message)
        }
      }

      usuario.value = usuarioPerfil
      session.value = ctx.session
      isAuthenticated.value = true
      salvarSessaoLocal(usuarioPerfil)

      return { sucesso: true }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      const errorDetalhes = error?.details || formatErrorDetails(error)
      const etapa = error?.message?.includes('sessão')
        ? 'Session'
        : error?.message?.toLowerCase().includes('perfil') || error?.message?.toLowerCase().includes('public.usuarios')
          ? 'Perfil'
          : 'Auth'
      return {
        sucesso: false,
        etapa,
        mensagem: error?.message || mapLoginError(error),
        detalhes: errorDetalhes,
        precisaConfirmarEmail: isEmailConfirmationRequired(error)
      }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Erro ao encerrar sessão no Supabase:', error.message)
      }
    } catch (error) {
      console.error('❌ Erro no logout:', error)
    } finally {
      usuario.value = null
      isAuthenticated.value = false
      session.value = null
      limparSessaoLocal()
    }
  }

  const restaurarSessao = async () => {
    try {
      if (!hasSupabaseEnv) {
        usuario.value = null
        session.value = null
        isAuthenticated.value = false
        limparSessaoLocal()
        return false
      }

      const ctx = await ensureSessionAndProfile()
      if (!ctx?.session?.user) {
        usuario.value = null
        session.value = null
        isAuthenticated.value = false
        limparSessaoLocal()
        return false
      }

      session.value = ctx.session
      const usuarioPerfil = await carregarPerfilUsuario()

      usuario.value = usuarioPerfil
      isAuthenticated.value = true
      salvarSessaoLocal(usuarioPerfil)
      return true
    } catch (error) {
      console.error('❌ Erro ao restaurar sessão:', error)
      usuario.value = null
      session.value = null
      isAuthenticated.value = false
      limparSessaoLocal()
      return false
    }
  }

  const temPermissao = (permissao) => {
    if (!usuario.value) return false
    if (normalizePerfil(usuario.value.perfil) === PERFIS.ADMIN) return true

    const permissoesUser = [
      'ver_equipamentos',
      'ver_vinculos',
      'ver_calibracoes',
      'criar_medicoes',
      'ver_equipamentos_vinculados',
      'ver_medicoes'
    ]

    return permissoesUser.includes(permissao)
  }

  return {
    usuario,
    isAuthenticated,
    isAdmin,
    isTecnico,
    isOperador,
    nomeUsuario,
    emailUsuario,
    perfilUsuario,
    login,
    logout,
    restaurarSessao,
    temPermissao
  }
})
