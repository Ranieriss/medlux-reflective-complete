import { executeWithAuthRetry, supabase } from './supabase'
import { PERFIS, normalizePerfil } from '@/types/perfis'

/**
 * Detecta o tipo de equipamento baseado no código
 * RHxx-H15 = Horizontal 15m
 * RHxx-H30 = Horizontal 30m
 * RVxx-V1 = Vertical Ângulo Único
 * RVxx-VM = Vertical Multi-Ângulo
 * RTxx = Tachas/Tachões
 */
export function detectarTipoEquipamento(codigo) {
  if (!codigo) return null
  
  const codigoUpper = codigo.toUpperCase()
  
  // Horizontal
  if (codigoUpper.includes('RH') && codigoUpper.includes('H15')) {
    return {
      tipo: 'horizontal',
      subtipo: '15m',
      geometrias: ['15m/1,5°'],
      descricao: 'Retrorrefletômetro Horizontal 15m',
      quantidadeMedicoes: 10,
      icon: 'mdi-road'
    }
  }
  
  if (codigoUpper.includes('RH') && (codigoUpper.includes('H30') || codigoUpper.includes('HM'))) {
    return {
      tipo: 'horizontal',
      subtipo: '30m',
      geometrias: ['30m/1,0°'],
      descricao: 'Retrorrefletômetro Horizontal 30m (Mini)',
      quantidadeMedicoes: 10,
      simuladorChuva: true,
      icon: 'mdi-road-variant'
    }
  }
  
  // Vertical
  if (codigoUpper.includes('RV') && codigoUpper.includes('V1')) {
    return {
      tipo: 'vertical',
      subtipo: 'angulo-unico',
      geometrias: ['0,2°/-4°'],
      descricao: 'Retrorrefletômetro Vertical Ângulo Único',
      quantidadeMedicoes: 5,
      icon: 'mdi-sign-pole'
    }
  }
  
  if (codigoUpper.includes('RV') && codigoUpper.includes('VM')) {
    return {
      tipo: 'vertical',
      subtipo: 'multi-angulo',
      geometrias: ['0,2°/-4°', '0,5°/-4°', '1,0°/-4°'],
      descricao: 'Retrorrefletômetro Vertical Multi-Ângulo',
      quantidadeMedicoes: 5,
      icon: 'mdi-sign-direction'
    }
  }
  
  // Tachas e Tachões
  if (codigoUpper.includes('RT')) {
    return {
      tipo: 'tachas',
      subtipo: 'tachas-tachoes',
      geometrias: ['0,2°/0°', '0,2°/20°'],
      descricao: 'Retrorrefletômetro para Tachas e Tachões',
      quantidadeMedicoes: 2,
      icon: 'mdi-circle-outline'
    }
  }
  
  // Padrão - tentar pelo tipo armazenado
  return {
    tipo: 'vertical',
    subtipo: 'generico',
    geometrias: ['0,2°/-4°'],
    descricao: 'Retrorrefletômetro (Genérico)',
    quantidadeMedicoes: 5,
    icon: 'mdi-speedometer'
  }
}

/**
 * Busca equipamentos baseado no perfil do usuário
 * - Admin: todos os equipamentos
 * - Operador: apenas equipamentos vinculados
 */
export async function buscarEquipamentosDoUsuario(usuarioId = null, perfil = null) {
  try {
    const role = normalizePerfil(perfil)

    if (role === PERFIS.OPERADOR && usuarioId) {
      const { data: vinculos, error: vincError } = await executeWithAuthRetry('buscarEquipamentosDoUsuario:vinculos', async () =>
        supabase
          .from('vinculos')
          .select('equipamento_id')
          .eq('usuario_id', usuarioId)
          .eq('ativo', true)
      )

      if (vincError) throw vincError
      const ids = [...new Set((vinculos || []).map((item) => item.equipamento_id).filter(Boolean))]
      if (!ids.length) return []

      const { data, error } = await executeWithAuthRetry('buscarEquipamentosDoUsuario:equipamentos_vinculados', async () =>
        supabase
          .from('equipamentos')
          .select('*')
          .in('id', ids)
          .order('codigo', { ascending: true })
      )

      if (error) throw error

      return (data || []).map(eq => ({
        ...eq,
        tipoDetalhado: detectarTipoEquipamento(eq.codigo)
      }))
    }

    const { data, error } = await executeWithAuthRetry('buscarEquipamentosDoUsuario:todos', async () =>
      supabase
        .from('equipamentos')
        .select('*')
        .order('codigo', { ascending: true })
    )

    if (error) throw error

    return (data || []).map(eq => ({
      ...eq,
      tipoDetalhado: detectarTipoEquipamento(eq.codigo)
    }))
  } catch (error) {
    console.error('❌ Erro ao buscar equipamentos:', error)
    return []
  }
}

/**
 * Busca vínculos ativos de um operador
 */
export async function buscarVinculosAtivos(usuarioId) {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        equipamentos (
          id,
          codigo,
          nome,
          tipo,
          fabricante,
          modelo
        )
      `)
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .is('data_fim', null)
      .order('data_inicio', { ascending: false })
    
    if (error) throw error
    return data || []
    
  } catch (error) {
    console.error('❌ Erro ao buscar vínculos ativos:', error)
    return []
  }
}

/**
 * Valida se usuário tem acesso ao equipamento
 */
export async function validarAcessoEquipamento(usuarioId, equipamentoId) {
  // Verificar vínculo ativo
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('equipamento_id', equipamentoId)
      .eq('ativo', true)
      .is('data_fim', null)
      .maybeSingle()

    if (error) {
      const lowerMessage = (error.message || '').toLowerCase()
      if (lowerMessage.includes('multiple') || lowerMessage.includes('more than 1 row')) {
        throw new Error('Foram encontrados vínculos duplicados para este usuário e equipamento. Contate o administrador.')
      }
      throw error
    }
    
    return !error && data
    
  } catch (error) {
    return false
  }
}

/**
 * Lista equipamentos para telas que precisam de listagem simples
 */
export async function listar() {
  const { data, error } = await supabase
    .from('equipamentos')
    .select('*')
    .order('codigo', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export default {
  detectarTipoEquipamento,
  listar,
  buscarEquipamentosDoUsuario,
  buscarVinculosAtivos,
  validarAcessoEquipamento
}
