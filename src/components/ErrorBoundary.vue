<template>
  <div v-if="error" class="error-boundary">
    <v-alert
      type="error"
      prominent
      border="start"
      closable
      @click:close="resetError"
    >
      <v-alert-title>
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        Ocorreu um erro inesperado
      </v-alert-title>

      <div class="mt-2">
        <p>{{ error.message }}</p>
        <v-btn
          size="small"
          variant="outlined"
          @click="resetError"
          class="mt-2"
        >
          Tentar Novamente
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          @click="goHome"
          class="mt-2 ml-2"
        >
          Voltar ao Início
        </v-btn>
      </div>

      <!-- Detalhes técnicos (apenas em dev) -->
      <v-expand-transition>
        <div v-if="showDetails && isDev" class="mt-4">
          <v-divider class="my-2" />
          <pre class="text-caption">{{ error.stack }}</pre>
        </div>
      </v-expand-transition>
      
      <v-btn
        v-if="isDev"
        size="small"
        variant="text"
        @click="showDetails = !showDetails"
        class="mt-2"
      >
        {{ showDetails ? 'Ocultar' : 'Ver' }} Detalhes
      </v-btn>
    </v-alert>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { useDiagnosticsStore } from '@/stores/diagnostics'

const router = useRouter()
const error = ref(null)
const showDetails = ref(false)
const isDev = import.meta.env.DEV
const diagnosticsStore = useDiagnosticsStore()

onErrorCaptured((err, instance, info) => {
  error.value = {
    message: err.message,
    stack: err.stack,
    info,
    component: instance?.$options?.name
  }
  
  // Log em produção (enviar para Sentry futuramente)
  if (!isDev && window.Sentry) {
    window.Sentry.captureException(err, {
      contexts: {
        vue: {
          component: instance?.$options?.name,
          info
        }
      }
    })
  }
  
  diagnosticsStore.pushEvent({
    type: 'vue-error-captured',
    message: err.message,
    context: { info, component: instance?.$options?.name },
    error: err
  })

  console.error('Error captured:', err)
  
  // Prevenir propagação
  return false
})

const resetError = () => {
  error.value = null
}

const goHome = () => {
  error.value = null
  router.push('/dashboard')
}
</script>

<style scoped>
.error-boundary {
  padding: 24px;
}

pre {
  background: rgba(0, 0, 0, 0.1);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}
</style>
