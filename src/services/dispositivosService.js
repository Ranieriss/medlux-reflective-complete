/**
 * SERVIÇO DE TACHAS E TACHÕES
 * ABNT NBR 14636:2021 + NBR 15576:2015
 * 
 * Funções para gerenciar medições de dispositivos de pavimento
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
 * Criar novo dispositivo (tacha ou tachão)
 */
export async function criarDispositivo(dados) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .insert({
        codigo: dados.codigo,
        categoria: dados.categoria, // 'tacha' ou 'tachao'
        fabricante: dados.fabricante,
        modelo: dados.modelo,
        lote: dados.lote,
        tipo_corpo: dados.tipo_corpo, // Tachas: 'A-resina', 'B-plastico', 'C-metal'
        tipo_lente: dados.tipo_lente, // Tachas: 'I-polimero', 'II-polimero-anti-abrasivo', etc
        tipo_tachao: dados.tipo_tachao, // Tachões: 'I-prismas-plastico', 'II-esferas-vidro'
        cor: dados.cor,
        face: dados.face, // 'unidirecional', 'bidirecional'
        metodo_fixacao: dados.metodo_fixacao,
        geometria_observacao: dados.geometria_observacao || 0.2,
        geometria_incidencia: dados.geometria_incidencia || 0.0,
        data_medicao: dados.data_medicao,
        tecnico_responsavel: dados.tecnico_responsavel,
        equipamento_id: dados.equipamento_id,
        equipamento_fabricante: dados.equipamento_fabricante,
        equipamento_modelo: dados.equipamento_modelo,
        equipamento_serie: dados.equipamento_serie,
        numero_certificado: dados.numero_certificado,
        data_certificado: dados.data_certificado,
        validade_certificado: dados.validade_certificado,
        observacoes: dados.observacoes,
        status_final: 'pendente'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar dispositivo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adicionar leituras fotométricas
 */
export async function adicionarLeituras(dispositivoId, face, tipoMedicao, valores) {
  try {
    const uid = await ensureAuthenticatedSession()

    const leituras = valores.map((valor, index) => ({
      dispositivo_id: dispositivoId,
      face: face, // 'frontal' ou 'traseira'
      tipo_medicao: tipoMedicao, // 'inicial' ou 'pos-abrasao'
      numero_leitura: index + 1,
      valor_ri: parseFloat(valor),
      usuario_id: uid
    }))

    const { data, error } = await supabase
      .from('leituras_dispositivos')
      .insert(leituras)
      .select()

    if (error) {
      throw Object.assign(new Error('Falha ao inserir leituras de dispositivos.'), {
        diagnostic: formatSupabaseError(error, 'Erro inesperado ao inserir em leituras_dispositivos.')
      })
    }

    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('❌ Erro ao adicionar leituras:', error)
    return {
      success: false,
      error: error.message,
      diagnostic: error?.diagnostic || formatSupabaseError(error, 'Erro ao inserir leituras de dispositivos.')
    }
  }
}

/**
 * Calcular média RI (valida diferença ≤10%)
 */
export async function calcularMediaRI(dispositivoId, face = 'frontal', tipoMedicao = 'inicial') {
  try {
    const { data, error } = await supabase
      .rpc('calcular_media_ri', {
        p_dispositivo_id: dispositivoId,
        p_face: face,
        p_tipo_medicao: tipoMedicao
      })

    if (error) throw error

    return { success: true, media: data }
  } catch (error) {
    console.error('❌ Erro ao calcular média RI:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar valor mínimo normativo
 */
export async function buscarValorMinimo(categoria, tipo, cor) {
  try {
    const { data, error } = await supabase
      .rpc('buscar_valor_minimo_dispositivo', {
        p_categoria: categoria,
        p_tipo: tipo,
        p_cor: cor
      })

    if (error) throw error

    return { success: true, valor_minimo: data }
  } catch (error) {
    console.error('❌ Erro ao buscar valor mínimo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar resultados fotométricos
 */
export async function atualizarResultados(dispositivoId, dados) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .update({
        media_ri: dados.media_ri,
        valor_minimo_normativo: dados.valor_minimo_normativo,
        conformidade_ri: dados.conformidade_ri,
        ri_pos_abrasao: dados.ri_pos_abrasao,
        percentual_retencao: dados.percentual_retencao,
        conformidade_abrasao: dados.conformidade_abrasao,
        updated_at: new Date().toISOString()
      })
      .eq('id', dispositivoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao atualizar resultados:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar testes mecânicos (tachas)
 */
export async function registrarTestesMecanicos(dispositivoId, dados) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .update({
        teste_compressao_realizado: dados.teste_compressao_realizado || false,
        teste_compressao_resultado: dados.teste_compressao_resultado,
        teste_impacto_realizado: dados.teste_impacto_realizado || false,
        teste_impacto_resultado: dados.teste_impacto_resultado,
        teste_agua_realizado: dados.teste_agua_realizado || false,
        teste_agua_resultado: dados.teste_agua_resultado,
        updated_at: new Date().toISOString()
      })
      .eq('id', dispositivoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao registrar testes mecânicos:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar dimensões (tachões)
 */
export async function registrarDimensoes(dispositivoId, dimensoes) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .update({
        comprimento_mm: dimensoes.comprimento_mm,
        largura_mm: dimensoes.largura_mm,
        altura_mm: dimensoes.altura_mm,
        angulo_frontal_graus: dimensoes.angulo_frontal_graus,
        angulo_lateral_graus: dimensoes.angulo_lateral_graus,
        diametro_pino_mm: dimensoes.diametro_pino_mm,
        altura_pino_mm: dimensoes.altura_pino_mm,
        comprimento_refletivo_mm: dimensoes.comprimento_refletivo_mm,
        largura_refletiva_mm: dimensoes.largura_refletiva_mm,
        espacamento_pinos_mm: dimensoes.espacamento_pinos_mm,
        updated_at: new Date().toISOString()
      })
      .eq('id', dispositivoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao registrar dimensões:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar dimensões de tachão (10 dimensões com tolerâncias)
 */
export async function validarDimensoes(dispositivoId) {
  try {
    const { data, error } = await supabase
      .rpc('validar_dimensoes_tachao', {
        p_dispositivo_id: dispositivoId
      })

    if (error) throw error

    return { success: true, todas_conformes: data }
  } catch (error) {
    console.error('❌ Erro ao validar dimensões:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar conformidade global do dispositivo
 */
export async function validarConformidade(dispositivoId) {
  try {
    const { data, error } = await supabase
      .rpc('validar_conformidade_dispositivo', {
        p_dispositivo_id: dispositivoId
      })

    if (error) throw error

    return { success: true, conforme: data }
  } catch (error) {
    console.error('❌ Erro ao validar conformidade:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listar dispositivos
 */
export async function listarDispositivos(filtros = {}) {
  try {
    let query = supabase
      .from('dispositivos_pavimento')
      .select(`
        *,
        equipamento:equipamentos(id, codigo, nome, tipo),
        leituras:leituras_dispositivos(*)
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros.fabricante) {
      query = query.ilike('fabricante', `%${filtros.fabricante}%`)
    }

    if (filtros.cor) {
      query = query.eq('cor', filtros.cor)
    }

    if (filtros.status_final) {
      query = query.eq('status_final', filtros.status_final)
    }

    if (filtros.data_inicio) {
      query = query.gte('data_medicao', filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query = query.lte('data_medicao', filtros.data_fim)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`✅ ${data.length} dispositivos carregados`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao listar dispositivos:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar dispositivo completo
 */
export async function buscarDispositivoCompleto(dispositivoId) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .select(`
        *,
        equipamento:equipamentos(*),
        leituras:leituras_dispositivos(*)
      `)
      .eq('id', dispositivoId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar dispositivo completo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Excluir dispositivo
 */
export async function excluirDispositivo(dispositivoId) {
  try {
    const { error } = await supabase
      .from('dispositivos_pavimento')
      .delete()
      .eq('id', dispositivoId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('❌ Erro ao excluir dispositivo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar dispositivo
 */
export async function atualizarDispositivo(dispositivoId, dados) {
  try {
    const { data, error } = await supabase
      .from('dispositivos_pavimento')
      .update(dados)
      .eq('id', dispositivoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao atualizar dispositivo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obter tolerâncias dimensionais (NBR 15576:2015)
 */
export function getTolerancias() {
  return {
    comprimento: { nominal: 150, tolerancia: 5, min: 145, max: 155 },
    largura: { nominal: 250, tolerancia: 5, min: 245, max: 255 },
    altura: { nominal: 47, tolerancia: 3, min: 44, max: 50 },
    angulo_frontal: { nominal: 27, tolerancia: 3, min: 24, max: 30 },
    angulo_lateral: { nominal: 47, tolerancia: 3, min: 44, max: 50 },
    diametro_pino: { nominal: 12.7, tolerancia: 1.3, min: 11.4, max: 14.0 },
    altura_pino: { nominal: 50, tolerancia: 5, min: 45, max: 55 },
    comprimento_refletivo: { nominal: 100, tolerancia: null, min: 100, max: null },
    largura_refletiva: { nominal: 15, tolerancia: null, min: 15, max: null },
    espacamento_pinos: { nominal: 120, tolerancia: null, min: 120, max: null }
  }
}

/**
 * Listar valores mínimos normativos
 */
export async function listarValoresMinimos() {
  try {
    const { data, error } = await supabase
      .from('valores_minimos_dispositivos')
      .select('*')
      .order('categoria', { ascending: true })
      .order('tipo', { ascending: true })
      .order('cor', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao listar valores mínimos:', error)
    return { success: false, error: error.message }
  }
}

export default {
  criarDispositivo,
  adicionarLeituras,
  calcularMediaRI,
  buscarValorMinimo,
  atualizarResultados,
  registrarTestesMecanicos,
  registrarDimensoes,
  validarDimensoes,
  validarConformidade,
  listarDispositivos,
  buscarDispositivoCompleto,
  excluirDispositivo,
  atualizarDispositivo,
  getTolerancias,
  listarValoresMinimos
}
