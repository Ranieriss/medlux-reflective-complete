/**
 * Logger condicional para desenvolvimento e produção
 * Em produção, apenas errors são logados
 */

const IS_DEV = import.meta.env.DEV

class Logger {
  constructor(context = '') {
    this.context = context
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    const contextStr = this.context ? `[${this.context}]` : ''
    return {
      timestamp,
      level,
      context: this.context,
      message,
      data
    }
  }

  _shouldLog(level) {
    // Em produção, logar apenas errors
    if (!IS_DEV && level !== 'error') return false
    return true
  }

  log(message, data = null) {
    if (!this._shouldLog('log')) return
    const formatted = this._formatMessage('LOG', message, data)
    console.log(`${formatted.timestamp} ${this.context}`, message, data || '')
  }

  info(message, data = null) {
    if (!this._shouldLog('info')) return
    const formatted = this._formatMessage('INFO', message, data)
    console.info(`ℹ️ ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  warn(message, data = null) {
    if (!this._shouldLog('warn')) return
    const formatted = this._formatMessage('WARN', message, data)
    console.warn(`⚠️ ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  error(message, data = null) {
    // Errors sempre logados, inclusive em produção
    const formatted = this._formatMessage('ERROR', message, data)
    console.error(`❌ ${formatted.timestamp} ${this.context}`, message, data || '')
    
    // Em produção, enviar para serviço de monitoramento (Sentry)
    if (!IS_DEV && window.Sentry) {
      window.Sentry.captureMessage(message, {
        level: 'error',
        extra: { context: this.context, data }
      })
    }
  }

  debug(message, data = null) {
    if (!IS_DEV) return  // Debug apenas em desenvolvimento
    const formatted = this._formatMessage('DEBUG', message, data)
    console.debug(`🔍 ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  success(message, data = null) {
    if (!this._shouldLog('log')) return
    const formatted = this._formatMessage('SUCCESS', message, data)
    console.log(`✅ ${formatted.timestamp} ${this.context}`, message, data || '')
  }
}

export function createLogger(context) {
  return new Logger(context)
}

// Exportar logger global
export const logger = new Logger()
