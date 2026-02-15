// ============================================
// MEDLUX Reflective - Serviço de Calibração
// Lógica de validação automática baseada nas normas ABNT
// ============================================

import { supabase } from './supabase'

/**
 * Buscar critérios de retrorrefletância
 */
export const buscarCriterios = async (filtros = {}) => {
  try {
    let query = supabase
      .from('criterios_retrorrefletancia')
      .select('*')
      .eq('ativo', true)

    if (filtros.tipo_equipamento) {
      query = query.eq('tipo_equipamento', filtros.tipo_equipamento)
    }
    if (filtros.tipo_pelicula) {
      query = query.eq('tipo_pelicula', filtros.tipo_pelicula)
    }
    if (filtros.tipo_material) {
      query = query.eq('tipo_material', filtros.tipo_material)
    }
    if (filtros.cor) {
      query = query.eq('cor', filtros.cor)
    }

    const { data, error } = await query.order('tipo_equipamento')

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar critérios:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar critério específico
 */
export const buscarCriterioEspecifico = async (params) => {
  const { tipo_equipamento, tipo_pelicula, tipo_material, cor, geometria } = params

  try {
    let query = supabase
      .from('criterios_retrorrefletancia')
      .select('*')
      .eq('tipo_equipamento', tipo_equipamento)
      .eq('cor', cor)
      .eq('ativo', true)

    // Filtros opcionais
    if (tipo_pelicula) {
      query = query.eq('tipo_pelicula', tipo_pelicula)
    }
    if (tipo_material) {
      query = query.eq('tipo_material', tipo_material)
    }
    if (geometria) {
      query = query.eq('geometria', geometria)
    }

    const { data, error } = await query.limit(1).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Critério não encontrado para os parâmetros informados' }
      }
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar critério específico:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar medições de calibração
 * Retorna status, estatísticas e detalhes
 */
export const validarMedicoes = (tipo_equipamento, valores_medicoes, valor_minimo_referencia) => {
  if (!valores_medicoes || valores_medicoes.length === 0) {
    return {
      status: 'INDETERMINADO',
      mensagem: 'Nenhuma medição fornecida'
    }
  }

  const medicoes = valores_medicoes.map(v => parseFloat(v))
  const quantidade_medicoes = medicoes.length
  const valor_medio = medicoes.reduce((a, b) => a + b, 0) / quantidade_medicoes
  const valor_minimo_medido = Math.min(...medicoes)
  const valor_maximo_medido = Math.max(...medicoes)
  const quantidade_aprovadas = medicoes.filter(v => v >= valor_minimo_referencia).length
  const percentual_aprovacao = (quantidade_aprovadas / quantidade_medicoes) * 100

  let status_validacao = 'INDETERMINADO'
  let mensagem = ''
  let pontos_reprovados = []

  // Identificar pontos reprovados
  medicoes.forEach((valor, index) => {
    if (valor < valor_minimo_referencia) {
      pontos_reprovados.push({
        ponto: index + 1,
        valor: valor,
        diferenca: (valor_minimo_referencia - valor).toFixed(2)
      })
    }
  })

  // LÓGICA DE VALIDAÇÃO POR TIPO DE EQUIPAMENTO
  if (tipo_equipamento === 'vertical') {
    // PLACAS: TODAS as medições devem ser >= valor mínimo
    if (quantidade_aprovadas === quantidade_medicoes) {
      status_validacao = 'APROVADO'
      mensagem = `Todas as ${quantidade_medicoes} medições estão acima do valor mínimo (${valor_minimo_referencia} cd/(lx·m²))`
    } else {
      status_validacao = 'REPROVADO'
      mensagem = `${pontos_reprovados.length} de ${quantidade_medicoes} pontos abaixo do mínimo. Critério NBR 15426: TODAS as medições devem ser aprovadas.`
    }
  } else if (tipo_equipamento === 'horizontal') {
    // TINTAS: Média >= mínimo E >= 80% dos pontos OK
    const atende_media = valor_medio >= valor_minimo_referencia
    const atende_percentual = percentual_aprovacao >= 80

    if (atende_media && atende_percentual) {
      status_validacao = 'APROVADO'
      mensagem = `Aprovado: Média ${valor_medio.toFixed(2)} mcd/(lx·m²) (≥${valor_minimo_referencia}) e ${percentual_aprovacao.toFixed(1)}% dos pontos OK (≥80%)`
    } else {
      status_validacao = 'REPROVADO'
      if (!atende_media && !atende_percentual) {
        mensagem = `Reprovado: Média ${valor_medio.toFixed(2)} < ${valor_minimo_referencia} E apenas ${percentual_aprovacao.toFixed(1)}% dos pontos OK (< 80%)`
      } else if (!atende_media) {
        mensagem = `Reprovado: Média ${valor_medio.toFixed(2)} < ${valor_minimo_referencia} mcd/(lx·m²)`
      } else {
        mensagem = `Reprovado: Apenas ${percentual_aprovacao.toFixed(1)}% dos pontos OK (< 80% exigido pela NBR 14723)`
      }
    }
  } else if (tipo_equipamento === 'tachas' || tipo_equipamento === 'tachoes') {
    // TACHAS: Todas as geometrias devem atender
    // (Validação específica por geometria será feita na aplicação)
    if (valor_minimo_medido >= valor_minimo_referencia) {
      status_validacao = 'APROVADO'
      mensagem = `Valor mínimo medido ${valor_minimo_medido.toFixed(2)} mcd/lx ≥ ${valor_minimo_referencia} mcd/lx`
    } else {
      status_validacao = 'REPROVADO'
      mensagem = `Valor mínimo medido ${valor_minimo_medido.toFixed(2)} < ${valor_minimo_referencia} mcd/lx (NBR 14636)`
    }
  }

  // Verificar se está em ATENÇÃO (aprovado mas próximo ao limite)
  if (status_validacao === 'APROVADO') {
    const margem_seguranca = valor_minimo_referencia * 1.1 // 10% acima do mínimo
    if (valor_minimo_medido < margem_seguranca) {
      status_validacao = 'ATENÇÃO'
      mensagem += ` ⚠️ ATENÇÃO: Valor mínimo muito próximo ao limite. Considere monitoramento frequente.`
    }
  }

  return {
    status: status_validacao,
    mensagem,
    valor_medio: parseFloat(valor_medio.toFixed(2)),
    valor_minimo_medido: parseFloat(valor_minimo_medido.toFixed(2)),
    valor_maximo_medido: parseFloat(valor_maximo_medido.toFixed(2)),
    valor_minimo_referencia,
    quantidade_medicoes,
    quantidade_aprovadas,
    percentual_aprovacao: parseFloat(percentual_aprovacao.toFixed(2)),
    pontos_reprovados
  }
}

/**
 * Registrar nova calibração
 */
export const registrarCalibracao = async (dados) => {
  try {
    const {
      equipamento_id,
      tipo_pelicula,
      tipo_material,
      cor_medicao,
      geometria_medicao,
      valores_medicoes,
      data_calibracao,
      certificado_numero,
      certificado_pdf_url,
      laboratorio,
      tecnico_responsavel,
      condicoes_medicao,
      temperatura_ambiente,
      umidade_relativa,
      fotos_medicao,
      observacoes
    } = dados

    // 1. Buscar equipamento para determinar tipo
    const { data: equipamento, error: equipError } = await supabase
      .from('equipamentos')
      .select('tipo')
      .eq('id', equipamento_id)
      .single()

    if (equipError) throw equipError

    const tipo_equipamento = equipamento.tipo.toLowerCase()

    // 2. Buscar critério de referência
    const { success: critSuccess, data: criterio, error: critError } = await buscarCriterioEspecifico({
      tipo_equipamento,
      tipo_pelicula,
      tipo_material,
      cor: cor_medicao,
      geometria: geometria_medicao
    })

    if (!critSuccess) {
      throw new Error(critError || 'Critério de validação não encontrado')
    }

    // 3. Validar medições
    const validacao = validarMedicoes(
      tipo_equipamento,
      valores_medicoes,
      criterio.valor_minimo
    )

    // 4. Calcular próxima calibração (12 meses a partir da data de calibração)
    const proxima_calibracao = new Date(data_calibracao)
    proxima_calibracao.setFullYear(proxima_calibracao.getFullYear() + 1)

    // 5. Inserir registro de calibração
    const { data: calibracao, error: insError } = await supabase
      .from('historico_calibracoes')
      .insert([{
        equipamento_id,
        data_calibracao,
        proxima_calibracao: proxima_calibracao.toISOString().split('T')[0],
        tipo_pelicula,
        tipo_material,
        cor_medicao,
        geometria_medicao,
        valores_medicoes: JSON.stringify(valores_medicoes),
        valor_medio: validacao.valor_medio,
        valor_minimo_medido: validacao.valor_minimo_medido,
        valor_maximo_medido: validacao.valor_maximo_medido,
        valor_minimo_referencia: validacao.valor_minimo_referencia,
        quantidade_medicoes: validacao.quantidade_medicoes,
        quantidade_aprovadas: validacao.quantidade_aprovadas,
        percentual_aprovacao: validacao.percentual_aprovacao,
        status_validacao: validacao.status,
        norma_referencia: criterio.norma_referencia,
        certificado_numero,
        certificado_pdf_url,
        laboratorio,
        tecnico_responsavel,
        condicoes_medicao,
        temperatura_ambiente,
        umidade_relativa,
        fotos_medicao: fotos_medicao ? JSON.stringify(fotos_medicao) : null,
        observacoes: observacoes || validacao.mensagem,
        resultado: validacao.status
      }])
      .select()

    if (insError) throw insError

    // 6. Atualizar equipamento com data da última calibração
    const { error: updateError } = await supabase
      .from('equipamentos')
      .update({
        data_ultima_calibracao: data_calibracao,
        proxima_calibracao: proxima_calibracao.toISOString().split('T')[0]
      })
      .eq('id', equipamento_id)

    if (updateError) console.warn('⚠️ Erro ao atualizar equipamento:', updateError)

    console.log('✅ Calibração registrada:', calibracao[0].id)
    return {
      success: true,
      data: calibracao[0],
      validacao
    }
  } catch (error) {
    console.error('❌ Erro ao registrar calibração:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar histórico de calibrações
 */
export const buscarHistoricoCalibracao = async (equipamento_id) => {
  try {
    const { data, error } = await supabase
      .from('historico_calibracoes')
      .select('*')
      .eq('equipamento_id', equipamento_id)
      .order('data_calibracao', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar status de calibração de todos os equipamentos
 */
export const buscarStatusCalibracao = async () => {
  try {
    const { data, error } = await supabase
      .from('vw_calibracoes_status')
      .select('*')
      .order('status_vencimento', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar status de calibração:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar estatísticas de calibração para dashboard
 */
export const buscarEstatisticasCalibracao = async () => {
  try {
    const { data, error } = await supabase
      .from('vw_dashboard_calibracoes')
      .select('*')
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Opções de tipos de película (Sinalização Vertical)
 */
export const tiposPelicula = [
  { title: 'Tipo I - Lentes Esféricas', value: 'Tipo I' },
  { title: 'Tipo II - Microprismática', value: 'Tipo II' },
  { title: 'Tipo III - Microprismática Alta Intensidade', value: 'Tipo III' },
  { title: 'Tipo IV - Microprismática Alta Intensidade', value: 'Tipo IV' },
  { title: 'Tipo V - Ultra-Alta Intensidade', value: 'Tipo V' },
  { title: 'Tipo VII - Alta Intensidade', value: 'Tipo VII' },
  { title: 'Tipo VIII - Alto Desempenho', value: 'Tipo VIII' }
]

/**
 * Opções de tipos de material (Sinalização Horizontal)
 */
export const tiposMaterial = [
  { title: 'Tinta Convencional', value: 'Tinta Convencional' },
  { title: 'Termoplástico', value: 'Termoplástico' },
  { title: 'Tinta à Base d\'Água', value: 'Tinta à Base d\'Água' },
  { title: 'Tinta à Base Solvente', value: 'Tinta à Base Solvente' },
  { title: 'Plástico Pré-Fabricado Tipo I', value: 'Plástico Pré-Fabricado Tipo I' },
  { title: 'Plástico Pré-Fabricado Tipo II', value: 'Plástico Pré-Fabricado Tipo II' }
]

/**
 * Opções de cores
 */
export const coresMedicao = [
  { title: 'Branco', value: 'Branco' },
  { title: 'Amarelo', value: 'Amarelo' },
  { title: 'Vermelho', value: 'Vermelho' },
  { title: 'Verde', value: 'Verde' },
  { title: 'Azul', value: 'Azul' },
  { title: 'Marrom', value: 'Marrom' }
]

/**
 * Opções de geometrias por tipo de equipamento
 */
export const geometriasPorTipo = {
  vertical: [
    { title: '0,2° / -4° (Padrão NBR 15426)', value: '0,2°/-4°' }
  ],
  horizontal: [
    { title: '15m / 1,5° (NBR 14723)', value: '15m/1,5°' },
    { title: '30m / 1,0° (NBR 16410)', value: '30m/1,0°' }
  ],
  tachas: [
    { title: '0,2° / 0° (Frontal)', value: '0,2°/0°' },
    { title: '0,2° / 20° (Inclinação)', value: '0,2°/20°' }
  ]
}

/**
 * Quantidade de medições recomendada por tipo
 */
export const quantidadeMedicoesRecomendada = {
  vertical: 5,   // NBR 15426: 5 pontos
  horizontal: 10, // NBR 14723: mínimo 10 pontos
  tachas: 2,      // NBR 14636: ambas geometrias
  tachoes: 1      // NBR 15576: mínimo 1
}
