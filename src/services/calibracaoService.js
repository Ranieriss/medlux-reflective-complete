// ============================================
// MEDLUX Reflective - Serviço de Calibração
// Lógica de validação automática baseada nas normas ABNT
// ============================================

import {
  ensureSessionAndProfile,
  executeWithAuthRetry,
  supabase,
} from "./supabase";
import laudoPDFService from "./laudoPDFService";
import { NORMATIVE_REFERENCE } from "@/constants/normativeConfig";
import {
  buscarCriterioNormativo,
  calcularValidacao as calcularValidacaoNormativa,
  mensagensNormas,
} from "./normasService";
import { PERFIS, normalizePerfil } from "@/types/perfis";

/**
 * Buscar critérios de retrorrefletância
 */
export const buscarCriterios = async (filtros = {}) => {
  try {
    let query = supabase
      .from("criterios_retrorrefletancia")
      .select("*")
      .eq("ativo", true);

    if (filtros.tipo_equipamento) {
      query = query.eq("tipo_equipamento", filtros.tipo_equipamento);
    }
    if (filtros.tipo_pelicula) {
      query = query.eq("tipo_pelicula", filtros.tipo_pelicula);
    }
    if (filtros.tipo_material) {
      query = query.eq("tipo_material", filtros.tipo_material);
    }
    if (filtros.cor) {
      query = query.eq("cor", filtros.cor);
    }

    const { data, error } = await query.order("tipo_equipamento");

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao buscar critérios:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar critério específico
 */
export const buscarCriterioEspecifico = async (params) => {
  const { tipo_equipamento, tipo_pelicula, tipo_material, cor, geometria } =
    params;

  try {
    let query = supabase
      .from("criterios_retrorrefletancia")
      .select("*")
      .eq("tipo_equipamento", tipo_equipamento)
      .eq("cor", cor)
      .eq("ativo", true);

    // Filtros opcionais
    if (tipo_pelicula) {
      query = query.eq("tipo_pelicula", tipo_pelicula);
    }
    if (tipo_material) {
      query = query.eq("tipo_material", tipo_material);
    }
    if (geometria) {
      query = query.eq("geometria", geometria);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) throw error;
    if (!data) {
      return {
        success: false,
        error: "Critério não encontrado para os parâmetros informados",
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao buscar critério específico:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Resolver valor mínimo pela regra normativa dinâmica
 */
const resolverValorMinimoNormativo = (params) => {
  const { prefixo_equipamento, tipo_material, classe_pelicula } = params;

  if (prefixo_equipamento === "RH") {
    return (
      NORMATIVE_REFERENCE.RH.byMaterial[tipo_material] ||
      NORMATIVE_REFERENCE.RH.default
    );
  }

  if (prefixo_equipamento === "RV") {
    return (
      NORMATIVE_REFERENCE.RV.byClass[classe_pelicula] ||
      NORMATIVE_REFERENCE.RV.default
    );
  }

  return NORMATIVE_REFERENCE.RT.default;
};

const validarParametrosObrigatorios = (params) => {
  const faltantes = [];
  const {
    prefixo_equipamento,
    geometria,
    tipo_sinalizacao,
    tipo_material,
    modo_medicao,
    classe_pelicula,
    angulo_observacao,
    angulo_entrada,
    tipo_pelicula,
    marca_pelicula,
    momento,
    dispositivo,
    tipo_refletivo,
    valores_medicoes,
  } = params;

  if (!prefixo_equipamento) faltantes.push("prefixo do equipamento (RH/RV/RT)");
  if (!Array.isArray(valores_medicoes) || valores_medicoes.length === 0)
    faltantes.push("valores de medição");

  if (prefixo_equipamento === "RH") {
    if (!geometria) faltantes.push("geometria (15m ou 30m)");
    if (!tipo_sinalizacao) faltantes.push("tipo de sinalização");
    if (!tipo_material) faltantes.push("tipo de material horizontal");
    if (!momento) faltantes.push("momento (INICIAL/RESIDUAL)");
  }

  if (prefixo_equipamento === "RV") {
    if (!modo_medicao) faltantes.push("modo de medição vertical");
    if (!geometria) faltantes.push("geometria conforme modo selecionado");
    if (!classe_pelicula) faltantes.push("classe da película");
    if (!angulo_observacao) faltantes.push("ângulo de observação");
    if (!angulo_entrada) faltantes.push("ângulo de entrada");
    if (!tipo_pelicula) faltantes.push("tipo da película");
    if (!marca_pelicula) faltantes.push("marca da película");
  }

  if (prefixo_equipamento === "RT") {
    if (!dispositivo) faltantes.push("dispositivo (TACHA/TACHAO)");
    if (!tipo_refletivo) faltantes.push("tipo refletivo (I/II/III)");
  }

  return faltantes;
};
/**
 * Calcular validação de medições
 * Busca o critério e valida as medições
 */
export const calcularValidacao = async (params) => {
  try {
    const faltantes = validarParametrosObrigatorios(params);
    if (faltantes.length) {
      throw new Error(
        `Preencha os campos obrigatórios antes da validação: ${faltantes.join(", ")}`,
      );
    }

    const criterioResult = await buscarCriterioNormativo({
      tipo_equipamento: params.prefixo_equipamento,
      geometria: params.geometria,
      tipo_material: params.tipo_material,
      classe_pelicula: params.classe_pelicula,
      angulo_observacao: params.angulo_observacao,
      angulo_entrada: params.angulo_entrada,
      tipo_pelicula: params.tipo_pelicula,
      marca: params.marca_pelicula,
      tipo_sinalizacao: params.tipo_sinalizacao,
      momento: params.momento,
      dispositivo: params.dispositivo,
      tipo_refletivo: params.tipo_refletivo,
      direcionalidade: params.direcionalidade,
      cor: params.cor,
      norma: params.norma,
      ativo: true,
    });

    if (!criterioResult.success || !criterioResult.data) {
      const fallbackMinimo = resolverValorMinimoNormativo(params);
      if (!fallbackMinimo) {
        throw new Error(
          criterioResult.error || mensagensNormas.criterioNaoEncontrado,
        );
      }

      const tipoRegraFallback =
        params.prefixo_equipamento === "RH"
          ? "horizontal"
          : params.prefixo_equipamento === "RV"
            ? "vertical"
            : "tachas";
      const fallback = validarMedicoes(
        tipoRegraFallback,
        params.valores_medicoes,
        fallbackMinimo,
      );

      return {
        ...fallback,
        criterio_id: null,
        norma_referencia: "Fallback local (sem critério cadastrado)",
        status: fallback.status,
        criterio_nao_encontrado: true,
        alerta: criterioResult.error || mensagensNormas.criterioNaoEncontrado,
      };
    }

    const criterio = criterioResult.data;
    const resultadoNormativo = calcularValidacaoNormativa(
      { valores_medicoes: params.valores_medicoes },
      criterio,
    );

    const tipoRegra =
      params.prefixo_equipamento === "RH"
        ? "horizontal"
        : params.prefixo_equipamento === "RV"
          ? "vertical"
          : "tachas";

    const resultado = validarMedicoes(
      tipoRegra,
      params.valores_medicoes,
      criterio.valor_minimo,
    );

    return {
      ...resultado,
      status: resultado.status,
      criterio_id: criterio.id,
      norma_referencia: criterio.norma,
      criterio_metadata: criterio.metadata,
      resultado_normativo: resultadoNormativo,
    };
  } catch (error) {
    console.error("❌ Erro ao calcular validação:", error);
    throw error;
  }
};

/**
 * Validar medições de calibração
 * Retorna status, estatísticas e detalhes
 */
export const validarMedicoes = (
  tipo_equipamento,
  valores_medicoes,
  valor_minimo_referencia,
) => {
  if (!valores_medicoes || valores_medicoes.length === 0) {
    return {
      status: "INDETERMINADO",
      mensagem: "Nenhuma medição fornecida",
    };
  }

  const medicoes = valores_medicoes.map((v) => parseFloat(v));
  const quantidade_medicoes = medicoes.length;
  const valor_medio = medicoes.reduce((a, b) => a + b, 0) / quantidade_medicoes;
  const valor_minimo_medido = Math.min(...medicoes);
  const valor_maximo_medido = Math.max(...medicoes);
  const quantidade_aprovadas = medicoes.filter(
    (v) => v >= valor_minimo_referencia,
  ).length;
  const percentual_aprovacao =
    (quantidade_aprovadas / quantidade_medicoes) * 100;

  let status_validacao = "INDETERMINADO";
  let mensagem = "";
  let pontos_reprovados = [];

  // Identificar pontos reprovados
  medicoes.forEach((valor, index) => {
    if (valor < valor_minimo_referencia) {
      pontos_reprovados.push({
        ponto: index + 1,
        valor: valor,
        diferenca: (valor_minimo_referencia - valor).toFixed(2),
      });
    }
  });

  // LÓGICA DE VALIDAÇÃO POR TIPO DE EQUIPAMENTO
  if (tipo_equipamento === "vertical") {
    // PLACAS: TODAS as medições devem ser >= valor mínimo
    if (quantidade_aprovadas === quantidade_medicoes) {
      status_validacao = "APROVADO";
      mensagem = `Todas as ${quantidade_medicoes} medições estão acima do valor mínimo (${valor_minimo_referencia} cd/(lx·m²))`;
    } else {
      status_validacao = "REPROVADO";
      mensagem = `${pontos_reprovados.length} de ${quantidade_medicoes} pontos abaixo do mínimo. Critério NBR 15426: TODAS as medições devem ser aprovadas.`;
    }
  } else if (tipo_equipamento === "horizontal") {
    // TINTAS: Média >= mínimo E >= 80% dos pontos OK
    const atende_media = valor_medio >= valor_minimo_referencia;
    const atende_percentual = percentual_aprovacao >= 80;

    if (atende_media && atende_percentual) {
      status_validacao = "APROVADO";
      mensagem = `Aprovado: Média ${valor_medio.toFixed(2)} mcd/(lx·m²) (≥${valor_minimo_referencia}) e ${percentual_aprovacao.toFixed(1)}% dos pontos OK (≥80%)`;
    } else {
      status_validacao = "REPROVADO";
      if (!atende_media && !atende_percentual) {
        mensagem = `Reprovado: Média ${valor_medio.toFixed(2)} < ${valor_minimo_referencia} E apenas ${percentual_aprovacao.toFixed(1)}% dos pontos OK (< 80%)`;
      } else if (!atende_media) {
        mensagem = `Reprovado: Média ${valor_medio.toFixed(2)} < ${valor_minimo_referencia} mcd/(lx·m²)`;
      } else {
        mensagem = `Reprovado: Apenas ${percentual_aprovacao.toFixed(1)}% dos pontos OK (< 80% exigido pela NBR 14723)`;
      }
    }
  } else if (tipo_equipamento === "tachas" || tipo_equipamento === "tachoes") {
    // TACHAS: Todas as geometrias devem atender
    // (Validação específica por geometria será feita na aplicação)
    if (valor_minimo_medido >= valor_minimo_referencia) {
      status_validacao = "APROVADO";
      mensagem = `Valor mínimo medido ${valor_minimo_medido.toFixed(2)} mcd/lx ≥ ${valor_minimo_referencia} mcd/lx`;
    } else {
      status_validacao = "REPROVADO";
      mensagem = `Valor mínimo medido ${valor_minimo_medido.toFixed(2)} < ${valor_minimo_referencia} mcd/lx (NBR 14636)`;
    }
  }

  // Verificar se está em ATENÇÃO (aprovado mas próximo ao limite)
  if (status_validacao === "APROVADO") {
    const margem_seguranca = valor_minimo_referencia * 1.1; // 10% acima do mínimo
    if (valor_minimo_medido < margem_seguranca) {
      status_validacao = "ATENÇÃO";
      mensagem += ` ⚠️ ATENÇÃO: Valor mínimo muito próximo ao limite. Considere monitoramento frequente.`;
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
    pontos_reprovados,
  };
};

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
      observacoes,
    } = dados;

    // 1. Buscar equipamento para determinar tipo
    const { data: equipamento, error: equipError } = await executeWithAuthRetry(
      "registrarCalibracao:buscar_equipamento",
      async () =>
        supabase
          .from("equipamentos")
          .select("tipo")
          .eq("id", equipamento_id)
          .single(),
    );

    if (equipError) throw equipError;

    const tipo_equipamento = equipamento.tipo.toLowerCase();

    // 2. Buscar critério de referência
    const {
      success: critSuccess,
      data: criterio,
      error: critError,
    } = await buscarCriterioEspecifico({
      tipo_equipamento,
      tipo_pelicula,
      tipo_material,
      cor: cor_medicao,
      geometria: geometria_medicao,
    });

    if (!critSuccess) {
      throw new Error(critError || "Critério de validação não encontrado");
    }

    // 3. Validar medições
    const validacao = validarMedicoes(
      tipo_equipamento,
      valores_medicoes,
      criterio.valor_minimo,
    );

    // 4. Calcular próxima calibração (12 meses a partir da data de calibração)
    const proxima_calibracao = new Date(data_calibracao);
    proxima_calibracao.setFullYear(proxima_calibracao.getFullYear() + 1);

    // 5. Inserir registro de calibração
    const ctx = await ensureSessionAndProfile();

    const { data: calibracao, error: insError } = await executeWithAuthRetry(
      "registrarCalibracao:insert",
      async () =>
        supabase
          .from("historico_calibracoes")
          .insert([
            {
              equipamento_id,
              criado_por_auth_user_id: ctx?.user?.id || null,
              criado_por_usuario_id: ctx?.perfil?.id || null,
              data_calibracao,
              proxima_calibracao: proxima_calibracao
                .toISOString()
                .split("T")[0],
              tipo_pelicula,
              tipo_material,
              cor_medicao,
              geometria_medicao,
              valores_medicoes,
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
              fotos_medicao: fotos_medicao
                ? JSON.stringify(fotos_medicao)
                : null,
              observacoes: observacoes || validacao.mensagem,
              resultado: validacao.status,
            },
          ])
          .select(),
    );

    if (insError) throw insError;

    // 6. Atualizar equipamento com data da última calibração
    const { error: updateError } = await executeWithAuthRetry(
      "registrarCalibracao:update_equipamento",
      async () =>
        supabase
          .from("equipamentos")
          .update({
            data_ultima_calibracao: data_calibracao,
            proxima_calibracao: proxima_calibracao.toISOString().split("T")[0],
          })
          .eq("id", equipamento_id),
    );

    if (updateError)
      console.warn("⚠️ Erro ao atualizar equipamento:", updateError);

    console.log("✅ Calibração registrada:", calibracao[0].id);
    return {
      success: true,
      data: calibracao[0],
      validacao,
    };
  } catch (error) {
    console.error("❌ Erro ao registrar calibração:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar histórico de calibrações
 */
export const buscarHistoricoCalibracao = async (equipamento_id) => {
  try {
    const { data, error } = await supabase
      .from("historico_calibracoes")
      .select("*")
      .eq("equipamento_id", equipamento_id)
      .order("data_calibracao", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao buscar histórico:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar status de calibração de todos os equipamentos
 */
export const buscarStatusCalibracao = async () => {
  try {
    const { data, error } = await supabase
      .from("vw_calibracoes_status")
      .select("*")
      .order("status_vencimento", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao buscar status de calibração:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar estatísticas de calibração para dashboard
 */
export const buscarEstatisticasCalibracao = async () => {
  try {
    const { data, error } = await supabase
      .from("vw_dashboard_calibracoes")
      .select("*")
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Opções de tipos de película (Sinalização Vertical)
 */
export const tiposPelicula = [
  { title: "Tipo I - Lentes Esféricas", value: "Tipo I" },
  { title: "Tipo II - Microprismática", value: "Tipo II" },
  { title: "Tipo III - Microprismática Alta Intensidade", value: "Tipo III" },
  { title: "Tipo IV - Microprismática Alta Intensidade", value: "Tipo IV" },
  { title: "Tipo V - Ultra-Alta Intensidade", value: "Tipo V" },
  { title: "Tipo VII - Alta Intensidade", value: "Tipo VII" },
  { title: "Tipo VIII - Alto Desempenho", value: "Tipo VIII" },
];

/**
 * Opções de tipos de material (Sinalização Horizontal)
 */
export const tiposMaterial = [
  { title: "Tinta Convencional", value: "Tinta Convencional" },
  { title: "Termoplástico", value: "Termoplástico" },
  { title: "Tinta à Base d'Água", value: "Tinta à Base d'Água" },
  { title: "Tinta à Base Solvente", value: "Tinta à Base Solvente" },
  {
    title: "Plástico Pré-Fabricado Tipo I",
    value: "Plástico Pré-Fabricado Tipo I",
  },
  {
    title: "Plástico Pré-Fabricado Tipo II",
    value: "Plástico Pré-Fabricado Tipo II",
  },
];

/**
 * Opções de cores
 */
export const coresMedicao = [
  { title: "Branco", value: "Branco" },
  { title: "Amarelo", value: "Amarelo" },
  { title: "Vermelho", value: "Vermelho" },
  { title: "Verde", value: "Verde" },
  { title: "Azul", value: "Azul" },
  { title: "Marrom", value: "Marrom" },
];

/**
 * Opções de geometrias por tipo de equipamento
 */
export const geometriasPorTipo = {
  vertical: [{ title: "0,2° / -4° (Padrão NBR 15426)", value: "0,2°/-4°" }],
  horizontal: [
    { title: "15m / 1,5° (NBR 14723)", value: "15m/1,5°" },
    { title: "30m / 1,0° (NBR 16410)", value: "30m/1,0°" },
  ],
  tachas: [
    { title: "0,2° / 0° (Frontal)", value: "0,2°/0°" },
    { title: "0,2° / 20° (Inclinação)", value: "0,2°/20°" },
  ],
};

/**
 * Quantidade de medições recomendada por tipo
 */
export const quantidadeMedicoesRecomendada = {
  vertical: 5, // NBR 15426: 5 pontos
  horizontal: 10, // NBR 14723: mínimo 10 pontos
  tachas: 2, // NBR 14636: ambas geometrias
  tachoes: 1, // NBR 15576: mínimo 1
};

/**
 * Gerar laudo PDF de medição
 */
export const gerarLaudoPDF = async (calibracaoId) => {
  try {
    // Buscar dados completos da calibração
    const { data: calibracao, error } = await supabase
      .from("vw_calibracoes_status")
      .select("*")
      .eq("calibracao_id", calibracaoId)
      .single();

    if (error) throw error;
    if (!calibracao) throw new Error("Calibração não encontrada");

    // Buscar valores de medições
    const { data: historico, error: errorHistorico } = await supabase
      .from("historico_calibracoes")
      .select("*")
      .eq("id", calibracaoId)
      .single();

    if (errorHistorico) throw errorHistorico;

    // Mesclar dados
    const dadosCompletos = {
      ...calibracao,
      valores_medicoes: historico.valores_medicoes || [],
      temperatura_ambiente: historico.temperatura_ambiente,
      umidade_relativa: historico.umidade_relativa,
      observacoes: historico.observacoes,
      condicoes_medicao: historico.condicoes_medicao,
    };

    // Gerar PDF
    const resultado = await laudoPDFService.gerarLaudo(dadosCompletos);

    return { success: true, ...resultado };
  } catch (error) {
    console.error("❌ Erro ao gerar laudo PDF:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Listar calibrações com filtros
 * @param {Object} filtros - Filtros opcionais (equipamento_id, status, data_inicio, data_fim, usuario_id)
 * @param {Object} usuario - Dados do usuário logado (opcional, para filtrar por operador)
 * @returns {Promise<Array>} Lista de calibrações
 */
export const listarCalibracoes = async (filtros = {}, usuario = null) => {
  try {
    // Se for operador, buscar apenas medições dos equipamentos vinculados
    if (usuario && normalizePerfil(usuario.perfil) === PERFIS.OPERADOR) {
      // Buscar IDs dos equipamentos vinculados
      const { data: vinculos, error: vincError } = await executeWithAuthRetry(
        "listarCalibracoes:vinculos",
        async () =>
          supabase
            .from("vinculos")
            .select("equipamento_id")
            .eq("usuario_id", usuario.id)
            .eq("ativo", true),
      );

      if (vincError) throw vincError;

      const equipamentosIds = [
        ...new Set(
          (vinculos || []).map((v) => v.equipamento_id).filter(Boolean),
        ),
      ];

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (equipamentosIds.length === 0 && !authUser?.id) {
        console.log(
          "⚠️ Operador sem equipamentos vinculados e sem auth uid disponível",
        );
        return [];
      }

      // Buscar calibrações apenas desses equipamentos
      const baseSelect = `
        *,
        equipamentos (
          id,
          codigo,
          nome,
          tipo
        )
      `;

      let data = [];

      if (equipamentosIds.length > 0) {
        let query = supabase
          .from("historico_calibracoes")
          .select(baseSelect)
          .in("equipamento_id", equipamentosIds)
          .order("data_calibracao", { ascending: false });

        if (filtros.status) {
          query = query.eq("status_validacao", filtros.status);
        }
        if (filtros.data_inicio) {
          query = query.gte("data_calibracao", filtros.data_inicio);
        }
        if (filtros.data_fim) {
          query = query.lte("data_calibracao", filtros.data_fim);
        }

        const response = await executeWithAuthRetry(
          "listarCalibracoes:operador_vinculos",
          async () => query,
        );
        if (response.error) throw response.error;
        data = response.data || [];
      }

      if (authUser?.id) {
        let ownQuery = supabase
          .from("historico_calibracoes")
          .select(baseSelect)
          .eq("criado_por_auth_user_id", authUser.id)
          .order("data_calibracao", { ascending: false });

        // Aplicar outros filtros
        if (filtros.status)
          ownQuery = ownQuery.eq("status_validacao", filtros.status);
        if (filtros.data_inicio)
          ownQuery = ownQuery.gte("data_calibracao", filtros.data_inicio);
        if (filtros.data_fim)
          ownQuery = ownQuery.lte("data_calibracao", filtros.data_fim);

        const ownResponse = await executeWithAuthRetry(
          "listarCalibracoes:operador_proprias",
          async () => ownQuery,
        );
        if (ownResponse.error && ownResponse.error.code !== "42703") {
          throw ownResponse.error;
        }

        const merged = [...data, ...(ownResponse.data || [])];
        const dedupe = new Map(merged.map((item) => [item.id, item]));
        data = Array.from(dedupe.values()).sort(
          (a, b) => new Date(b.data_calibracao) - new Date(a.data_calibracao),
        );
      }

      console.log(`✅ ${data?.length || 0} calibrações carregadas (operador)`);
      return data || [];
    }

    // Admin/Técnico vê todas as calibrações
    let query = supabase
      .from("historico_calibracoes")
      .select(
        `
        *,
        equipamentos (
          id,
          codigo,
          nome,
          tipo
        )
      `,
      )
      .order("data_calibracao", { ascending: false });

    // Aplicar filtros
    if (filtros.equipamento_id) {
      query = query.eq("equipamento_id", filtros.equipamento_id);
    }
    if (filtros.status) {
      query = query.eq("status_validacao", filtros.status);
    }
    if (filtros.data_inicio) {
      query = query.gte("data_calibracao", filtros.data_inicio);
    }
    if (filtros.data_fim) {
      query = query.lte("data_calibracao", filtros.data_fim);
    }

    const { data, error } = await executeWithAuthRetry(
      "listarCalibracoes:admin",
      async () => query,
    );

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} calibrações carregadas`);
    return data || [];
  } catch (error) {
    console.error("❌ Erro ao listar calibrações:", error);
    throw error;
  }
};

/**
 * Obter calibração específica por ID
 * @param {string} calibracaoId - ID da calibração
 * @returns {Promise<Object>} Dados da calibração
 */
export const obterCalibracao = async (calibracaoId) => {
  try {
    const { data, error } = await supabase
      .from("historico_calibracoes")
      .select(
        `
        *,
        equipamentos (
          id,
          codigo,
          nome,
          tipo,
          fabricante,
          modelo
        )
      `,
      )
      .eq("id", calibracaoId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("❌ Erro ao obter calibração:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Obter estatísticas de calibrações
 * @returns {Promise<Object>} Estatísticas (em_dia, atencao, vencidas, etc.)
 */
export const obterEstatisticas = async (usuario = null) => {
  try {
    let query = supabase
      .from("historico_calibracoes")
      .select(
        "equipamento_id, status_validacao, percentual_aprovacao, proxima_calibracao",
      )
      .order("data_calibracao", { ascending: false });

    // Se for operador, filtrar apenas medições dos equipamentos vinculados
    if (usuario && normalizePerfil(usuario.perfil) === PERFIS.OPERADOR) {
      const { data: vinculos, error: vincError } = await supabase
        .from("vinculos")
        .select("equipamento_id")
        .eq("usuario_id", usuario.id)
        .eq("ativo", true);

      if (vincError) throw vincError;

      const equipamentosIds = vinculos.map((v) => v.equipamento_id);

      if (equipamentosIds.length === 0) {
        return {
          total: 0,
          em_dia: 0,
          atencao: 0,
          vencidas: 0,
          aprovadas: 0,
          reprovadas: 0,
          media_aprovacao: 0,
        };
      }

      query = query.in("equipamento_id", equipamentosIds);
    }

    const { data: calibracoes, error } = await query;

    if (error) throw error;

    const hoje = new Date().toISOString().split("T")[0];
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);
    const em30DiasStr = em30Dias.toISOString().split("T")[0];

    const stats = {
      total: calibracoes.length,
      em_dia: 0,
      atencao: 0,
      vencidas: 0,
      aprovadas: 0,
      reprovadas: 0,
      media_aprovacao: 0,
    };

    let somaAprovacao = 0;

    calibracoes.forEach((cal) => {
      // Status de validação
      if (cal.status_validacao === "APROVADO") {
        stats.aprovadas++;
      } else if (cal.status_validacao === "REPROVADO") {
        stats.reprovadas++;
      }

      // Status de vencimento
      if (cal.proxima_calibracao) {
        if (cal.proxima_calibracao < hoje) {
          stats.vencidas++;
        } else if (cal.proxima_calibracao <= em30DiasStr) {
          stats.atencao++;
        } else {
          stats.em_dia++;
        }
      }

      // Soma para média
      if (cal.percentual_aprovacao) {
        somaAprovacao += parseFloat(cal.percentual_aprovacao);
      }
    });

    // Calcular média
    stats.media_aprovacao =
      stats.total > 0 ? Math.round(somaAprovacao / stats.total) : 0;

    console.log("📊 Estatísticas calculadas:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    return {
      total: 0,
      em_dia: 0,
      atencao: 0,
      vencidas: 0,
      aprovadas: 0,
      reprovadas: 0,
      media_aprovacao: 0,
    };
  }
};

// Export default com todos os métodos
export default {
  buscarCriterios,
  buscarCriterioEspecifico,
  validarMedicoes,
  calcularValidacao,
  registrarCalibracao,
  listarCalibracoes,
  obterCalibracao,
  obterEstatisticas,
  gerarLaudoPDF,
  tiposPelicula,
  tiposMaterial,
  coresMedicao,
  geometriasPorTipo,
  quantidadeMedicoesRecomendada,
};
