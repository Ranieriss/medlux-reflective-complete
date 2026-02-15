import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validarLogin } from '@/services/db'

export const useAuthStore = defineStore('auth', () => {
  // State
  const usuario = ref(null)
  const isAuthenticated = ref(false)

  // Getters
  const isAdmin = computed(() => usuario.value?.perfil === 'admin')
  const isTecnico = computed(() => usuario.value?.perfil === 'tecnico')
  const nomeUsuario = computed(() => usuario.value?.nome || 'Usuário')
  const emailUsuario = computed(() => usuario.value?.email || '')

  // Actions
  const login = async (email, senha) => {
    try {
      const resultado = await validarLogin(email, senha)
      
      if (resultado.sucesso) {
        usuario.value = resultado.usuario
        isAuthenticated.value = true
        
        // Salvar no localStorage
        localStorage.setItem('medlux_auth', JSON.stringify(resultado.usuario))
        
        return { sucesso: true }
      } else {
        return { sucesso: false, mensagem: resultado.mensagem }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { sucesso: false, mensagem: 'Erro ao realizar login' }
    }
  }

  const logout = () => {
    usuario.value = null
    isAuthenticated.value = false
    localStorage.removeItem('medlux_auth')
  }

  const restaurarSessao = () => {
    const authData = localStorage.getItem('medlux_auth')
    if (authData) {
      try {
        usuario.value = JSON.parse(authData)
        isAuthenticated.value = true
        return true
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error)
        logout()
        return false
      }
    }
    return false
  }

  const temPermissao = (permissao) => {
    if (!usuario.value) return false
    
    // Admin tem todas as permissões
    if (usuario.value.perfil === 'admin') return true
    
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
