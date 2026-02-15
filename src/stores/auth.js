import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const isAuthenticated = ref(false)
  const session = ref(null)

  // Getters
  const isAdmin = computed(() => usuario.value?.perfil === 'administrador' || usuario.value?.perfil === 'admin')
  const isTecnico = computed(() => usuario.value?.perfil === 'tecnico')
  const nomeUsuario = computed(() => usuario.value?.nome || 'Usuário')
  const emailUsuario = computed(() => usuario.value?.email || '')

  // Actions
  const login = async (email, senha) => {
    try {
      // Buscar usuário no Supabase
      const { data: usuarios, error: errorBusca } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single()

      if (errorBusca) {
        console.error('Erro ao buscar usuário:', errorBusca)
        return { sucesso: false, mensagem: 'Usuário não encontrado ou inativo' }
      }

      // Verificar senha (temporariamente comparação simples)
      if (usuarios.senha_hash !== senha) {
        return { sucesso: false, mensagem: 'Senha incorreta' }
      }

      // Atualizar último acesso
      await supabase
        .from('usuarios')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuarios.id)

      // Definir usuário e autenticação
      usuario.value = usuarios
      isAuthenticated.value = true

      // Salvar no localStorage
      localStorage.setItem('medlux_auth', JSON.stringify(usuarios))
      
      console.log('✅ Login realizado com sucesso:', usuarios.email)
      return { sucesso: true }

    } catch (error) {
      console.error('❌ Erro no login:', error)
      return { sucesso: false, mensagem: 'Erro ao realizar login' }
    }
  }

  const logout = async () => {
    try {
      usuario.value = null
      isAuthenticated.value = false
      session.value = null
      localStorage.removeItem('medlux_auth')
      
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ Erro no logout:', error)
    }
  }

  const restaurarSessao = async () => {
    const authData = localStorage.getItem('medlux_auth')
    if (authData) {
      try {
        const usuarioSalvo = JSON.parse(authData)
        
        // Verificar se usuário ainda existe e está ativo
        const { data: usuarioAtual, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', usuarioSalvo.id)
          .eq('ativo', true)
          .single()

        if (error || !usuarioAtual) {
          console.warn('⚠️ Sessão expirada ou usuário inativo')
          logout()
          return false
        }

        usuario.value = usuarioAtual
        isAuthenticated.value = true
        
        console.log('✅ Sessão restaurada:', usuarioAtual.email)
        return true
      } catch (error) {
        console.error('❌ Erro ao restaurar sessão:', error)
        logout()
        return false
      }
    }
    return false
  }

  const temPermissao = (permissao) => {
    if (!usuario.value) return false
    
    // Admin/Administrador tem todas as permissões
    if (usuario.value.perfil === 'admin' || usuario.value.perfil === 'administrador') return true
    
    // Técnicos têm permissões limitadas
    const permissoesTecnico = [
      'ver_equipamentos',
      'ver_vinculos',
      'ver_calibracoes'
    ]
    
    return permissoesTecnico.includes(permissao)
  }

  return {
    // State
    usuario,
    isAuthenticated,
    
    // Getters
    isAdmin,
    isTecnico,
    nomeUsuario,
    emailUsuario,
    
    // Actions
    login,
    logout,
    restaurarSessao,
    temPermissao
  }
})
