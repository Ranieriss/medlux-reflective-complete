/**
 * Composable para gerenciamento de notificações
 * Sistema centralizado de snackbars/toasts
 */

import { ref, reactive } from 'vue'

// Estado global de notificações
const notificacoes = ref([])
let nextId = 1

export function useNotificacoes() {
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'info',
    timeout: 3000
  })

  /**
   * Mostra uma notificação
   */
  function mostrar(texto, tipo = 'info', timeout = 3000) {
    const cores = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info'
    }

    snackbar.show = true
    snackbar.text = texto
    snackbar.color = cores[tipo] || 'info'
    snackbar.timeout = timeout

    // Adicionar à lista de notificações
    const notif = {
      id: nextId++,
      texto,
      tipo,
      timestamp: new Date()
    }
    notificacoes.value.push(notif)

    // Log condicional
    if (import.meta.env.DEV) {
      const emoji = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      console.log(`${emoji[tipo]} Notificação:`, texto)
    }

    // Remover após timeout
    setTimeout(() => {
      const index = notificacoes.value.findIndex(n => n.id === notif.id)
      if (index !== -1) {
        notificacoes.value.splice(index, 1)
      }
    }, timeout + 1000)
  }

  /**
   * Atalhos para tipos específicos
   */
  function sucesso(texto, timeout = 3000) {
    mostrar(texto, 'success', timeout)
  }

  function erro(texto, timeout = 5000) {
    mostrar(texto, 'error', timeout)
  }

  function aviso(texto, timeout = 4000) {
    mostrar(texto, 'warning', timeout)
  }

  function info(texto, timeout = 3000) {
    mostrar(texto, 'info', timeout)
  }

  /**
   * Fecha a notificação atual
   */
  function fechar() {
    snackbar.show = false
  }

  /**
   * Limpa todas as notificações
   */
  function limparTodas() {
    notificacoes.value = []
    snackbar.show = false
  }

  return {
    // State
    snackbar,
    notificacoes,
    
    // Methods
    mostrar,
    sucesso,
    erro,
    aviso,
    info,
    fechar,
    limparTodas
  }
}
