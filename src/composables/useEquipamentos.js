/**
 * Composable para gerenciamento de equipamentos
 * Centraliza lógica de carregamento, cache e validação
 */

import { ref, computed } from 'vue'
import { buscarEquipamentosDoUsuario, validarAcessoEquipamento } from '@/services/equipamentoService'
import { useAuthStore } from '@/stores/auth'

// Cache de equipamentos (compartilhado entre componentes)
const equipamentosCache = ref([])
const lastFetch = ref(null)
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function useEquipamentos() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref(null)

  /**
   * Verifica se o cache está válido
   */
  const isCacheValid = computed(() => {
    if (!lastFetch.value) return false
    const now = Date.now()
    return (now - lastFetch.value) < CACHE_TTL
  })

  /**
   * Carrega equipamentos (com cache)
   */
  async function carregar(forceRefresh = false) {
    // Usar cache se válido e não forçar refresh
    if (!forceRefresh && isCacheValid.value && equipamentosCache.value.length > 0) {
      console.log('🎯 Cache HIT: Equipamentos')
      return { success: true, data: equipamentosCache.value, fromCache: true }
    }

    loading.value = true
    error.value = null

    try {
      const usuario = authStore.usuario?.value || authStore.usuario

      if (!usuario) {
        throw new Error('Usuário não autenticado')
      }

      console.log('⏳ Carregando equipamentos do servidor...')
      const response = await buscarEquipamentosDoUsuario(usuario.id, usuario.perfil)

      if (!response) {
        throw new Error('Resposta vazia do servidor')
      }

      // Enriquecer com informações adicionais
      const equipamentosEnriquecidos = response.map(eq => ({
        ...eq,
        nome_completo: `${eq.codigo} - ${eq.nome}`,
        descricao_tipo: eq.tipoDetalhado?.descricao || eq.nome,
        icon: eq.tipoDetalhado?.icon || 'mdi-speedometer'
      }))

      // Atualizar cache
      equipamentosCache.value = equipamentosEnriquecidos
      lastFetch.value = Date.now()

      console.log(`✅ ${equipamentosEnriquecidos.length} equipamentos carregados`)

      return { 
        success: true, 
        data: equipamentosEnriquecidos,
        fromCache: false 
      }

    } catch (err) {
      error.value = err.message
      console.error('❌ Erro ao carregar equipamentos:', err)
      return { 
        success: false, 
        error: err.message,
        data: []
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca equipamento por ID
   */
  function buscarPorId(id) {
    return equipamentosCache.value.find(eq => eq.id === id)
  }

  /**
   * Filtra equipamentos por tipo
   */
  function filtrarPorTipo(tipo) {
    return equipamentosCache.value.filter(eq => eq.tipo === tipo)
  }

  /**
   * Valida se usuário tem acesso ao equipamento
   */
  async function validarAcesso(equipamentoId) {
    const usuario = authStore.usuario?.value || authStore.usuario
    
    if (!usuario) {
      return false
    }

    return await validarAcessoEquipamento(usuario.id, equipamentoId, usuario.perfil)
  }

  /**
   * Limpa o cache
   */
  function limparCache() {
    equipamentosCache.value = []
    lastFetch.value = null
    console.log('🗑️ Cache de equipamentos limpo')
  }

  /**
   * Estatísticas do cache
   */
  const cacheStats = computed(() => ({
    size: equipamentosCache.value.length,
    lastFetch: lastFetch.value,
    isValid: isCacheValid.value,
    age: lastFetch.value ? Date.now() - lastFetch.value : null
  }))

  return {
    // State
    equipamentos: equipamentosCache,
    loading,
    error,
    
    // Computed
    isCacheValid,
    cacheStats,
    
    // Methods
    carregar,
    buscarPorId,
    filtrarPorTipo,
    validarAcesso,
    limparCache
  }
}
