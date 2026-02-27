import { executeWithAuthRetry, supabase } from './supabase'

const friendlyMissingCriteria = 'Critério normativo não cadastrado para esta combinação. Solicite cadastro na tabela de normas.'

const normalize = (value) => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const pickMinimoFromResponse = (data) => {
  if (data === null || data === undefined) return null

  if (typeof data === 'number') return data

  if (Array.isArray(data)) {
    if (!data.length) return null
    return pickMinimoFromResponse(data[0])
  }

  if (typeof data === 'object') {
    const candidateKeys = ['valor_minimo', 'minimo', 'criterio_minimo', 'resultado', 'value']
    for (const key of candidateKeys) {
      if (key in data && toNumber(data[key]) !== null) {
        return toNumber(data[key])
      }
    }

    for (const value of Object.values(data)) {
      const parsed = toNumber(value)
      if (parsed !== null) return parsed
    }
  }

  return toNumber(data)
}

const mapTipoEquipamento = (prefixo, tipoEquipamento) => {
  if (prefixo === 'RH') return 'horizontal'
  if (prefixo === 'RV') return 'vertical'
  if (prefixo === 'RT') return 'dispositivos'

  const normalized = normalize(tipoEquipamento)?.toLowerCase() || null
  if (normalized === 'tachas' || normalized === 'tachoes' || normalized === 'tachões') return 'dispositivos'
  return normalized
}

const buildHorizontalArgs = (params) => ({
  p_geometria: normalize(params.geometria),
  p_material: normalize(params.tipo_material),
  p_cor: normalize(params.cor),
  p_momento: normalize(params.momento) || 'INICIAL'
})

const buildVerticalArgs = (params) => ({
  p_classe_pelicula: normalize(params.classe_pelicula),
  p_angulo_observacao: normalize(params.angulo_observacao),
  p_angulo_entrada: normalize(params.angulo_entrada),
  p_cor: normalize(params.cor)
})

const buildDispositivoArgs = (params) => ({
  p_dispositivo: normalize(params.dispositivo),
  p_cor: normalize(params.cor),
  p_tipo_refletivo: normalize(params.tipo_refletivo),
  p_direcionalidade: normalize(params.direcionalidade),
  p_geometria: normalize(params.geometria)
})

const getRpcConfigByTipo = (tipoEquipamento) => {
  if (tipoEquipamento === 'horizontal') {
    return {
      rpc: 'get_criterio_horizontal_minimo',
      argsBuilder: buildHorizontalArgs,
      metadataBuilder: (params) => ({
        tipo_equipamento: 'horizontal',
        geometria: normalize(params.geometria),
        tipo_material: normalize(params.tipo_material),
        cor: normalize(params.cor),
        momento: normalize(params.momento)
      })
    }
  }

  if (tipoEquipamento === 'vertical') {
    return {
      rpc: 'get_criterio_vertical_minimo',
      argsBuilder: buildVerticalArgs,
      metadataBuilder: (params) => ({
        tipo_equipamento: 'vertical',
        classe_pelicula: normalize(params.classe_pelicula),
        angulo_observacao: normalize(params.angulo_observacao),
        angulo_entrada: normalize(params.angulo_entrada),
        cor: normalize(params.cor)
      })
    }
  }

  if (tipoEquipamento === 'dispositivos') {
    return {
      rpc: 'get_criterio_dispositivo_minimo',
      argsBuilder: buildDispositivoArgs,
      metadataBuilder: (params) => ({
        tipo_equipamento: 'dispositivos',
        dispositivo: normalize(params.dispositivo),
        cor: normalize(params.cor),
        tipo_refletivo: normalize(params.tipo_refletivo),
        direcionalidade: normalize(params.direcionalidade),
        geometria: normalize(params.geometria)
      })
    }
  }

  return null
}

export async function buscarCriterioNormativo(params = {}) {
  const tipoEquipamento = mapTipoEquipamento(params.tipo_equipamento, params.tipoEquipamento)
  if (!tipoEquipamento) {
    return { success: false, error: 'Tipo de equipamento inválido para consulta normativa.' }
  }

  const config = getRpcConfigByTipo(tipoEquipamento)
  if (!config) {
    return { success: false, error: `Tipo de equipamento sem RPC mapeada: ${tipoEquipamento}` }
  }

  const rpcArgs = config.argsBuilder(params)
  const { data, error } = await executeWithAuthRetry(`buscarCriterioNormativo:${config.rpc}`, async () =>
    supabase.rpc(config.rpc, rpcArgs)
  )

  if (error) {
    return { success: false, error: error.message, details: error }
  }

  const valorMinimo = pickMinimoFromResponse(data)
  if (valorMinimo === null) {
    return { success: false, error: friendlyMissingCriteria, code: 'CRITERIO_NAO_CADASTRADO' }
  }

  return {
    success: true,
    data: {
      id: null,
      valor_minimo: valorMinimo,
      unidade: 'cd/(lx·m²)',
      norma: normalize(params.norma) || 'Norma não informada',
      metadata: config.metadataBuilder(params),
      raw: data
    }
  }
}

export function calcularValidacao(medicao = {}, criterio = {}) {
  const valores = Array.isArray(medicao.valores_medicoes)
    ? medicao.valores_medicoes.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    : []

  if (!valores.length) {
    return {
      status: 'INDETERMINADO',
      justificativa: 'Não há valores válidos para validar.',
      media: null,
      minimo_norma: criterio.valor_minimo ?? null,
      unidade: criterio.unidade ?? null
    }
  }

  const media = valores.reduce((sum, value) => sum + value, 0) / valores.length
  const minimo = Number(criterio.valor_minimo)
  const minimoValido = Number.isFinite(minimo)

  if (!minimoValido) {
    return {
      status: 'ALERTA',
      justificativa: 'Critério sem valor mínimo numérico configurado.',
      media: Number(media.toFixed(2)),
      minimo_norma: criterio.valor_minimo ?? null,
      unidade: criterio.unidade ?? null
    }
  }

  const status = media >= minimo ? 'CONFORME' : 'NAO_CONFORME'
  return {
    status,
    justificativa: status === 'CONFORME'
      ? `Média ${media.toFixed(2)} acima do mínimo ${minimo.toFixed(2)}.`
      : `Média ${media.toFixed(2)} abaixo do mínimo ${minimo.toFixed(2)}.`,
    media: Number(media.toFixed(2)),
    minimo_norma: minimo,
    unidade: criterio.unidade ?? 'cd/(lx·m²)',
    norma: criterio.norma ?? null
  }
}

export const mensagensNormas = {
  criterioNaoEncontrado: friendlyMissingCriteria
}

export default {
  buscarCriterioNormativo,
  calcularValidacao,
  mensagensNormas
}
