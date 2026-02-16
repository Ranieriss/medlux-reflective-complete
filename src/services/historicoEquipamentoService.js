import { supabase } from './supabase'

/**
 * Service para gerenciar histórico de equipamentos
 * Registra eventos como manutenção, calibração, reparos, etc.
 */

// Tipos de eventos disponíveis
export const TIPOS_EVENTO = [
  { value: 'MANUTENCAO', title: 'Manutenção Preventiva', icon: 'mdi-wrench', color: 'warning' },
  { value: 'CALIBRACAO', title: 'Calibração Externa', icon: 'mdi-tune', color: 'info' },
  { value: 'RECALIBRACAO', title: 'Recalibração', icon: 'mdi-refresh', color: 'info' },
  { value: 'REPARO', title: 'Reparo/Conserto', icon: 'mdi-hammer-wrench', color: 'error' },
  { value: 'INSPECAO', title: 'Inspeção Técnica', icon: 'mdi-magnify', color: 'primary' },
  { value: 'SUBSTITUICAO_PECA', title: 'Substituição de Peça', icon: 'mdi-cog-sync', color: 'orange' },
  { value: 'LIMPEZA', title: 'Limpeza/Higienização', icon: 'mdi-broom', color: 'green' },
  { value: 'DESATIVACAO', title: 'Desativação', icon: 'mdi-power', color: 'grey' },
  { value: 'REATIVACAO', title: 'Reativação', icon: 'mdi-power-on', color: 'success' },
  { value: 'OUTROS', title: 'Outros', icon: 'mdi-file-document', color: 'grey-darken-1' }
]

// Status do equipamento
export const STATUS_EQUIPAMENTO = [
  { value: 'EM_USO', title: 'Em Uso', icon: 'mdi-check-circle', color: 'success' },
  { value: 'MANUTENCAO', title: 'Em Manutenção', icon: 'mdi-tools', color: 'warning' },
  { value: 'CALIBRACAO', title: 'Em Calibração', icon: 'mdi-tune-vertical', color: 'info' },
  { value: 'INATIVO', title: 'Inativo', icon: 'mdi-pause-circle', color: 'grey' },
  { value: 'AGUARDANDO_REPARO', title: 'Aguardando Reparo', icon: 'mdi-alert-circle', color: 'error' }
]

// Prioridades
export const PRIORIDADES = [
  { value: 'BAIXA', title: 'Baixa', color: 'info' },
  { value: 'MEDIA', title: 'Média', color: 'warning' },
  { value: 'ALTA', title: 'Alta', color: 'orange' },
  { value: 'URGENTE', title: 'Urgente', color: 'error' }
]

/**
 * Buscar histórico completo do equipamento
 */
export async function buscarHistoricoEquipamento(equipamentoId) {
  try {
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .select(`
        *,
        usuarios (
          id,
          nome,
          email
        )
      `)
      .eq('equipamento_id', equipamentoId)
      .order('data_inicio', { ascending: false })
    
    if (error) throw error
    
    console.log(`✅ ${data.length} eventos encontrados para o equipamento`)
    return data || []
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error)
    throw error
  }
}

/**
 * Registrar novo evento no equipamento
 */
export async function registrarEvento(dados) {
  try {
    const evento = {
      equipamento_id: dados.equipamento_id,
      usuario_id: dados.usuario_id,
      tipo_evento: dados.tipo_evento,
      status_equipamento: dados.status_equipamento,
      titulo: dados.titulo,
      descricao: dados.descricao,
      tecnico_responsavel: dados.tecnico_responsavel,
      empresa_servico: dados.empresa_servico,
      custo: dados.custo,
      data_inicio: dados.data_inicio || new Date().toISOString(),
      data_fim: dados.data_fim,
      previsao_retorno: dados.previsao_retorno,
      documentos_anexos: dados.documentos_anexos,
      pecas_substituidas: dados.pecas_substituidas,
      observacoes: dados.observacoes,
      prioridade: dados.prioridade || 'MEDIA',
      resolvido: dados.resolvido || false
    }
    
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .insert(evento)
      .select()
      .single()
    
    if (error) throw error
    
    // Atualizar status do equipamento se fornecido
    if (dados.status_equipamento) {
      await atualizarStatusEquipamento(dados.equipamento_id, dados.status_equipamento)
    }
    
    console.log('✅ Evento registrado:', data.id)
    return data
    
  } catch (error) {
    console.error('❌ Erro ao registrar evento:', error)
    throw error
  }
}

/**
 * Atualizar evento existente
 */
export async function atualizarEvento(eventoId, dados) {
  try {
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .update(dados)
      .eq('id', eventoId)
      .select()
      .single()
    
    if (error) throw error
    
    // Atualizar status do equipamento se fornecido
    if (dados.status_equipamento && dados.equipamento_id) {
      await atualizarStatusEquipamento(dados.equipamento_id, dados.status_equipamento)
    }
    
    console.log('✅ Evento atualizado:', eventoId)
    return data
    
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error)
    throw error
  }
}

/**
 * Marcar evento como resolvido
 */
export async function resolverEvento(eventoId, dataFim = new Date().toISOString()) {
  try {
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .update({ 
        resolvido: true,
        data_fim: dataFim
      })
      .eq('id', eventoId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Evento marcado como resolvido:', eventoId)
    return data
    
  } catch (error) {
    console.error('❌ Erro ao resolver evento:', error)
    throw error
  }
}

/**
 * Excluir evento (apenas admin)
 */
export async function excluirEvento(eventoId) {
  try {
    const { error } = await supabase
      .from('historico_equipamentos')
      .delete()
      .eq('id', eventoId)
    
    if (error) throw error
    
    console.log('✅ Evento excluído:', eventoId)
    return true
    
  } catch (error) {
    console.error('❌ Erro ao excluir evento:', error)
    throw error
  }
}

/**
 * Atualizar status do equipamento
 */
export async function atualizarStatusEquipamento(equipamentoId, status) {
  try {
    const { error } = await supabase
      .from('equipamentos')
      .update({ status })
      .eq('id', equipamentoId)
    
    if (error) throw error
    
    console.log('✅ Status do equipamento atualizado:', status)
    return true
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
    throw error
  }
}

/**
 * Buscar eventos pendentes do equipamento
 */
export async function buscarEventosPendentes(equipamentoId) {
  try {
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .select('*')
      .eq('equipamento_id', equipamentoId)
      .eq('resolvido', false)
      .order('prioridade', { ascending: false })
      .order('data_inicio', { ascending: false })
    
    if (error) throw error
    
    return data || []
    
  } catch (error) {
    console.error('❌ Erro ao buscar eventos pendentes:', error)
    throw error
  }
}

/**
 * Buscar estatísticas do equipamento
 */
export async function buscarEstatisticasEquipamento(equipamentoId) {
  try {
    const { data, error } = await supabase
      .from('historico_equipamentos')
      .select('tipo_evento, custo, resolvido')
      .eq('equipamento_id', equipamentoId)
    
    if (error) throw error
    
    const stats = {
      total_eventos: data.length,
      total_manutencoes: data.filter(e => e.tipo_evento === 'MANUTENCAO').length,
      total_calibracoes: data.filter(e => e.tipo_evento === 'CALIBRACAO' || e.tipo_evento === 'RECALIBRACAO').length,
      total_reparos: data.filter(e => e.tipo_evento === 'REPARO').length,
      eventos_pendentes: data.filter(e => !e.resolvido).length,
      custo_total: data.reduce((sum, e) => sum + (parseFloat(e.custo) || 0), 0),
      custo_medio: data.length > 0 ? data.reduce((sum, e) => sum + (parseFloat(e.custo) || 0), 0) / data.length : 0
    }
    
    return stats
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return {
      total_eventos: 0,
      total_manutencoes: 0,
      total_calibracoes: 0,
      total_reparos: 0,
      eventos_pendentes: 0,
      custo_total: 0,
      custo_medio: 0
    }
  }
}

/**
 * Helpers
 */
export function getTipoEventoConfig(tipo) {
  return TIPOS_EVENTO.find(t => t.value === tipo) || TIPOS_EVENTO[TIPOS_EVENTO.length - 1]
}

export function getStatusConfig(status) {
  return STATUS_EQUIPAMENTO.find(s => s.value === status) || STATUS_EQUIPAMENTO[0]
}

export function getPrioridadeConfig(prioridade) {
  return PRIORIDADES.find(p => p.value === prioridade) || PRIORIDADES[1]
}

export default {
  buscarHistoricoEquipamento,
  registrarEvento,
  atualizarEvento,
  resolverEvento,
  excluirEvento,
  atualizarStatusEquipamento,
  buscarEventosPendentes,
  buscarEstatisticasEquipamento,
  getTipoEventoConfig,
  getStatusConfig,
  getPrioridadeConfig,
  TIPOS_EVENTO,
  STATUS_EQUIPAMENTO,
  PRIORIDADES
}
