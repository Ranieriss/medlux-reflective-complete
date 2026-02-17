import { supabase } from './supabase'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

/**
 * Serviço de Relatórios de Medições de Retrorrefletância
 * Sistema completo de emissão de relatórios com filtros avançados
 */
class RelatorioMedicoesService {


  pdfDepsPromise = null

  async carregarDependenciasPDF() {
    if (!this.pdfDepsPromise) {
      this.pdfDepsPromise = Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]).then(([jspdfModule, autoTableModule]) => {
        const jsPDF = jspdfModule.default

        if (typeof autoTableModule.applyPlugin === 'function') {
          autoTableModule.applyPlugin(jsPDF)
        }

        return { jsPDF }
      })
    }

    return this.pdfDepsPromise
  }

  /**
   * Dados da empresa para cabeçalho dos relatórios
   */
  dadosEmpresa = {
    razaoSocial: 'I.C.D. Indústria, Comércio e Distribuição de Materiais para Infraestrutura Viária Ltda.',
    cnpj: '10.954.989/0001-26',
    inscricaoEstadual: '255.893.574',
    endereco: 'Rua Juliano Lucchi, 118 – Jardim Eldorado - Palhoça - SC - CEP 88.133-540',
    telefone: '(48) 2106-3022',
    site: 'www.icdvias.com.br',
    slogan: 'TECNOLOGIA EM MATERIAIS A SERVIÇO DA VIDA!',
  }

  /**
   * Buscar medições com filtros avançados
   */
  async buscarMedicoes(filtros = {}) {
    try {
      let query = supabase
        .from('vw_calibracoes_status')
        .select(`
          *,
          historico:historico_calibracoes!inner(
            valores_medicoes,
            temperatura_ambiente,
            umidade_relativa,
            observacoes,
            condicoes_medicao,
            tecnico_responsavel,
            created_at
          )
        `)

      // Filtro por tipo de equipamento
      if (filtros.tipo_equipamento) {
        query = query.eq('equipamento_tipo', filtros.tipo_equipamento)
      }

      // Filtro por equipamento específico
      if (filtros.equipamento_id) {
        query = query.eq('equipamento_id', filtros.equipamento_id)
      }

      // Filtro por status de validação
      if (filtros.status_validacao) {
        query = query.eq('status_validacao', filtros.status_validacao)
      }

      // Filtro por status de vencimento
      if (filtros.status_vencimento) {
        query = query.eq('status_vencimento', filtros.status_vencimento)
      }

      // Filtro por técnico responsável
      if (filtros.tecnico_responsavel) {
        query = query.eq('historico.tecnico_responsavel', filtros.tecnico_responsavel)
      }

      // Filtro por data inicial
      if (filtros.data_inicio) {
        query = query.gte('data_calibracao', filtros.data_inicio)
      }

      // Filtro por data final
      if (filtros.data_fim) {
        query = query.lte('data_calibracao', filtros.data_fim)
      }

      query = query.order('data_calibracao', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao buscar medições:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Gerar Relatório Global (todas as medições)
   */
  async gerarRelatorioGlobal(filtros = {}, formato = 'pdf') {
    try {
      const resultado = await this.buscarMedicoes(filtros)
      
      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      const medicoes = resultado.data

      if (medicoes.length === 0) {
        throw new Error('Nenhuma medição encontrada com os filtros selecionados')
      }

      // Preparar dados do relatório
      const dadosRelatorio = {
        titulo: 'RELATÓRIO GLOBAL DE MEDIÇÕES DE RETRORREFLETÂNCIA',
        subtitulo: `Período: ${this.formatarData(filtros.data_inicio)} a ${this.formatarData(filtros.data_fim)}`,
        filtros,
        medicoes,
        estatisticas: this.calcularEstatisticas(medicoes),
        dataGeracao: new Date(),
      }

      // Gerar no formato solicitado
      if (formato === 'pdf') {
        return await this.gerarPDFGlobal(dadosRelatorio)
      } else if (formato === 'excel') {
        return await this.gerarExcelGlobal(dadosRelatorio)
      } else if (formato === 'json') {
        return await this.gerarJSONGlobal(dadosRelatorio)
      }

      throw new Error('Formato de relatório não suportado')
    } catch (error) {
      console.error('❌ Erro ao gerar relatório global:', error)
      throw error
    }
  }

  /**
   * Gerar Relatório por Tipo (Vertical, Horizontal, Tachas, Tachões)
   */
  async gerarRelatorioPorTipo(tipo, filtros = {}, formato = 'pdf') {
    try {
      // Adicionar filtro de tipo
      filtros.tipo_equipamento = tipo

      const resultado = await this.buscarMedicoes(filtros)
      
      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      const medicoes = resultado.data

      if (medicoes.length === 0) {
        throw new Error(`Nenhuma medição encontrada para equipamentos do tipo ${tipo}`)
      }

      const tipoNome = {
        vertical: 'SINALIZAÇÃO VERTICAL (PLACAS)',
        horizontal: 'SINALIZAÇÃO HORIZONTAL (TINTAS)',
        tachas: 'TACHAS REFLETIVAS',
        tachoes: 'TACHÕES REFLETIVOS'
      }

      const dadosRelatorio = {
        titulo: `RELATÓRIO DE MEDIÇÕES - ${tipoNome[tipo] || tipo.toUpperCase()}`,
        subtitulo: `Período: ${this.formatarData(filtros.data_inicio)} a ${this.formatarData(filtros.data_fim)}`,
        tipo,
        filtros,
        medicoes,
        estatisticas: this.calcularEstatisticasPorTipo(medicoes, tipo),
        dataGeracao: new Date(),
      }

      if (formato === 'pdf') {
        return await this.gerarPDFPorTipo(dadosRelatorio)
      } else if (formato === 'excel') {
        return await this.gerarExcelPorTipo(dadosRelatorio)
      } else if (formato === 'json') {
        return await this.gerarJSONGlobal(dadosRelatorio)
      }

      throw new Error('Formato de relatório não suportado')
    } catch (error) {
      console.error('❌ Erro ao gerar relatório por tipo:', error)
      throw error
    }
  }

  /**
   * Gerar Relatório Individual por Equipamento
   */
  async gerarRelatorioIndividual(equipamentoId, filtros = {}, formato = 'pdf') {
    try {
      filtros.equipamento_id = equipamentoId

      const resultado = await this.buscarMedicoes(filtros)
      
      if (!resultado.success) {
        throw new Error(resultado.error)
      }

      const medicoes = resultado.data

      if (medicoes.length === 0) {
        throw new Error('Nenhuma medição encontrada para este equipamento')
      }

      // Buscar informações completas do equipamento
      const { data: equipamento, error: errorEquip } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('id', equipamentoId)
        .maybeSingle()

      if (errorEquip) throw errorEquip
      if (!equipamento) {
        throw new Error('Equipamento não encontrado para gerar relatório')
      }

      const dadosRelatorio = {
        titulo: `RELATÓRIO INDIVIDUAL DE MEDIÇÕES`,
        subtitulo: `Equipamento: ${equipamento.codigo} - ${equipamento.nome}`,
        equipamento,
        filtros,
        medicoes,
        historico: this.organizarHistorico(medicoes),
        estatisticas: this.calcularEstatisticasIndividuais(medicoes),
        dataGeracao: new Date(),
      }

      if (formato === 'pdf') {
        return await this.gerarPDFIndividual(dadosRelatorio)
      } else if (formato === 'excel') {
        return await this.gerarExcelIndividual(dadosRelatorio)
      } else if (formato === 'json') {
        return await this.gerarJSONGlobal(dadosRelatorio)
      }

      throw new Error('Formato de relatório não suportado')
    } catch (error) {
      console.error('❌ Erro ao gerar relatório individual:', error)
      throw error
    }
  }

  /**
   * Gerar Relatório de Erros para Debug
   */
  async gerarRelatorioErros(dataInicio, dataFim) {
    try {
      // Buscar logs de erro
      const { data: logsErro, error: errorLogs } = await supabase
        .from('logs_erro')
        .select('*')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim)
        .order('created_at', { ascending: false })

      if (errorLogs) throw errorLogs

      // Buscar medições com problemas
      const { data: medicoesProblema, error: errorMedicoes } = await supabase
        .from('vw_calibracoes_status')
        .select('*')
        .eq('status_validacao', 'REPROVADO')
        .gte('data_calibracao', dataInicio)
        .lte('data_calibracao', dataFim)

      if (errorMedicoes) throw errorMedicoes

      // Buscar equipamentos sem medição
      const { data: equipamentosSemMedicao, error: errorEquipSem } = await supabase
        .from('vw_calibracoes_status')
        .select('*')
        .eq('status_vencimento', 'SEM_CALIBRACAO')

      if (errorEquipSem) throw errorEquipSem

      // Buscar medições vencidas
      const { data: medicoesVencidas, error: errorVencidas } = await supabase
        .from('vw_calibracoes_status')
        .select('*')
        .eq('status_vencimento', 'VENCIDA')

      if (errorVencidas) throw errorVencidas

      const dadosRelatorio = {
        titulo: 'RELATÓRIO DE DIAGNÓSTICO E ERROS DO SISTEMA',
        subtitulo: `Período: ${this.formatarData(dataInicio)} a ${this.formatarData(dataFim)}`,
        logsErro: logsErro || [],
        medicoesReprovadas: medicoesProblema || [],
        equipamentosSemMedicao: equipamentosSemMedicao || [],
        medicoesVencidas: medicoesVencidas || [],
        resumo: {
          totalErros: logsErro?.length || 0,
          medicoesReprovadas: medicoesProblema?.length || 0,
          equipamentosSemMedicao: equipamentosSemMedicao?.length || 0,
          medicoesVencidas: medicoesVencidas?.length || 0,
        },
        dataGeracao: new Date(),
      }

      return await this.gerarJSONErros(dadosRelatorio)
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de erros:', error)
      throw error
    }
  }

  /**
   * Calcular estatísticas gerais
   */
  calcularEstatisticas(medicoes) {
    const total = medicoes.length
    const aprovadas = medicoes.filter(m => m.status_validacao === 'APROVADO').length
    const reprovadas = medicoes.filter(m => m.status_validacao === 'REPROVADO').length
    const emDia = medicoes.filter(m => m.status_vencimento === 'EM_DIA').length
    const vencidas = medicoes.filter(m => m.status_vencimento === 'VENCIDA').length
    
    const valores = medicoes.map(m => m.valor_medio).filter(v => v !== null)
    const valorMedio = valores.length > 0 
      ? valores.reduce((a, b) => a + b, 0) / valores.length 
      : 0

    return {
      total,
      aprovadas,
      reprovadas,
      emDia,
      vencidas,
      taxaAprovacao: total > 0 ? ((aprovadas / total) * 100).toFixed(2) : 0,
      valorMedio: valorMedio.toFixed(2),
    }
  }

  /**
   * Calcular estatísticas por tipo
   */
  calcularEstatisticasPorTipo(medicoes, tipo) {
    const estatisticas = this.calcularEstatisticas(medicoes)
    
    // Agrupar por película/material
    const porCategoria = {}
    medicoes.forEach(m => {
      const categoria = m.tipo_pelicula || m.tipo_material || 'Não especificado'
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = {
          total: 0,
          aprovadas: 0,
          reprovadas: 0,
          valores: []
        }
      }
      porCategoria[categoria].total++
      if (m.status_validacao === 'APROVADO') porCategoria[categoria].aprovadas++
      if (m.status_validacao === 'REPROVADO') porCategoria[categoria].reprovadas++
      if (m.valor_medio) porCategoria[categoria].valores.push(m.valor_medio)
    })

    // Calcular médias por categoria
    Object.keys(porCategoria).forEach(cat => {
      const valores = porCategoria[cat].valores
      porCategoria[cat].valorMedio = valores.length > 0
        ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)
        : 0
      porCategoria[cat].taxaAprovacao = porCategoria[cat].total > 0
        ? ((porCategoria[cat].aprovadas / porCategoria[cat].total) * 100).toFixed(2)
        : 0
    })

    return {
      ...estatisticas,
      porCategoria
    }
  }

  /**
   * Calcular estatísticas individuais
   */
  calcularEstatisticasIndividuais(medicoes) {
    const estatisticas = this.calcularEstatisticas(medicoes)
    
    // Evolução temporal
    const evolucao = medicoes.map(m => ({
      data: m.data_calibracao,
      valorMedio: m.valor_medio,
      status: m.status_validacao
    })).sort((a, b) => new Date(a.data) - new Date(b.data))

    return {
      ...estatisticas,
      evolucao,
      primeiraMedicao: medicoes[medicoes.length - 1],
      ultimaMedicao: medicoes[0],
    }
  }

  /**
   * Organizar histórico cronológico
   */
  organizarHistorico(medicoes) {
    return medicoes.sort((a, b) => 
      new Date(a.data_calibracao) - new Date(b.data_calibracao)
    )
  }

  /**
   * Gerar PDF - Relatório Global
   */
  async gerarPDFGlobal(dados) {
    const { jsPDF } = await this.carregarDependenciasPDF()
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    this.adicionarCabecalho(doc, dados.titulo, dados.subtitulo)
    
    let yPos = 55

    // Estatísticas resumidas
    yPos = this.adicionarEstatisticasResumo(doc, yPos, dados.estatisticas)

    // Tabela de medições
    this.adicionarTabelaMedicoes(doc, yPos, dados.medicoes)

    this.adicionarRodape(doc)

    const nomeArquivo = `Relatorio_Global_Medicoes_${this.gerarTimestamp()}.pdf`
    doc.save(nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar PDF - Relatório por Tipo
   */
  async gerarPDFPorTipo(dados) {
    const { jsPDF } = await this.carregarDependenciasPDF()
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    this.adicionarCabecalho(doc, dados.titulo, dados.subtitulo)
    
    let yPos = 55

    // Estatísticas por categoria
    yPos = this.adicionarEstatisticasPorCategoria(doc, yPos, dados.estatisticas)

    // Tabela de medições
    this.adicionarTabelaMedicoes(doc, yPos + 5, dados.medicoes)

    this.adicionarRodape(doc)

    const nomeArquivo = `Relatorio_${dados.tipo}_${this.gerarTimestamp()}.pdf`
    doc.save(nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar PDF - Relatório Individual
   */
  async gerarPDFIndividual(dados) {
    const { jsPDF } = await this.carregarDependenciasPDF()
    const doc = new jsPDF('portrait', 'mm', 'a4')
    
    this.adicionarCabecalho(doc, dados.titulo, dados.subtitulo)
    
    let yPos = 55

    // Dados do equipamento
    yPos = this.adicionarDadosEquipamento(doc, yPos, dados.equipamento)

    // Estatísticas
    yPos = this.adicionarEstatisticasIndividuais(doc, yPos, dados.estatisticas)

    // Histórico de medições
    this.adicionarHistoricoMedicoes(doc, yPos + 5, dados.historico)

    this.adicionarRodape(doc)

    const nomeArquivo = `Relatorio_Individual_${dados.equipamento.codigo}_${this.gerarTimestamp()}.pdf`
    doc.save(nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar Excel - Relatório Global
   */
  async gerarExcelGlobal(dados) {
    const wb = XLSX.utils.book_new()

    // Aba 1: Resumo
    const wsResumo = XLSX.utils.json_to_sheet([
      { Campo: 'Total de Medições', Valor: dados.estatisticas.total },
      { Campo: 'Aprovadas', Valor: dados.estatisticas.aprovadas },
      { Campo: 'Reprovadas', Valor: dados.estatisticas.reprovadas },
      { Campo: 'Em Dia', Valor: dados.estatisticas.emDia },
      { Campo: 'Vencidas', Valor: dados.estatisticas.vencidas },
      { Campo: 'Taxa de Aprovação (%)', Valor: dados.estatisticas.taxaAprovacao },
      { Campo: 'Valor Médio', Valor: dados.estatisticas.valorMedio },
    ])
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    // Aba 2: Medições
    const medicoes = dados.medicoes.map(m => ({
      'Código Equipamento': m.equipamento_codigo,
      'Nome Equipamento': m.equipamento_nome,
      'Tipo': m.equipamento_tipo,
      'Data Medição': this.formatarData(m.data_calibracao),
      'Película/Material': m.tipo_pelicula || m.tipo_material,
      'Cor': m.cor_medicao,
      'Valor Médio': m.valor_medio,
      'Valor Mínimo Ref': m.valor_minimo_referencia,
      'Status': m.status_validacao,
      'Taxa Aprovação (%)': m.percentual_aprovacao,
      'Técnico': m.tecnico_responsavel,
    }))
    const wsMedicoes = XLSX.utils.json_to_sheet(medicoes)
    XLSX.utils.book_append_sheet(wb, wsMedicoes, 'Medições')

    const nomeArquivo = `Relatorio_Global_Medicoes_${this.gerarTimestamp()}.xlsx`
    XLSX.writeFile(wb, nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar Excel - Por Tipo
   */
  async gerarExcelPorTipo(dados) {
    const wb = XLSX.utils.book_new()

    // Resumo
    const resumoData = [
      { Campo: 'Total de Medições', Valor: dados.estatisticas.total },
      { Campo: 'Aprovadas', Valor: dados.estatisticas.aprovadas },
      { Campo: 'Reprovadas', Valor: dados.estatisticas.reprovadas },
      { Campo: 'Taxa de Aprovação (%)', Valor: dados.estatisticas.taxaAprovacao },
    ]
    const wsResumo = XLSX.utils.json_to_sheet(resumoData)
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    // Por Categoria
    const categoriaData = Object.keys(dados.estatisticas.porCategoria).map(cat => ({
      'Categoria': cat,
      'Total': dados.estatisticas.porCategoria[cat].total,
      'Aprovadas': dados.estatisticas.porCategoria[cat].aprovadas,
      'Reprovadas': dados.estatisticas.porCategoria[cat].reprovadas,
      'Taxa Aprovação (%)': dados.estatisticas.porCategoria[cat].taxaAprovacao,
      'Valor Médio': dados.estatisticas.porCategoria[cat].valorMedio,
    }))
    const wsCategoria = XLSX.utils.json_to_sheet(categoriaData)
    XLSX.utils.book_append_sheet(wb, wsCategoria, 'Por Categoria')

    // Medições detalhadas
    const medicoes = dados.medicoes.map(m => ({
      'Código': m.equipamento_codigo,
      'Nome': m.equipamento_nome,
      'Data': this.formatarData(m.data_calibracao),
      'Película/Material': m.tipo_pelicula || m.tipo_material,
      'Cor': m.cor_medicao,
      'Valor Médio': m.valor_medio,
      'Status': m.status_validacao,
      'Técnico': m.tecnico_responsavel,
    }))
    const wsMedicoes = XLSX.utils.json_to_sheet(medicoes)
    XLSX.utils.book_append_sheet(wb, wsMedicoes, 'Medições')

    const nomeArquivo = `Relatorio_${dados.tipo}_${this.gerarTimestamp()}.xlsx`
    XLSX.writeFile(wb, nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar Excel - Individual
   */
  async gerarExcelIndividual(dados) {
    const wb = XLSX.utils.book_new()

    // Dados do equipamento
    const wsEquip = XLSX.utils.json_to_sheet([
      { Campo: 'Código', Valor: dados.equipamento.codigo },
      { Campo: 'Nome', Valor: dados.equipamento.nome },
      { Campo: 'Tipo', Valor: dados.equipamento.tipo },
      { Campo: 'Localização', Valor: dados.equipamento.localizacao },
      { Campo: 'Fabricante', Valor: dados.equipamento.fabricante },
      { Campo: 'Modelo', Valor: dados.equipamento.modelo },
    ])
    XLSX.utils.book_append_sheet(wb, wsEquip, 'Equipamento')

    // Estatísticas
    const wsStats = XLSX.utils.json_to_sheet([
      { Campo: 'Total de Medições', Valor: dados.estatisticas.total },
      { Campo: 'Aprovadas', Valor: dados.estatisticas.aprovadas },
      { Campo: 'Reprovadas', Valor: dados.estatisticas.reprovadas },
      { Campo: 'Taxa de Aprovação (%)', Valor: dados.estatisticas.taxaAprovacao },
      { Campo: 'Valor Médio', Valor: dados.estatisticas.valorMedio },
    ])
    XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas')

    // Histórico
    const historico = dados.historico.map(m => ({
      'Data': this.formatarData(m.data_calibracao),
      'Película/Material': m.tipo_pelicula || m.tipo_material,
      'Cor': m.cor_medicao,
      'Valor Médio': m.valor_medio,
      'Valor Mín Ref': m.valor_minimo_referencia,
      'Status': m.status_validacao,
      'Taxa (%)': m.percentual_aprovacao,
      'Técnico': m.tecnico_responsavel,
    }))
    const wsHistorico = XLSX.utils.json_to_sheet(historico)
    XLSX.utils.book_append_sheet(wb, wsHistorico, 'Histórico')

    const nomeArquivo = `Relatorio_Individual_${dados.equipamento.codigo}_${this.gerarTimestamp()}.xlsx`
    XLSX.writeFile(wb, nomeArquivo)

    return { success: true, nomeArquivo }
  }

  /**
   * Gerar JSON - Qualquer relatório
   */
  async gerarJSONGlobal(dados) {
    const json = JSON.stringify(dados, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const nomeArquivo = `Relatorio_JSON_${this.gerarTimestamp()}.json`
    saveAs(blob, nomeArquivo)
    return { success: true, nomeArquivo }
  }

  /**
   * Gerar JSON - Relatório de Erros
   */
  async gerarJSONErros(dados) {
    const json = JSON.stringify(dados, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const nomeArquivo = `Relatorio_Erros_${this.gerarTimestamp()}.json`
    saveAs(blob, nomeArquivo)
    return { success: true, nomeArquivo }
  }

  /**
   * Helpers para PDF
   */
  adicionarCabecalho(doc, titulo, subtitulo) {
    const pageWidth = doc.internal.pageSize.width

    // Linha superior
    doc.setFillColor(255, 0, 0)
    doc.rect(0, 0, pageWidth, 3, 'F')

    // Empresa
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(this.dadosEmpresa.razaoSocial, pageWidth / 2, 12, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`CNPJ: ${this.dadosEmpresa.cnpj} | ${this.dadosEmpresa.site}`, pageWidth / 2, 17, { align: 'center' })

    // Título
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, pageWidth / 2, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitulo, pageWidth / 2, 37, { align: 'center' })

    // Linha separadora
    doc.setDrawColor(255, 193, 7)
    doc.setLineWidth(0.5)
    doc.line(10, 42, pageWidth - 10, 42)
  }

  adicionarRodape(doc) {
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')} | ${this.dadosEmpresa.site}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )

    doc.setFillColor(255, 0, 0)
    doc.rect(0, pageHeight - 3, pageWidth, 3, 'F')
  }

  adicionarEstatisticasResumo(doc, yPos, stats) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMO ESTATÍSTICO', 10, yPos)

    yPos += 5

    const dados = [
      ['Total de Medições', stats.total],
      ['Aprovadas', stats.aprovadas],
      ['Reprovadas', stats.reprovadas],
      ['Em Dia', stats.emDia],
      ['Vencidas', stats.vencidas],
      ['Taxa de Aprovação', `${stats.taxaAprovacao}%`],
      ['Valor Médio', stats.valorMedio],
    ]

    doc.autoTable({
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: dados,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 10, right: 10 },
      tableWidth: 100,
    })

    return doc.lastAutoTable.finalY + 10
  }

  adicionarEstatisticasPorCategoria(doc, yPos, stats) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ESTATÍSTICAS POR CATEGORIA', 10, yPos)

    yPos += 5

    const dados = Object.keys(stats.porCategoria).map(cat => [
      cat,
      stats.porCategoria[cat].total,
      stats.porCategoria[cat].aprovadas,
      stats.porCategoria[cat].reprovadas,
      `${stats.porCategoria[cat].taxaAprovacao}%`,
      stats.porCategoria[cat].valorMedio,
    ])

    doc.autoTable({
      startY: yPos,
      head: [['Categoria', 'Total', 'Aprovadas', 'Reprovadas', 'Taxa (%)', 'Valor Médio']],
      body: dados,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 10, right: 10 },
    })

    return doc.lastAutoTable.finalY + 10
  }

  adicionarDadosEquipamento(doc, yPos, equipamento) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO EQUIPAMENTO', 10, yPos)

    yPos += 5

    const dados = [
      ['Código', equipamento.codigo],
      ['Nome', equipamento.nome],
      ['Tipo', equipamento.tipo],
      ['Localização', equipamento.localizacao || '-'],
      ['Fabricante', equipamento.fabricante || '-'],
      ['Modelo', equipamento.modelo || '-'],
    ]

    doc.autoTable({
      startY: yPos,
      body: dados,
      theme: 'plain',
      bodyStyles: { fontSize: 9 },
      margin: { left: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
    })

    return doc.lastAutoTable.finalY + 10
  }

  adicionarEstatisticasIndividuais(doc, yPos, stats) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ESTATÍSTICAS', 10, yPos)

    yPos += 5

    const dados = [
      ['Total de Medições', stats.total],
      ['Aprovadas', stats.aprovadas],
      ['Reprovadas', stats.reprovadas],
      ['Taxa de Aprovação', `${stats.taxaAprovacao}%`],
      ['Valor Médio', stats.valorMedio],
    ]

    doc.autoTable({
      startY: yPos,
      body: dados,
      theme: 'grid',
      bodyStyles: { fontSize: 9 },
      margin: { left: 10 },
      tableWidth: 100,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
      },
    })

    return doc.lastAutoTable.finalY + 10
  }

  adicionarTabelaMedicoes(doc, yPos, medicoes) {
    const dados = medicoes.map(m => [
      m.equipamento_codigo,
      m.equipamento_nome.substring(0, 30),
      this.formatarData(m.data_calibracao),
      m.tipo_pelicula || m.tipo_material || '-',
      m.cor_medicao || '-',
      m.valor_medio?.toFixed(2) || '-',
      m.status_validacao || '-',
      m.tecnico_responsavel?.substring(0, 20) || '-',
    ])

    doc.autoTable({
      startY: yPos,
      head: [['Código', 'Nome', 'Data', 'Película', 'Cor', 'Valor', 'Status', 'Técnico']],
      body: dados,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 35 },
      },
    })
  }

  adicionarHistoricoMedicoes(doc, yPos, historico) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('HISTÓRICO DE MEDIÇÕES', 10, yPos)

    yPos += 5

    const dados = historico.map(m => [
      this.formatarData(m.data_calibracao),
      m.tipo_pelicula || m.tipo_material || '-',
      m.cor_medicao || '-',
      m.valor_medio?.toFixed(2) || '-',
      m.status_validacao || '-',
      `${m.percentual_aprovacao?.toFixed(1) || 0}%`,
      m.tecnico_responsavel || '-',
    ])

    doc.autoTable({
      startY: yPos,
      head: [['Data', 'Película', 'Cor', 'Valor', 'Status', 'Taxa', 'Técnico']],
      body: dados,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 10, right: 10 },
    })
  }

  /**
   * Helpers gerais
   */
  formatarData(data) {
    if (!data) return 'Não informado'
    if (typeof data === 'string') data = new Date(data)
    return data.toLocaleDateString('pt-BR')
  }

  gerarTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
  }
}

export default new RelatorioMedicoesService()
