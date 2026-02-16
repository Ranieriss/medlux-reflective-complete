/**
 * SERVIÇO DE MEDIÇÃO VERTICAL
 * ABNT NBR 15426:2020 + NBR 14644:2021
 * 
 * Funções para gerenciar medições de retrorrefletância vertical
 * em placas de sinalização viária
 */

import { supabase } from './supabase'

/**
 * Criar nova placa vertical
 */
export async function criarPlaca(dados) {
  try {
    const { data, error } = await supabase
      .from('placas_verticais')
      .insert({
        codigo_placa: dados.codigo_placa,
        rodovia: dados.rodovia,
        km: dados.km,
        sentido_trafego: dados.sentido_trafego,
        pista: dados.pista,
        lado: dados.lado,
        latitude: dados.latitude,
        longitude: dados.longitude,
        georreferenciamento_automatico: dados.georreferenciamento_automatico || false,
        classificacao_sinal: dados.classificacao_sinal,
        codigo_ctb: dados.codigo_ctb,
        tipo_pelicula: dados.tipo_pelicula,
        cores: dados.cores, // JSONB array
        data_fabricacao: dados.data_fabricacao,
        data_medicao: dados.data_medicao,
        tecnico_responsavel: dados.tecnico_responsavel,
        modo_medicao: dados.modo_medicao, // 'angulo-unico' ou 'multi-angulo'
        equipamento_id: dados.equipamento_id,
        equipamento_fabricante: dados.equipamento_fabricante,
        equipamento_modelo: dados.equipamento_modelo,
        equipamento_serie: dados.equipamento_serie,
        numero_certificado: dados.numero_certificado,
        data_emissao_certificado: dados.data_emissao_certificado,
        data_validade_certificado: dados.data_validade_certificado,
        calibracao_valida: dados.calibracao_valida || true,
        observacoes: dados.observacoes
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar placa:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Criar medição para uma cor específica
 */
export async function criarMedicaoCor(dados) {
  try {
    const { data, error } = await supabase
      .from('medicoes_cor_vertical')
      .insert({
        placa_id: dados.placa_id,
        cor: dados.cor,
        resultado_conforme: false // Será atualizado após validação
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao criar medição de cor:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adicionar geometria de medição
 */
export async function adicionarGeometria(dados) {
  try {
    const { data, error } = await supabase
      .from('geometrias_medicao_vertical')
      .insert({
        medicao_cor_id: dados.medicao_cor_id,
        angulo_observacao: dados.angulo_observacao,
        angulo_entrada: dados.angulo_entrada,
        obrigatoria: dados.obrigatoria || true,
        quantidade_leituras: dados.quantidade_leituras || 5
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao adicionar geometria:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adicionar leituras para uma geometria
 */
export async function adicionarLeituras(geometriaId, valores) {
  try {
    const leituras = valores.map((valor, index) => ({
      geometria_medicao_id: geometriaId,
      numero_leitura: index + 1,
      valor_cd_lx_m2: parseFloat(valor)
    }))

    const { data, error } = await supabase
      .from('leituras_vertical')
      .insert(leituras)
      .select()

    if (error) throw error

    return { success: true, data, count: data.length }
  } catch (error) {
    console.error('❌ Erro ao adicionar leituras:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcular média da geometria e validar
 */
export async function calcularMediaGeometria(geometriaId) {
  try {
    const { data, error } = await supabase
      .rpc('calcular_media_geometria', {
        p_geometria_id: geometriaId
      })

    if (error) throw error

    return { success: true, resultado: data }
  } catch (error) {
    console.error('❌ Erro ao calcular média da geometria:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar conformidade de uma cor (todas geometrias devem estar OK)
 */
export async function validarConformidadeCor(medicaoCorId) {
  try {
    const { data, error } = await supabase
      .rpc('validar_conformidade_cor', {
        p_medicao_cor_id: medicaoCorId
      })

    if (error) throw error

    return { success: true, conforme: data }
  } catch (error) {
    console.error('❌ Erro ao validar conformidade da cor:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validar conformidade global da placa
 */
export async function validarConformidadePlaca(placaId) {
  try {
    const { data, error } = await supabase
      .rpc('validar_conformidade_placa', {
        p_placa_id: placaId
      })

    if (error) throw error

    return { success: true, conforme: data }
  } catch (error) {
    console.error('❌ Erro ao validar conformidade da placa:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar valor mínimo normativo
 */
export async function buscarValorMinimo(tipoPelicula, cor, anguloObs, anguloEnt) {
  try {
    const { data, error } = await supabase
      .rpc('buscar_valor_minimo', {
        p_tipo_pelicula: tipoPelicula,
        p_cor: cor,
        p_angulo_observacao: anguloObs,
        p_angulo_entrada: anguloEnt
      })

    if (error) throw error

    return { success: true, valor_minimo: data }
  } catch (error) {
    console.error('❌ Erro ao buscar valor mínimo:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Registrar inspeção visual
 */
export async function registrarInspecaoVisual(placaId, dados) {
  try {
    const { data, error } = await supabase
      .from('placas_verticais')
      .update({
        defeito_descamacao: dados.defeito_descamacao || false,
        defeito_delaminacao: dados.defeito_delaminacao || false,
        defeito_descoloracao: dados.defeito_descoloracao || false,
        defeito_perfuracao: dados.defeito_perfuracao || false,
        defeito_entalhe: dados.defeito_entalhe || false,
        defeito_sujeira: dados.defeito_sujeira || false,
        observacoes_inspecao: dados.observacoes_inspecao,
        fotos_urls: dados.fotos_urls, // JSONB array
        updated_at: new Date().toISOString()
      })
      .eq('id', placaId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao registrar inspeção visual:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listar placas verticais
 */
export async function listarPlacas(filtros = {}) {
  try {
    let query = supabase
      .from('placas_verticais')
      .select(`
        *,
        equipamento:equipamentos(id, codigo, nome, tipo),
        medicoes_cor:medicoes_cor_vertical(
          *,
          geometrias:geometrias_medicao_vertical(
            *,
            leituras:leituras_vertical(*)
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filtros.rodovia) {
      query = query.ilike('rodovia', `%${filtros.rodovia}%`)
    }

    if (filtros.tipo_pelicula) {
      query = query.eq('tipo_pelicula', filtros.tipo_pelicula)
    }

    if (filtros.resultado_final) {
      query = query.eq('resultado_final', filtros.resultado_final)
    }

    if (filtros.data_inicio) {
      query = query.gte('data_medicao', filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query = query.lte('data_medicao', filtros.data_fim)
    }

    const { data, error } = await query

    if (error) throw error

    console.log(`✅ ${data.length} placas carregadas`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao listar placas:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Buscar placa completa
 */
export async function buscarPlacaCompleta(placaId) {
  try {
    const { data, error } = await supabase
      .from('placas_verticais')
      .select(`
        *,
        equipamento:equipamentos(*),
        medicoes_cor:medicoes_cor_vertical(
          *,
          geometrias:geometrias_medicao_vertical(
            *,
            leituras:leituras_vertical(*)
          )
        )
      `)
      .eq('id', placaId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao buscar placa completa:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Excluir placa
 */
export async function excluirPlaca(placaId) {
  try {
    const { error } = await supabase
      .from('placas_verticais')
      .delete()
      .eq('id', placaId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('❌ Erro ao excluir placa:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Atualizar placa
 */
export async function atualizarPlaca(placaId, dados) {
  try {
    const { data, error } = await supabase
      .from('placas_verticais')
      .update(dados)
      .eq('id', placaId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao atualizar placa:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obter geometrias obrigatórias por tipo de película
 */
export function getGeometriasObrigatorias(tipoPelicula) {
  const geometrias = {
    'I': [
      { obs: 0.2, ent: -4 }
    ],
    'II': [
      { obs: 0.2, ent: -4 }
    ],
    'III': [
      { obs: 0.2, ent: -4 }
    ],
    'VII': [
      { obs: 0.2, ent: -4 },
      { obs: 0.2, ent: 30 },
      { obs: 0.5, ent: -4 },
      { obs: 0.5, ent: 30 },
      { obs: 1.0, ent: -4 },
      { obs: 1.0, ent: 30 }
    ],
    'VIII': [
      { obs: 0.2, ent: -4 }
    ],
    'IX': [
      { obs: 0.2, ent: -4 },
      { obs: 0.2, ent: 30 },
      { obs: 0.5, ent: -4 },
      { obs: 0.5, ent: 30 },
      { obs: 1.0, ent: -4 },
      { obs: 1.0, ent: 30 }
    ],
    'X': [
      { obs: 0.2, ent: -4 },
      { obs: 0.2, ent: 30 },
      { obs: 0.5, ent: -4 },
      { obs: 0.5, ent: 30 },
      { obs: 1.0, ent: -4 },
      { obs: 1.0, ent: 30 }
    ]
  }

  return geometrias[tipoPelicula] || [{ obs: 0.2, ent: -4 }]
}

export default {
  criarPlaca,
  criarMedicaoCor,
  adicionarGeometria,
  adicionarLeituras,
  calcularMediaGeometria,
  validarConformidadeCor,
  validarConformidadePlaca,
  buscarValorMinimo,
  registrarInspecaoVisual,
  listarPlacas,
  buscarPlacaCompleta,
  excluirPlaca,
  atualizarPlaca,
  getGeometriasObrigatorias
}
