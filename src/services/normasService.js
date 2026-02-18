import { supabase } from './supabase'

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

const mapTipoEquipamento = (prefixo, tipoEquipamento) => {
  if (prefixo === 'RH') return 'horizontal'
  if (prefixo === 'RV') return 'vertical'
  if (prefixo === 'RT') return 'tachas'
  return normalize(tipoEquipamento)?.toLowerCase() || null
}

export async function buscarCriterioNormativo(params = {}) {
  const tipoEquipamento = mapTipoEquipamento(params.tipo_equipamento, params.tipoEquipamento)
  if (!tipoEquipamento) {
    return { success: false, error: 'Tipo de equipamento inválido para consulta normativa.' }
  }

  const filtros = {
    tipo_equipamento: tipoEquipamento,
    geometria: normalize(params.geometria),
    tipo_material: normalize(params.tipo_material),
    tipo_pelicula: normalize(params.tipo_pelicula),
    classe_pelicula: normalize(params.classe_pelicula),
    marca: normalize(params.marca),
    tipo_sinalizacao: normalize(params.tipo_sinalizacao),
    cor: normalize(params.cor),
    norma: normalize(params.norma),
    ativo: params.ativo ?? true
  }

  const queryCriteria = async ({ table, fields, normaField }) => {
    let query = supabase
      .from(table)
      .select('*')
      .eq(fields.tipoEquipamento, filtros.tipo_equipamento)
      .eq(fields.ativo, filtros.ativo)

    if (filtros.cor) query = query.eq(fields.cor, filtros.cor)
    if (filtros.geometria) query = query.eq(fields.geometria, filtros.geometria)
    if (filtros.tipo_material) query = query.eq(fields.tipoMaterial, filtros.tipo_material)
    if (filtros.tipo_pelicula) query = query.eq(fields.tipoPelicula, filtros.tipo_pelicula)
    if (filtros.norma) query = query.eq(normaField, filtros.norma)

    return query.limit(1).maybeSingle()
  }

  const mapRecord = ({ data, table }) => {
    if (!data) return null
    if (table === 'norma_criterios_validacao') {
      return {
        ...data,
        norma_referencia: data.norma_referencia ?? data.norma,
        valor_minimo: data.valor_minimo,
        tipo_equipamento: data.tipo_equipamento,
        tipo_material: data.tipo_material,
        tipo_pelicula: data.tipo_pelicula
      }
    }
    return data
  }

  const primary = await queryCriteria({
    table: 'criterios_retrorrefletancia',
    fields: {
      tipoEquipamento: 'tipo_equipamento',
      ativo: 'ativo',
      cor: 'cor',
      geometria: 'geometria',
      tipoMaterial: 'tipo_material',
      tipoPelicula: 'tipo_pelicula'
    },
    normaField: 'norma_referencia'
  })

  let data = mapRecord({ data: primary.data, table: 'criterios_retrorrefletancia' })
  let error = primary.error

  if (!data) {
    const fallback = await queryCriteria({
      table: 'norma_criterios_validacao',
      fields: {
        tipoEquipamento: 'tipo_equipamento',
        ativo: 'ativo',
        cor: 'cor',
        geometria: 'geometria',
        tipoMaterial: 'tipo_material',
        tipoPelicula: 'tipo_pelicula'
      },
      normaField: 'norma_referencia'
    })

    if (fallback.data) {
      data = mapRecord({ data: fallback.data, table: 'norma_criterios_validacao' })
      error = null
    } else if (!error) {
      error = fallback.error
    }
  }

  if (error) {
    return { success: false, error: error.message, details: error }
  }

  if (!data) {
    return { success: false, error: friendlyMissingCriteria, code: 'CRITERIO_NAO_CADASTRADO' }
  }

  return {
    success: true,
    data: {
      id: data.id,
      valor_minimo: toNumber(data.valor_minimo),
      unidade: data.unidade || 'cd/(lx·m²)',
      norma: data.norma_referencia || 'Norma não informada',
      metadata: {
        tipo_equipamento: data.tipo_equipamento,
        geometria: data.geometria,
        tipo_material: data.tipo_material,
        tipo_pelicula: data.tipo_pelicula,
        cor: data.cor,
        observacoes: data.observacoes
      },
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
