import { defineStore } from 'pinia'

const MAX_EVENTS = 50
const MAX_REQUESTS = 50

const serializeError = (error) => {
  if (!error) return null
  return {
    message: error.message || String(error),
    stack: error.stack || null,
    name: error.name || null
  }
}

export const useDiagnosticsStore = defineStore('diagnostics', {
  state: () => ({
    events: [],
    requests: []
  }),
  actions: {
    pushEvent(event) {
      const normalized = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        ...event,
        error: serializeError(event?.error)
      }
      this.events = [normalized, ...this.events].slice(0, MAX_EVENTS)
    },
    pushRequest(request) {
      const normalized = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        ...request
      }
      this.requests = [normalized, ...this.requests].slice(0, MAX_REQUESTS)
    },
    captureGlobalError(error, context = {}) {
      this.pushEvent({
        type: 'error',
        message: error?.message || 'Erro global não tratado',
        context,
        error
      })
    },
    captureUnhandledRejection(reason, context = {}) {
      const err = reason instanceof Error ? reason : new Error(String(reason))
      this.pushEvent({
        type: 'unhandledrejection',
        message: err.message,
        context,
        error: err
      })
    }
  }
})
