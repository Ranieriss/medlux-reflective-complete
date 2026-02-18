/**
 * SERVIÇO DE MEDIÇÃO HORIZONTAL
 * ABNT NBR 14723:2020
 * 
 * Funções para gerenciar medições de retrorrefletância horizontal
 * em marcações viárias (sinalizações de piso)
 */

import { supabase } from './supabase'

function formatSupabaseError(error, fallback) {
  return {
    code: error?.code || null,
    message: error?.message || fallback,
    details: error?.details || null,
    hint: error?.hint || null
  }
}

async function ensureAuthenticatedSession() {
  const { data, error } = await supabase.auth.getSession()
  const uid = data?.session?.user?.id || null

  if (error || !uid) {
    throw Object.assign(new Error('Sessão inválida. Faça login novamente.'), {
      diagnostic: formatSupabaseError(error, 'Sessão não encontrada para a operação de escrita.'),
      code: 'SESSION_INVALID'
    })
  }

  return uid
}

/**
 * Criar novo trecho de medição
 */
export async function criarTrecho(dados) {
  try {
    const { data, error } = await supabase
      .from('trechos_medicao')
      .insert({
        rodovia: dados.rodovia,
        km_inicial: dados.km_inicial,
        km_final: dados.km_final,
        sentido_trafego: dados.sentido_trafego,
        pista: dados.pista,
        tipo_marcacao: dados.tipo_marcacao,
        cor: dados.cor,
        largura_faixa: dados.largura_faixa,
        data_aplicacao: dados.data_aplicacao,
        data_medicao: dados.data_medicao,
        tipo_retrorrefletancia: dados.tipo_retrorrefletancia,
        tecnico_responsavel: dados.tecnico_responsavel,
        equipamento_id: dados.equipamento_id,
        equipamento_fabricante: dados.equipamento_fabricante,
        equipamento_modelo: dados.equipamento_modelo,
        equipamento_serie: dados.equipamento_serie,
        numero_certificado: dados.numero_certificado,
        data_certificado: dados.data_certificado,
        validade_certificado: dados.validade_certificado,
        geometria_medicao: dados.geometria_medicao,
        observacoes: dados.observacoes
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar trecho:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Criar segmento dentro de um trecho
 */
export async function criarSegmento(dados) {
  try {
    const { data, error } = await supabase
      .from('segmentos_medicao')
      .insert({
        trecho_id: dados.trecho_id,
        numero_segmento: dados.numero_segmento,
        extensao_metros: dados.extensao_metros,
        quantidade_estacoes: dados.quantidade_estacoes
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar segmento:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Criar estação de medição
 */
export async function criarEstacao(dados) {
  try {
    const { data, error } = await supabase
      .from('estacoes_medicao')
      .insert({
        segmento_id: dados.segmento_id,
        numero_estacao: dados.numero_estacao,
        km_localizacao: dados.km_localizacao,
        quantidade_leituras: dados.quantidade_leituras || 10
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar estação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adicionar leitura individual
 */
export async function adicionarLeitura(dados) {
  try {
    const uid = await ensureAuthenticatedSession()

    const { data, error } = await supabase
      .from('leituras_medicao')
      .insert({
        estacao_id: dados.estacao_id,
        numero_leitura: dados.numero_leitura,
        valor_mcd: dados.valor_mcd ?? dados.valor_ri,
        espacamento_metros: dados.espacamento_metros || 0.5,
        excluida_calculo: dados.excluida_calculo ?? false,
        observacoes: dados.observacoes || null,
        usuario_id: uid
      })
      .select()
      .single()

    if (error) {
      throw Object.assign(new Error('Falha ao inserir leitura horizontal.'), {
        diagnostic: formatSupabaseError(error, 'Erro inesperado ao inserir em leituras_medicao.')
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao adicionar leitura:', error)
    return {
      success: false,
      error: error.message,
      diagnostic: error?.diagnostic || formatSupabaseError(error, 'Erro ao inserir leitura horizontal.')
    }
  }
}

/**
 * Adicionar múltiplas leituras de uma vez
 */
export async function adicionarLeituras(estacaoId, valores) {
  try {
    const uid = await ensureAuthenticatedSession()

    const leituras = valores.map((valor, index) => ({
      estacao_id: estacaoId,
      numero_leitura: index + 1,
      valor_mcd: parseFloat(valor),
      espacamento_metros: 0.5,
      excluida_calculo: false,
      observacoes: null,
      usuario_id: uid
    }))

    const { data, error } = await supabase
      .from('leituras_medicao')
      .insert(leituras)
      .select()

    if (error) {
      throw Object.assign(new Error('Falha ao inserir leituras horizontais.'), {
        diagnostic: formatSupabaseError(error, 'Erro inesperado ao inserir em lote em leituras_medicao.')
      })
    }

    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('❌ Erro ao adicionar leituras:', error)
    return {
      success: false,
      error: error.message,
      diagnostic: error?.diagnostic || formatSupabaseError(error, 'Erro ao inserir leituras horizontais.')
    }
  }
}

/**
 * Calcular resultado da estação (remove max/min, calcula média)
 */
export async function calcularResultadoEstacao(estacaoId) {
  try {
    const { data, error } = await supabase
      .rpc('calcular_resultado_estacao', {
        p_estacao_id: estacaoId
      })

    if (error) throw error

    return { success: true, resultado: data }
  } catch (error) {
    console.error('❌ Erro ao calcular resultado da estação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcular resultado do segmento (média das estações)
 */
export async function calcularResultadoSegmento(segmentoId) {
  try {
    const { data, error } = await supabase
      .rpc('calcular_resultado_segmento', {
        p_segmento_id: segmentoId
      })

    if (error) throw error

    return { success: true, resultado: data }
  } catch (error) {
    console.error('❌ Erro ao calcular resultado do segmento:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar condições de medição
 */
export async function registrarCondicoes(dados) {
  try {
    const { data, error } = await supabase
      .from('condicoes_medicao_horizontal')
      .insert({
        trecho_id: dados.trecho_id,
        superficie_seca: dados.superficie_seca,
        sem_pedras_detritos: dados.sem_pedras_detritos,
        equipamento_apoiado: dados.equipamento_apoiado,
        alinhado_trafego: dados.alinhado_trafego,
        sem_luz_externa: dados.sem_luz_externa,
        observacoes_condicoes: dados.observacoes_condicoes
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao registrar condições:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar condições de medição (certificado + condições ambientais)
 */
export async function validarCondicoes(trechoId) {
  try {
    const { data, error } = await supabase
      .rpc('validar_condicoes_medicao', {
        p_trecho_id: trechoId
      })

    if (error) throw error

    return { success: true, valido: data }
  } catch (error) {
    console.error('❌ Erro ao validar condições:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listar trechos de medição
 */
export async function listarTrechos(filtros = {}) {
  try {
    let query = supabase
      .from('trechos_medicao')
      .select(`
        *,
        equipamento:equipamentos(id, codigo, nome, tipo),
        segmentos:segmentos_medicao(
          id,
          numero_segmento,
          extensao_metros,
          resultado_medio,
          estacoes:estacoes_medicao(
            id,
            numero_estacao,
            quantidade_leituras,
            resultado_medio
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filtros.rodovia) {
      query = query.ilike('rodovia', `%${filtros.rodovia}%`)
    }

    if (filtros.data_inicio) {
      query = query.gte('data_medicao', filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query = query.lte('data_medicao', filtros.data_fim)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`✅ ${data.length} trechos carregados`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao listar trechos:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar trecho completo (com segmentos, estações e leituras)
 */
export async function buscarTrechoCompleto(trechoId) {
  try {
    const { data, error } = await supabase
      .from('trechos_medicao')
      .select(`
        *,
        equipamento:equipamentos(*),
        condicoes:condicoes_medicao_horizontal(*),
        segmentos:segmentos_medicao(
          *,
          estacoes:estacoes_medicao(
            *,
            leituras:leituras_medicao(*)
          )
        )
      `)
      .eq('id', trechoId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar trecho completo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Excluir trecho (cascade deleta segmentos, estações e leituras)
 */
export async function excluirTrecho(trechoId) {
  try {
    const { error } = await supabase
      .from('trechos_medicao')
      .delete()
      .eq('id', trechoId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('❌ Erro ao excluir trecho:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar trecho
 */
export async function atualizarTrecho(trechoId, dados) {
  try {
    const { data, error } = await supabase
      .from('trechos_medicao')
      .update(dados)
      .eq('id', trechoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao atualizar trecho:', error)
    return { success: false, error: error.message }
  }
}

export default {
  criarTrecho,
  criarSegmento,
  criarEstacao,
  adicionarLeitura,
  adicionarLeituras,
  calcularResultadoEstacao,
  calcularResultadoSegmento,
  registrarCondicoes,
  validarCondicoes,
  listarTrechos,
  buscarTrechoCompleto,
  excluirTrecho,
  atualizarTrecho
}
