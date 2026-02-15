import { supabase } from './supabase'

/**
 * Serviço de Upload e Gestão de PDFs
 * Certificados de Calibração e Cautelas de Recebimento
 */
class PDFService {
  
  /**
   * Upload de Certificado de Calibração
   * @param {File} arquivo - Arquivo PDF
   * @param {string} equipamento_id - ID do equipamento
   * @param {Object} dados - Dados do certificado (laboratorio, numero, validade, observacoes)
   */
  async uploadCertificadoCalibracao(arquivo, equipamento_id, dados = {}) {
    try {
      // Validar arquivo
      if (!arquivo) {
        throw new Error('Nenhum arquivo selecionado')
      }

      if (arquivo.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos')
      }

      if (arquivo.size > 10 * 1024 * 1024) { // 10 MB
        throw new Error('Arquivo muito grande. Tamanho máximo: 10 MB')
      }

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const nomeArquivo = `certificados/${equipamento_id}_${timestamp}.pdf`

      // Upload para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medlux-arquivos')
        .upload(nomeArquivo, arquivo, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('medlux-arquivos')
        .getPublicUrl(nomeArquivo)

      const certificado_url = urlData.publicUrl

      // Atualizar equipamento com informações do certificado
      const { data: equipamento, error: updateError } = await supabase
        .from('equipamentos')
        .update({
          certificado_url,
          certificado_data_upload: new Date().toISOString(),
          certificado_laboratorio: dados.laboratorio || null,
          certificado_numero: dados.numero || null,
          certificado_validade: dados.validade || null,
          certificado_observacoes: dados.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', equipamento_id)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        success: true,
        certificado_url,
        equipamento,
        message: 'Certificado de calibração enviado com sucesso!'
      }

    } catch (error) {
      console.error('❌ Erro ao fazer upload do certificado:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Upload de Cautela de Recebimento Técnico
   * @param {File} arquivo - Arquivo PDF
   * @param {string} vinculo_id - ID do vínculo
   * @param {Object} dados - Dados da cautela (data_entrega, tecnico, treinamento, observacoes)
   */
  async uploadCautelaRecebimento(arquivo, vinculo_id, dados = {}) {
    try {
      // Validar arquivo
      if (!arquivo) {
        throw new Error('Nenhum arquivo selecionado')
      }

      if (arquivo.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos')
      }

      if (arquivo.size > 10 * 1024 * 1024) { // 10 MB
        throw new Error('Arquivo muito grande. Tamanho máximo: 10 MB')
      }

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const nomeArquivo = `cautelas/${vinculo_id}_${timestamp}.pdf`

      // Upload para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medlux-arquivos')
        .upload(nomeArquivo, arquivo, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('medlux-arquivos')
        .getPublicUrl(nomeArquivo)

      const cautela_url = urlData.publicUrl

      // Atualizar vínculo com informações da cautela
      const { data: vinculo, error: updateError } = await supabase
        .from('vinculos')
        .update({
          cautela_url,
          cautela_data_upload: new Date().toISOString(),
          cautela_data_entrega: dados.data_entrega || null,
          cautela_tecnico_responsavel: dados.tecnico || null,
          cautela_treinamento_realizado: dados.treinamento || false,
          cautela_observacoes: dados.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vinculo_id)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        success: true,
        cautela_url,
        vinculo,
        message: 'Cautela de recebimento enviada com sucesso!'
      }

    } catch (error) {
      console.error('❌ Erro ao fazer upload da cautela:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Remover Certificado de Calibração
   * @param {string} equipamento_id - ID do equipamento
   */
  async removerCertificado(equipamento_id) {
    try {
      // Buscar equipamento para obter URL do certificado
      const { data: equipamento, error: fetchError } = await supabase
        .from('equipamentos')
        .select('certificado_url')
        .eq('id', equipamento_id)
        .single()

      if (fetchError) throw fetchError

      if (!equipamento.certificado_url) {
        throw new Error('Equipamento não possui certificado')
      }

      // Extrair caminho do arquivo da URL
      const url = new URL(equipamento.certificado_url)
      const pathParts = url.pathname.split('/')
      const caminhoArquivo = pathParts.slice(-2).join('/') // certificados/xxx.pdf

      // Remover arquivo do storage
      const { error: deleteError } = await supabase.storage
        .from('medlux-arquivos')
        .remove([caminhoArquivo])

      if (deleteError) throw deleteError

      // Atualizar equipamento removendo dados do certificado
      const { data, error: updateError } = await supabase
        .from('equipamentos')
        .update({
          certificado_url: null,
          certificado_data_upload: null,
          certificado_laboratorio: null,
          certificado_numero: null,
          certificado_validade: null,
          certificado_observacoes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', equipamento_id)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        success: true,
        message: 'Certificado removido com sucesso!'
      }

    } catch (error) {
      console.error('❌ Erro ao remover certificado:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Remover Cautela de Recebimento
   * @param {string} vinculo_id - ID do vínculo
   */
  async removerCautela(vinculo_id) {
    try {
      // Buscar vínculo para obter URL da cautela
      const { data: vinculo, error: fetchError } = await supabase
        .from('vinculos')
        .select('cautela_url')
        .eq('id', vinculo_id)
        .single()

      if (fetchError) throw fetchError

      if (!vinculo.cautela_url) {
        throw new Error('Vínculo não possui cautela')
      }

      // Extrair caminho do arquivo da URL
      const url = new URL(vinculo.cautela_url)
      const pathParts = url.pathname.split('/')
      const caminhoArquivo = pathParts.slice(-2).join('/') // cautelas/xxx.pdf

      // Remover arquivo do storage
      const { error: deleteError } = await supabase.storage
        .from('medlux-arquivos')
        .remove([caminhoArquivo])

      if (deleteError) throw deleteError

      // Atualizar vínculo removendo dados da cautela
      const { data, error: updateError } = await supabase
        .from('vinculos')
        .update({
          cautela_url: null,
          cautela_data_upload: null,
          cautela_data_entrega: null,
          cautela_tecnico_responsavel: null,
          cautela_treinamento_realizado: false,
          cautela_observacoes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vinculo_id)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        success: true,
        message: 'Cautela removida com sucesso!'
      }

    } catch (error) {
      console.error('❌ Erro ao remover cautela:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Buscar Certificados Vencendo
   * @param {number} dias - Dias até o vencimento (padrão: 30)
   */
  async buscarCertificadosVencendo(dias = 30) {
    try {
      const { data, error } = await supabase
        .rpc('validar_vencimento_certificados')

      if (error) throw error

      // Filtrar por dias
      const certificadosVencendo = data.filter(cert => 
        cert.dias_restantes <= dias && cert.dias_restantes >= 0
      )

      return {
        success: true,
        data: certificadosVencendo
      }

    } catch (error) {
      console.error('❌ Erro ao buscar certificados vencendo:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Buscar Cautelas Pendentes
   */
  async buscarCautelasPendentes() {
    try {
      const { data, error } = await supabase
        .rpc('listar_cautelas_pendentes')

      if (error) throw error

      return {
        success: true,
        data
      }

    } catch (error) {
      console.error('❌ Erro ao buscar cautelas pendentes:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Visualizar PDF
   * @param {string} url - URL do PDF
   */
  visualizarPDF(url) {
    if (!url) {
      console.warn('⚠️ URL do PDF não fornecida')
      return
    }
    window.open(url, '_blank')
  }

  /**
   * Baixar PDF
   * @param {string} url - URL do PDF
   * @param {string} nomeArquivo - Nome do arquivo para download
   */
  async baixarPDF(url, nomeArquivo = 'documento.pdf') {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = nomeArquivo
      link.click()
      window.URL.revokeObjectURL(link.href)

      return {
        success: true,
        message: 'Download iniciado com sucesso!'
      }

    } catch (error) {
      console.error('❌ Erro ao baixar PDF:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new PDFService()
