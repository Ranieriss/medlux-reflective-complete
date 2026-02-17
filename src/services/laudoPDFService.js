import QRCode from 'qrcode'

/**
 * Serviço para gerar Laudos/Relatórios de Medição de Retrorrefletância
 * Com folha timbrada da ICDVias
 */
class LaudoPDFService {
  

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
   * Dados da empresa ICDVias
   */
  dadosEmpresa = {
    razaoSocial: 'I.C.D. Indústria, Comércio e Distribuição de Materiais para Infraestrutura Viária Ltda.',
    cnpj: '10.954.989/0001-26',
    inscricaoEstadual: '255.893.574',
    endereco: 'Rua Juliano Lucchi, 118 – Jardim Eldorado - Palhoça - SC - CEP 88.133-540',
    telefone: '(48) 2106-3022',
    fax: '(48) 2106-3008',
    slogan: 'TECNOLOGIA EM MATERIAIS A SERVIÇO DA VIDA!',
    site: 'www.icdvias.com.br',
  }

  /**
   * Cores do tema ICDVias
   */
  cores = {
    primaria: [0, 0, 0],        // Preto
    secundaria: [255, 0, 0],    // Vermelho
    destaque: [255, 193, 7],    // Amarelo/Dourado
    texto: [51, 51, 51],        // Cinza escuro
    textoClaro: [128, 128, 128], // Cinza médio
    fundo: [245, 245, 245],      // Cinza claro
    aprovado: [76, 175, 80],     // Verde
    reprovado: [244, 67, 54],    // Vermelho
    atencao: [255, 152, 0],      // Laranja
  }

  /**
   * Gerar laudo completo de medição
   */
  async gerarLaudo(dadosMedicao) {
    try {
      const { jsPDF } = await this.carregarDependenciasPDF()

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Adicionar fontes customizadas (opcional)
      this.configurarFontes(doc)

      // Cabeçalho da empresa
      this.adicionarCabecalho(doc)

      // Título do laudo
      this.adicionarTitulo(doc, 'LAUDO TÉCNICO DE MEDIÇÃO DE RETRORREFLETÂNCIA')

      // Informações do equipamento
      let yPos = this.adicionarSecao(doc, 55, 'DADOS DO EQUIPAMENTO')
      yPos = this.adicionarInfoEquipamento(doc, yPos, dadosMedicao)

      // Dados da medição
      yPos = this.adicionarSecao(doc, yPos + 10, 'DADOS DA MEDIÇÃO')
      yPos = this.adicionarInfoMedicao(doc, yPos, dadosMedicao)

      // Valores medidos
      yPos = this.adicionarSecao(doc, yPos + 10, 'VALORES MEDIDOS')
      yPos = this.adicionarTabelaMedicoes(doc, yPos, dadosMedicao)

      // Resultado da validação
      yPos = this.adicionarSecao(doc, yPos + 10, 'RESULTADO DA VALIDAÇÃO')
      yPos = this.adicionarResultadoValidacao(doc, yPos, dadosMedicao)

      // Normas de referência
      yPos = this.adicionarSecao(doc, yPos + 10, 'NORMAS DE REFERÊNCIA')
      yPos = this.adicionarNormasReferencia(doc, yPos, dadosMedicao)

      // Observações (se houver)
      if (dadosMedicao.observacoes) {
        yPos = this.adicionarSecao(doc, yPos + 10, 'OBSERVAÇÕES')
        yPos = this.adicionarObservacoes(doc, yPos, dadosMedicao)
      }

      // Assinatura com QR Code
      await this.adicionarAssinatura(doc, dadosMedicao)

      // Rodapé
      this.adicionarRodape(doc)

      // Salvar PDF
      const nomeArquivo = this.gerarNomeArquivo(dadosMedicao)
      doc.save(nomeArquivo)

      return { success: true, nomeArquivo }
    } catch (error) {
      console.error('Erro ao gerar laudo PDF:', error)
      throw new Error('Falha ao gerar laudo: ' + error.message)
    }
  }

  /**
   * Configurar fontes do documento
   */
  configurarFontes(doc) {
    // Usar fontes padrão do jsPDF
    doc.setFont('helvetica')
  }

  /**
   * Adicionar cabeçalho da empresa
   */
  adicionarCabecalho(doc) {
    const pageWidth = doc.internal.pageSize.width
    
    // Linha superior vermelha
    doc.setFillColor(...this.cores.secundaria)
    doc.rect(0, 0, pageWidth, 3, 'F')

    // Logo (simulado - você pode adicionar imagem real aqui)
    doc.setFillColor(...this.cores.primaria)
    doc.rect(10, 8, 4, 15, 'F')
    doc.setFillColor(...this.cores.secundaria)
    doc.circle(12, 18, 5, 'F')
    
    // Nome da empresa
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...this.cores.primaria)
    doc.text(this.dadosEmpresa.razaoSocial, 25, 12)

    // CNPJ e IE
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.textoClaro)
    doc.text(`CNPJ: ${this.dadosEmpresa.cnpj}  |  Insc. Est.: ${this.dadosEmpresa.inscricaoEstadual}`, 25, 16)

    // Endereço
    doc.text(this.dadosEmpresa.endereco, 25, 20)

    // Telefone
    doc.text(`Fone: ${this.dadosEmpresa.telefone}  |  Fax: ${this.dadosEmpresa.fax}`, 25, 24)

    // Slogan
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...this.cores.secundaria)
    doc.text(this.dadosEmpresa.slogan, pageWidth - 10, 28, { align: 'right' })

    // Linha separadora
    doc.setDrawColor(...this.cores.destaque)
    doc.setLineWidth(0.5)
    doc.line(10, 32, pageWidth - 10, 32)
  }

  /**
   * Adicionar título do laudo
   */
  adicionarTitulo(doc, titulo) {
    const pageWidth = doc.internal.pageSize.width
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...this.cores.primaria)
    doc.text(titulo, pageWidth / 2, 45, { align: 'center' })

    // Número do laudo
    const numeroLaudo = `Nº ${Date.now()}`
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.textoClaro)
    doc.text(numeroLaudo, pageWidth - 10, 45, { align: 'right' })
  }

  /**
   * Adicionar seção com título
   */
  adicionarSecao(doc, yPos, titulo) {
    doc.setFillColor(...this.cores.fundo)
    doc.rect(10, yPos, doc.internal.pageSize.width - 20, 8, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...this.cores.primaria)
    doc.text(titulo, 12, yPos + 5)

    return yPos + 8
  }

  /**
   * Adicionar informações do equipamento
   */
  adicionarInfoEquipamento(doc, yPos, dados) {
    const items = [
      { label: 'Código:', valor: dados.equipamento_codigo },
      { label: 'Nome:', valor: dados.equipamento_nome },
      { label: 'Tipo:', valor: dados.equipamento_tipo },
      { label: 'Localização:', valor: dados.localizacao || 'Não informado' },
    ]

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    items.forEach((item, index) => {
      const y = yPos + 5 + (index * 5)
      doc.setTextColor(...this.cores.textoClaro)
      doc.text(item.label, 12, y)
      doc.setTextColor(...this.cores.texto)
      doc.text(item.valor, 50, y)
    })

    return yPos + 25
  }

  /**
   * Adicionar informações da medição
   */
  adicionarInfoMedicao(doc, yPos, dados) {
    const items = [
      { label: 'Data da Medição:', valor: this.formatarData(dados.data_calibracao) },
      { label: 'Próxima Medição:', valor: this.formatarData(dados.proxima_calibracao) },
      { label: 'Tipo de Película:', valor: dados.tipo_pelicula },
      { label: 'Cor:', valor: dados.cor_medicao },
      { label: 'Geometria:', valor: dados.geometria_medicao },
      { label: 'Técnico Responsável:', valor: dados.tecnico_responsavel },
    ]

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    items.forEach((item, index) => {
      const y = yPos + 5 + (index * 5)
      doc.setTextColor(...this.cores.textoClaro)
      doc.text(item.label, 12, y)
      doc.setTextColor(...this.cores.texto)
      doc.text(item.valor, 60, y)
    })

    return yPos + 35
  }

  /**
   * Adicionar tabela de medições
   */
  adicionarTabelaMedicoes(doc, yPos, dados) {
    const valores = dados.valores_medicoes || []
    
    const tableData = valores.map((valor, index) => [
      `Medição ${index + 1}`,
      `${valor.toFixed(2)}`,
      dados.valor_minimo_referencia ? `${dados.valor_minimo_referencia.toFixed(2)}` : '-',
      valor >= (dados.valor_minimo_referencia || 0) ? '✓ Conforme' : '✗ Não conforme'
    ])

    doc.autoTable({
      startY: yPos + 3,
      head: [['Ponto', 'Valor Medido', 'Valor Mínimo (ABNT)', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: this.cores.primaria,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 50, halign: 'center' },
      },
      margin: { left: 10, right: 10 },
    })

    return doc.lastAutoTable.finalY
  }

  /**
   * Adicionar resultado da validação
   */
  adicionarResultadoValidacao(doc, yPos, dados) {
    const statusCor = dados.status_validacao === 'APROVADO' 
      ? this.cores.aprovado 
      : dados.status_validacao === 'REPROVADO'
      ? this.cores.reprovado
      : this.cores.atencao

    // Box de resultado
    doc.setFillColor(...statusCor)
    doc.setDrawColor(...statusCor)
    doc.setLineWidth(2)
    doc.rect(10, yPos + 3, doc.internal.pageSize.width - 20, 25)
    doc.setFillColor(255, 255, 255)
    doc.rect(12, yPos + 5, doc.internal.pageSize.width - 24, 21, 'F')

    // Título do resultado
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...statusCor)
    doc.text('RESULTADO:', 15, yPos + 12)
    doc.text(dados.status_validacao || 'INDETERMINADO', 55, yPos + 12)

    // Dados estatísticos
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.texto)
    
    const stats = [
      `Valor Médio: ${(dados.valor_medio || 0).toFixed(2)}`,
      `Mínimo: ${(dados.valor_minimo_medido || 0).toFixed(2)}`,
      `Máximo: ${(dados.valor_maximo_medido || 0).toFixed(2)}`,
      `Referência ABNT: ${(dados.valor_minimo_referencia || 0).toFixed(2)}`,
      `Taxa de Aprovação: ${(dados.percentual_aprovacao || 0).toFixed(1)}%`,
    ]

    stats.forEach((stat, index) => {
      doc.text(stat, 15 + (index * 38), yPos + 20)
    })

    return yPos + 30
  }

  /**
   * Adicionar normas de referência
   */
  adicionarNormasReferencia(doc, yPos, dados) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.texto)

    const normas = [
      '• NBR 15426:2020 - Sinalização viária vertical',
      '• NBR 14644:2021 - Películas retrorreflectivas',
      '• NBR 14723:2020 - Sinalização horizontal',
      '• NBR 14636:2021 - Tachas refletivas',
    ]

    normas.forEach((norma, index) => {
      doc.text(norma, 12, yPos + 5 + (index * 5))
    })

    return yPos + 25
  }

  /**
   * Adicionar observações
   */
  adicionarObservacoes(doc, yPos, dados) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.texto)

    const observacoes = dados.observacoes || 'Nenhuma observação registrada.'
    const splitText = doc.splitTextToSize(observacoes, doc.internal.pageSize.width - 24)
    
    splitText.forEach((line, index) => {
      doc.text(line, 12, yPos + 5 + (index * 5))
    })

    return yPos + 5 + (splitText.length * 5)
  }

  /**
   * Adicionar assinatura
   */
  /**
   * Adicionar assinatura com QR Code
   */
  async adicionarAssinatura(doc, dados) {
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    
    const yPos = pageHeight - 60 // Increased space for QR code

    // Generate QR Code URL
    // URL should point to where the calibration certificate can be verified
    const baseUrl = window.location.origin
    const qrCodeUrl = `${baseUrl}/calibracoes/${dados.calibracao_id || dados.id}`
    
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 200,
        margin: 1
      })
      
      // Add QR code on the left side
      const qrSize = 30
      const qrX = 15
      const qrY = yPos - 10
      
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
      
      // Add text below QR code
      doc.setFontSize(7)
      doc.setTextColor(...this.cores.textoClaro)
      doc.text('Verificar certificado', qrX + qrSize/2, qrY + qrSize + 4, { align: 'center' })
      
      // Report number (if available)
      if (dados.numero_laudo) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...this.cores.primaria)
        doc.text(`Laudo Nº: ${dados.numero_laudo}`, qrX + qrSize + 10, qrY + 10)
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      // Continue without QR code if there's an error
    }

    // Signature line (on the right side)
    const signatureX = pageWidth / 2 + 10
    doc.setDrawColor(...this.cores.textoClaro)
    doc.setLineWidth(0.3)
    doc.line(signatureX - 30, yPos, signatureX + 30, yPos)

    // Technician name
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.texto)
    doc.text(dados.tecnico_responsavel || 'Técnico Responsável', signatureX, yPos + 5, { align: 'center' })

    // Position
    doc.setFontSize(8)
    doc.setTextColor(...this.cores.textoClaro)
    doc.text('Técnico em Medição de Retrorrefletância', signatureX, yPos + 10, { align: 'center' })

    // Issue date
    doc.text(`Emitido em: ${this.formatarData(new Date())}`, signatureX, yPos + 15, { align: 'center' })
  }

  /**
   * Adicionar rodapé
   */
  adicionarRodape(doc) {
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width

    // Linha superior
    doc.setDrawColor(...this.cores.destaque)
    doc.setLineWidth(0.5)
    doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20)

    // Texto do rodapé
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...this.cores.textoClaro)
    
    const textoRodape = `Este documento é válido apenas com assinatura digital. ${this.dadosEmpresa.site}`
    doc.text(textoRodape, pageWidth / 2, pageHeight - 15, { align: 'center' })

    // Número da página
    doc.text(`Página 1/1`, pageWidth - 10, pageHeight - 10, { align: 'right' })

    // Linha inferior vermelha
    doc.setFillColor(...this.cores.secundaria)
    doc.rect(0, pageHeight - 3, pageWidth, 3, 'F')
  }

  /**
   * Formatar data
   */
  formatarData(data) {
    if (!data) return '-'
    if (typeof data === 'string') data = new Date(data)
    return data.toLocaleDateString('pt-BR')
  }

  /**
   * Gerar nome do arquivo
   */
  gerarNomeArquivo(dados) {
    const codigo = dados.equipamento_codigo || 'EQUIP'
    const data = new Date().toISOString().split('T')[0]
    return `Laudo_Medicao_${codigo}_${data}.pdf`
  }
}

export default new LaudoPDFService()
