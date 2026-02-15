import supabase from './supabase'

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
export async function buscarEquipamentosDoUsuario(usuarioId, perfil) {
  try {
    // Admin vê todos
    if (perfil === 'administrador' || perfil === 'admin') {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('ativo', true)
        .order('codigo', { ascending: true })
      
      if (error) throw error
      
      // Enriquecer com informações de tipo
      return data.map(eq => ({
        ...eq,
        tipoDetalhado: detectarTipoEquipamento(eq.codigo)
      }))
    }
    
    // Operador: apenas vinculados ativos
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        id,
        equipamento_id,
        data_inicio,
        data_fim,
        equipamentos (
          id,
          codigo,
          nome,
          tipo,
          marca,
          modelo,
          numero_serie,
          localizacao,
          ativo
        )
      `)
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .is('data_fim', null)
    
    if (error) throw error
    
    // Mapear e enriquecer
    const equipamentos = data
      .map(v => v.equipamentos)
      .filter(eq => eq && eq.ativo)
      .map(eq => ({
        ...eq,
        tipoDetalhado: detectarTipoEquipamento(eq.codigo)
      }))
    
    console.log(`✅ Equipamentos do usuário:`, equipamentos.length)
    return equipamentos
    
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
          marca,
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
export async function validarAcessoEquipamento(usuarioId, equipamentoId, perfil) {
  // Admin sempre tem acesso
  if (perfil === 'administrador' || perfil === 'admin') {
    return true
  }
  
  // Verificar vínculo ativo
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('equipamento_id', equipamentoId)
      .eq('ativo', true)
      .is('data_fim', null)
      .single()
    
    return !error && data
    
  } catch (error) {
    return false
  }
}

export default {
  detectarTipoEquipamento,
  buscarEquipamentosDoUsuario,
  buscarVinculosAtivos,
  validarAcessoEquipamento
}
