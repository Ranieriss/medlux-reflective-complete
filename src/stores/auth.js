import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

const STORAGE_KEY = 'medlux_auth'

function getErrorMessage(error, fallback) {
  return error?.message || fallback
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const isAuthenticated = ref(false)
  const session = ref(null)

  // Getters
  const isAdmin = computed(() => usuario.value?.perfil === 'administrador' || usuario.value?.perfil === 'admin')
  const isTecnico = computed(() => usuario.value?.perfil === 'tecnico')
  const isOperador = computed(() => usuario.value?.perfil === 'operador')
  const nomeUsuario = computed(() => usuario.value?.nome || 'Usuário')
  const emailUsuario = computed(() => usuario.value?.email || '')
  const perfilUsuario = computed(() => usuario.value?.perfil || 'operador')

  const salvarSessaoLocal = (dadosUsuario) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: dadosUsuario.id,
      email: dadosUsuario.email,
      nome: dadosUsuario.nome,
      perfil: dadosUsuario.perfil,
      ativo: dadosUsuario.ativo
    }))
  }

  const limparSessaoLocal = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  const carregarPerfilUsuario = async ({ userId, email }) => {
    let query = supabase
      .from('usuarios')
      .select('id, email, nome, perfil, ativo')

    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email)
    } else {
      throw new Error('Identificador de usuário ausente para carregar perfil.')
    }

    const { data, error } = await query.single()

    if (error) {
      throw new Error(getErrorMessage(error, 'Não foi possível carregar perfil do usuário.'))
    }

    if (!data?.ativo) {
      throw new Error('Usuário inativo. Entre em contato com o administrador.')
    }

    return data
  }

  // Actions
  const login = async (email, senha) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      })

      if (authError) {
        return { sucesso: false, mensagem: getErrorMessage(authError, 'Credenciais inválidas.') }
      }

      const usuarioPerfil = await carregarPerfilUsuario({
        userId: authData?.user?.id,
        email: authData?.user?.email || email
      })

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuarioPerfil.id)

      if (updateError) {
        console.warn('⚠️ Não foi possível atualizar último acesso:', updateError.message)
      }

      usuario.value = usuarioPerfil
      session.value = authData.session
      isAuthenticated.value = true
      salvarSessaoLocal(usuarioPerfil)

      return { sucesso: true }
    } catch (error) {
      console.error('❌ Erro no login:', error)
      return { sucesso: false, mensagem: getErrorMessage(error, 'Erro ao realizar login.') }
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
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new Error(getErrorMessage(error, 'Não foi possível verificar a sessão.'))
      }

      const currentSession = data?.session
      if (!currentSession?.user) {
        await logout()
        return false
      }

      session.value = currentSession

      const usuarioPerfil = await carregarPerfilUsuario({
        userId: currentSession.user.id,
        email: currentSession.user.email
      })

      usuario.value = usuarioPerfil
      isAuthenticated.value = true
      salvarSessaoLocal(usuarioPerfil)
      return true
    } catch (error) {
      console.error('❌ Erro ao restaurar sessão:', error)
      await logout()
      return false
    }
  }

  const temPermissao = (permissao) => {
    if (!usuario.value) return false

    if (usuario.value.perfil === 'admin' || usuario.value.perfil === 'administrador') return true

    const permissoesTecnico = [
      'ver_equipamentos',
      'ver_vinculos',
      'ver_calibracoes',
      'criar_medicoes'
    ]

    const permissoesOperador = [
      'ver_equipamentos_vinculados',
      'criar_medicoes',
      'ver_medicoes'
    ]

    if (usuario.value.perfil === 'tecnico') {
      return permissoesTecnico.includes(permissao)
    }

    if (usuario.value.perfil === 'operador') {
      return permissoesOperador.includes(permissao)
    }

    return false
  }

  return {
    // State
    usuario,
    isAuthenticated,

    // Getters
    isAdmin,
    isTecnico,
    isOperador,
    nomeUsuario,
    emailUsuario,
    perfilUsuario,

    // Actions
    login,
    logout,
    restaurarSessao,
    temPermissao
  }
})
