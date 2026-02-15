// PATCH 02: Utilitário de Formatação (CPF e Telefone)
// Adicionar em src/utils/formatters.js

/**
 * Formatar CPF: 000.000.000-00
 * @param {string} value - CPF sem formatação
 * @returns {string} CPF formatado
 */
export function formatCPF(value) {
  if (!value) return ''
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica máscara
  return limited
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Formatar Telefone: (00) 00000-0000 ou (00) 0000-0000
 * @param {string} value - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
export function formatTelefone(value) {
  if (!value) return ''
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica máscara (celular ou fixo)
  if (limited.length <= 10) {
    // Fixo: (00) 0000-0000
    return limited
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    // Celular: (00) 00000-0000
    return limited
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
}

/**
 * Remover formatação de CPF
 * @param {string} cpf - CPF formatado
 * @returns {string} CPF apenas números
 */
export function unformatCPF(cpf) {
  if (!cpf) return ''
  return cpf.replace(/\D/g, '')
}

/**
 * Remover formatação de telefone
 * @param {string} telefone - Telefone formatado
 * @returns {string} Telefone apenas números
 */
export function unformatTelefone(telefone) {
  if (!telefone) return ''
  return telefone.replace(/\D/g, '')
}

/**
 * Validar CPF
 * @param {string} cpf - CPF para validar
 * @returns {boolean} true se válido
 */
export function validarCPF(cpf) {
  const numbers = cpf.replace(/\D/g, '')
  
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  let resto
  
  // Primeiro dígito
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(numbers.substring(i - 1, i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numbers.substring(9, 10))) return false
  
  // Segundo dígito
  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(numbers.substring(i - 1, i)) * (12 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(numbers.substring(10, 11))) return false
  
  return true
}

/**
 * Validar telefone
 * @param {string} telefone - Telefone para validar
 * @returns {boolean} true se válido
 */
export function validarTelefone(telefone) {
  const numbers = telefone.replace(/\D/g, '')
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numbers.length < 10 || numbers.length > 11) return false
  
  // DDD deve estar entre 11 e 99
  const ddd = parseInt(numbers.substring(0, 2))
  if (ddd < 11 || ddd > 99) return false
  
  // Se celular, deve começar com 9
  if (numbers.length === 11 && numbers[2] !== '9') return false
  
  return true
}

export default {
  formatCPF,
  formatTelefone,
  unformatCPF,
  unformatTelefone,
  validarCPF,
  validarTelefone
}
