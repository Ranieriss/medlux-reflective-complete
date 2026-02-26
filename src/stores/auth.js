import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ensureSessionAndProfile, hasSupabaseEnv, supabase, supabaseEnvErrorMessage } from '@/services/supabase'
import { formatSupabaseError } from '@/utils/formatSupabaseError'
import { PERFIS, normalizePerfil } from '@/types/perfis'

const STORAGE_KEY = 'medlux_auth'

// ===============================
// Helpers (timeout + wait session)
// ===============================
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${label} (${ms}ms)`)), ms))
  ])
}

/**
 * Espera a sessão “assentar” (útil logo após SIGNED_IN, principalmente no /login).
 * Tenta getSession algumas vezes com pequenos delays.
 */
async function waitForSession({ maxMs = 10000, stepMs = 250 } = {}) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const r = await supabase.auth.getSession()
    if (r?.data?.session?.user?.id) return r.data.session
    await new Promise(res => setTimeout(res, stepMs))
  }
  return null
}

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

  if (!hasSupabaseEnv) return supabaseEnvErrorMessage

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

  // Evita restaurar 10x ao mesmo tempo (CAUSA PRINCIPAL do “fica rodando”)
  let restorePromise = null

  // Flag para garantir que o listener do Auth é registrado só 1 vez
  let authListenerReady = false

  const salvarSessaoLocal = (dadosUsuario) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id: dadosUsuario.id,
        email: dadosUsuario.email,
        nome: dadosUsuario.nome,
        perfil: normalizePerfil(dadosUsuario.perfil),
        ativo: dadosUsuario.ativo
      })
    )
  }

  const limparSessaoLocal = () => {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const clearLocalSessionState = () => {
    usuario.value = null
    isAuthenticated.value = false
    session.value = null
    limparSessaoLocal()
  }

  /**
   * Registra listener do Supabase Auth:
   * - ajuda muito quando SIGNED_IN ocorre “depois” e você está em /login
   * - mantém session/isAuthenticated coerentes
   */
  const ensureAuthListener = () => {
    if (authListenerReady) return
    authListenerReady = true

    supabase.auth.onAuthStateChange((event, newSession) => {
      // Mantém o que o Supabase sabe no store
      session.value = newSession || null
      isAuthenticated.value = !!newSession?.user?.id

      // Se saiu, limpa tudo
      if (event === 'SIGNED_OUT') {
        clearLocalSessionState()
      }
    })
  }

  const carregarPerfilUsuario = async () => {
    // IMPORTANTE: isso pode bater no banco, então protegemos com timeout acima em quem chama
    const ctx = await ensureSessionAndProfile()
    if (!ctx?.session?.user?.id) {
      throw new Error('Usuário autenticado não encontrado na sessão atual.')
    }

    const authId = ctx.session.user.id
    const perfil = ctx.perfil

    const error = !perfil ? { message: 'Perfil não encontrado', code: 'PROFILE_NOT_FOUND' } : null

    if (error) {
      const lowerMsg = getErrorMessage(error, '').toLowerCase()
      if (
        lowerMsg.includes('more than 1 row') ||
        lowerMsg.includes('multiple') ||
        error?.code === 'PGRST116' ||
        error?.code === 'PROFILE_DUPLICATED'
      ) {
        const { count } = await supabase
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('auth_user_id', authId)

        const mensagem =
          count > 1
            ? 'Foram encontrados múltiplos cadastros em public.usuarios para este id/auth.uid(). Contate o ADMIN para remover duplicidades.'
            : 'Usuário autenticado, mas sem cadastro em public.usuarios. Solicite ao ADMIN a criação do registro.'

        throw Object.assign(new Error(mensagem), { details: formatErrorDetails(error) })
      }

      throw Object.assign(
        new Error(
          `Erro na etapa Perfil (status=${error?.status ?? 'n/a'}, code=${error?.code ?? 'n/a'}): ${getErrorMessage(
            error,
            'sem detalhes'
          )}. Verifique policies RLS em public.usuarios e variáveis de ambiente Supabase.`
        ),
        { details: formatErrorDetails(error) }
      )
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
      ensureAuthListener()

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
          detalhes: { status: null, message: supabaseEnvErrorMessage, code: 'missing_supabase_env' }
        }
      }

      // 1) faz login no Auth
      const { error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: emailLimpo, password: senhaLimpa }),
        15000,
        'auth.signInWithPassword'
      )

      if (authError) {
        return {
          sucesso: false,
          etapa: 'Auth',
          mensagem: mapLoginError(authError),
          detalhes: formatErrorDetails(authError),
          precisaConfirmarEmail: isEmailConfirmationRequired(authError)
        }
      }

      // 2) espera a sessão assentar (evita AuthSessionMissingError logo após login)
      const settledSession = await withTimeout(waitForSession({ maxMs: 12000, stepMs: 300 }), 15000, 'waitForSession')
      if (!settledSession?.user?.id) {
        return {
          sucesso: false,
          etapa: 'Session',
          mensagem: 'Sessão não apareceu após login. Recarregue a página e tente novamente.',
          detalhes: { status: 401, message: 'Sessão ausente após login (waitForSession).', code: 'session_missing_after_login' }
        }
      }

      // 3) valida user no Auth server (token real)
      const u = await withTimeout(supabase.auth.getUser(), 15000, 'auth.getUser')
      if (!u?.data?.user?.id) {
        return {
          sucesso: false,
          etapa: 'Auth',
          mensagem: 'Não foi possível validar o usuário no Auth. Recarregue e tente novamente.',
          detalhes: { status: 401, message: 'auth.getUser não retornou user.', code: 'auth_get_user_missing' }
        }
      }

      // 4) carrega perfil (DB + RLS)
      const usuarioPerfil = await withTimeout(carregarPerfilUsuario(), 20000, 'carregarPerfilUsuario')

      const perfilNormalizado = normalizePerfil(usuarioPerfil.perfil)
      if (perfilNormalizado !== PERFIS.ADMIN && perfilNormalizado !== PERFIS.OPERADOR) {
        return {
          sucesso: false,
          etapa: 'Permissões',
          mensagem: `Perfil inconsistente em public.usuarios: "${usuarioPerfil.perfil || 'vazio'}". Apenas ADMIN ou OPERADOR são aceitos.`,
          detalhes: { status: 403, message: 'Perfil inválido para autorização no app.', code: 'invalid_profile_role' }
        }
      }

      usuarioPerfil.perfil = perfilNormalizado

      // 5) atualiza ultimo_acesso (não quebra login se falhar)
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

      // 6) seta store
      usuario.value = usuarioPerfil
      session.value = settledSession
      isAuthenticated.value = true
      salvarSessaoLocal(usuarioPerfil)

      return { sucesso: true }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      const errorDetalhes = error?.details || formatErrorDetails(error)
      const etapa =
        error?.message?.includes('sessão')
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
      const { error } = await withTimeout(supabase.auth.signOut(), 15000, 'auth.signOut')
      if (error) console.error('❌ Erro ao encerrar sessão no Supabase:', error.message)
    } catch (error) {
      console.error('❌ Erro no logout:', error)
    } finally {
      clearLocalSessionState()
    }
  }

  /**
   * Restaurar sessão (robusto):
   * - single-flight (não roda em paralelo)
   * - timeout
   * - só limpa tudo em casos realmente sem sessão
   */
  const restaurarSessao = async () => {
    ensureAuthListener()

    if (!hasSupabaseEnv) {
      clearLocalSessionState()
      return false
    }

    if (isAuthenticated.value && session.value?.user?.id && usuario.value?.id) {
      return true
    }

    if (restorePromise) return restorePromise

    restorePromise = (async () => {
      try {
        // 1) tenta sessão rápida
        const s = await withTimeout(supabase.auth.getSession(), 15000, 'auth.getSession')
        const userId = s?.data?.session?.user?.id ?? null

        if (!userId) {
          // Sem sessão => limpa
          clearLocalSessionState()
          return false
        }

        session.value = s.data.session
        isAuthenticated.value = true

        // 2) carrega perfil (pode bater no banco)
        const usuarioPerfil = await withTimeout(carregarPerfilUsuario(), 20000, 'carregarPerfilUsuario (restore)')

        usuario.value = usuarioPerfil
        salvarSessaoLocal(usuarioPerfil)

        return true
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error)

        // Se for timeout/rede, NÃO destrói tudo imediatamente (evita loop de logout fantasma)
        const msg = String(error?.message || error || '').toLowerCase()
        const isTimeout = msg.includes('timeout')
        const isNetwork = msg.includes('failed to fetch') || msg.includes('network') || msg.includes('cors')

        if (!isTimeout && !isNetwork) {
          clearLocalSessionState()
        }

        return false
      } finally {
        restorePromise = null
      }
    })()

    return restorePromise
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
    session,
    isAdmin,
    isTecnico,
    isOperador,
    nomeUsuario,
    emailUsuario,
    perfilUsuario,
    login,
    logout,
    restaurarSessao,
    clearLocalSessionState,
    temPermissao
  }
})
