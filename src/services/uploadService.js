import supabase from './supabase'

/**
 * Service para upload de arquivos (fotos, PDFs, etc.)
 * Com suporte a geolocalização automática
 */

// Configurações
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_PDF_TYPES = ['application/pdf']

/**
 * Upload de foto com metadados de geolocalização
 */
export async function uploadFotoComLocalizacao(file, pasta = 'medicoes') {
  try {
    // Validar arquivo
    if (!file) throw new Error('Arquivo não fornecido')
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP')
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 10MB')
    }
    
    // Obter geolocalização
    const localizacao = await obterGeolocalizacao()
    
    // Nome único do arquivo
    const timestamp = Date.now()
    const nomeArquivo = `${pasta}/${timestamp}_${file.name.replace(/\s/g, '_')}`
    
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('medlux-arquivos')
      .upload(nomeArquivo, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })
    
    if (error) throw error
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('medlux-arquivos')
      .getPublicUrl(nomeArquivo)
    
    const resultado = {
      url: urlData.publicUrl,
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      pasta: pasta,
      path: nomeArquivo,
      ...localizacao,
      data_upload: new Date().toISOString()
    }
    
    console.log('✅ Foto enviada:', resultado)
    return resultado
    
  } catch (error) {
    console.error('❌ Erro ao enviar foto:', error)
    throw error
  }
}

/**
 * Upload de múltiplas fotos
 */
export async function uploadMultiplasFotos(files, pasta = 'medicoes') {
  try {
    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo fornecido')
    }
    
    const uploads = []
    for (const file of files) {
      const resultado = await uploadFotoComLocalizacao(file, pasta)
      uploads.push(resultado)
    }
    
    console.log(`✅ ${uploads.length} fotos enviadas com sucesso`)
    return uploads
    
  } catch (error) {
    console.error('❌ Erro ao enviar múltiplas fotos:', error)
    throw error
  }
}

/**
 * Upload de PDF (laudos, certificados, etc.)
 */
export async function uploadPDF(file, pasta = 'laudos') {
  try {
    // Validar arquivo
    if (!file) throw new Error('Arquivo não fornecido')
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      throw new Error('Apenas arquivos PDF são permitidos')
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 10MB')
    }
    
    // Nome único do arquivo
    const timestamp = Date.now()
    const nomeArquivo = `${pasta}/${timestamp}_${file.name.replace(/\s/g, '_')}`
    
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('medlux-arquivos')
      .upload(nomeArquivo, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })
    
    if (error) throw error
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('medlux-arquivos')
      .getPublicUrl(nomeArquivo)
    
    const resultado = {
      url: urlData.publicUrl,
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      pasta: pasta,
      path: nomeArquivo,
      data_upload: new Date().toISOString()
    }
    
    console.log('✅ PDF enviado:', resultado)
    return resultado
    
  } catch (error) {
    console.error('❌ Erro ao enviar PDF:', error)
    throw error
  }
}

/**
 * Excluir arquivo do storage
 */
export async function excluirArquivo(path) {
  try {
    const { error } = await supabase.storage
      .from('medlux-arquivos')
      .remove([path])
    
    if (error) throw error
    
    console.log('✅ Arquivo excluído:', path)
    return true
    
  } catch (error) {
    console.error('❌ Erro ao excluir arquivo:', error)
    throw error
  }
}

/**
 * Obter geolocalização do navegador
 */
export async function obterGeolocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalização não suportada pelo navegador')
      resolve({
        latitude: null,
        longitude: null,
        altitude: null,
        precisao_gps: null,
        localizacao_descricao: null,
        gps_disponivel: false
      })
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          precisao_gps: position.coords.accuracy,
          localizacao_descricao: null, // Será preenchido manualmente
          gps_disponivel: true,
          timestamp_gps: new Date(position.timestamp).toISOString()
        }
        console.log('✅ Geolocalização obtida:', coords)
        resolve(coords)
      },
      (error) => {
        console.warn('⚠️ Erro ao obter geolocalização:', error.message)
        resolve({
          latitude: null,
          longitude: null,
          altitude: null,
          precisao_gps: null,
          localizacao_descricao: null,
          gps_disponivel: false,
          erro_gps: error.message
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Formatar coordenadas para display
 */
export function formatarCoordenadas(latitude, longitude) {
  if (!latitude || !longitude) return 'Sem localização'
  
  const latDir = latitude >= 0 ? 'N' : 'S'
  const lonDir = longitude >= 0 ? 'L' : 'O'
  
  return `${Math.abs(latitude).toFixed(6)}° ${latDir}, ${Math.abs(longitude).toFixed(6)}° ${lonDir}`
}

/**
 * Gerar link do Google Maps
 */
export function gerarLinkGoogleMaps(latitude, longitude) {
  if (!latitude || !longitude) return null
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

/**
 * Comprimir imagem antes do upload (reduz tamanho)
 */
export async function comprimirImagem(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Redimensionar se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            console.log(`✅ Imagem comprimida: ${file.size} → ${compressedFile.size} bytes`)
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = reject
    }
    
    reader.onerror = reject
  })
}

/**
 * Validar e preparar arquivo para upload
 */
export async function prepararArquivo(file, opcoes = {}) {
  const {
    comprimir = true,
    maxWidth = 1920,
    quality = 0.85
  } = opcoes
  
  try {
    // Se for imagem e compressão está ativada
    if (ALLOWED_IMAGE_TYPES.includes(file.type) && comprimir) {
      return await comprimirImagem(file, maxWidth, quality)
    }
    
    return file
    
  } catch (error) {
    console.warn('⚠️ Erro ao comprimir imagem, usando original:', error)
    return file
  }
}

export default {
  uploadFotoComLocalizacao,
  uploadMultiplasFotos,
  uploadPDF,
  excluirArquivo,
  obterGeolocalizacao,
  formatarCoordenadas,
  gerarLinkGoogleMaps,
  comprimirImagem,
  prepararArquivo
}
