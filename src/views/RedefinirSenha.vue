<template>
  <v-container fluid class="reset-password-container">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="glass pa-6" elevation="24">
          <!-- Logo e Título -->
          <div class="text-center mb-8">
            <div class="logo-container mb-4">
              <img 
                src="/logo-medlux.svg" 
                alt="MEDLUX Reflective Logo" 
                style="max-width: 280px; width: 100%; height: auto;"
                class="logo-image"
              />
            </div>
            <h2 class="text-h5 font-weight-bold mb-2">
              <v-icon class="mr-2" color="primary">mdi-lock-reset</v-icon>
              Redefinir Senha
            </h2>
            <p class="text-subtitle-1 text-secondary mt-2">
              Digite sua nova senha abaixo
            </p>
          </div>

          <!-- Formulário de Redefinição -->
          <v-form ref="formRef" v-model="formValido" @submit.prevent="redefinirSenha">
            <v-text-field
              v-model="novaSenha"
              label="Nova Senha"
              prepend-inner-icon="mdi-lock"
              :type="mostrarSenha ? 'text' : 'password'"
              :append-inner-icon="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="senhaRules"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              @click:append-inner="mostrarSenha = !mostrarSenha"
            />

            <v-text-field
              v-model="confirmarSenha"
              label="Confirmar Nova Senha"
              prepend-inner-icon="mdi-lock-check"
              :type="mostrarConfirmarSenha ? 'text' : 'password'"
              :append-inner-icon="mostrarConfirmarSenha ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="confirmarSenhaRules"
              variant="outlined"
              density="comfortable"
              class="mb-6"
              @click:append-inner="mostrarConfirmarSenha = !mostrarConfirmarSenha"
            />

            <!-- Mensagem de erro/sucesso -->
            <v-alert
              v-if="mensagem"
              :type="tipoMensagem"
              variant="tonal"
              class="mb-4"
            >
              {{ mensagem }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="carregando"
              :disabled="!formValido || carregando"
              block
              class="mb-4 glow-primary"
            >
              <v-icon left class="mr-2">mdi-check-circle</v-icon>
              Redefinir Senha
            </v-btn>

            <!-- Voltar para login -->
            <div class="text-center">
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="voltarParaLogin"
              >
                <v-icon class="mr-1" size="small">mdi-arrow-left</v-icon>
                Voltar para Login
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, updatePassword } from '@/services/supabase'

const router = useRouter()

// State
const formRef = ref(null)
const formValido = ref(false)
const novaSenha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)
const mostrarConfirmarSenha = ref(false)
const carregando = ref(false)
const mensagem = ref('')
const tipoMensagem = ref('success')
const recoverySessionReady = ref(false)

const normalizeHash = (hash) => hash?.replace(/^#\/?/, '') || ''

const applyHashSession = async () => {
  const normalizedHash = normalizeHash(window.location.hash)

  if (!normalizedHash.includes('access_token')) {
    return false
  }

  const params = new URLSearchParams(normalizedHash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    console.warn('[auth][recovery] hash sem refresh_token, aguardando detectSessionInUrl')
    return false
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  if (error) {
    throw error
  }

  if (window.history?.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  console.warn('[auth][recovery] sessão restaurada via hash da URL')
  return true
}

const waitForRecoverySession = async () => {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (data?.session) {
    return true
  }

  return await new Promise((resolve) => {
    let resolved = false
    const timeoutId = window.setTimeout(() => {
      if (resolved) return
      resolved = true
      subscription?.unsubscribe()
      resolve(false)
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return
      if (!session) return

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'PASSWORD_RECOVERY', 'INITIAL_SESSION'].includes(event)) {
        resolved = true
        window.clearTimeout(timeoutId)
        subscription.unsubscribe()
        console.warn(`[auth][recovery] sessão obtida via onAuthStateChange (${event})`)
        resolve(true)
      }
    })
  })
}

const prepararSessaoRecuperacao = async () => {
  try {
    await applyHashSession()
    recoverySessionReady.value = await waitForRecoverySession()

    if (!recoverySessionReady.value) {
      mensagem.value = 'Link de recuperação inválido ou expirado. Solicite um novo e-mail.'
      tipoMensagem.value = 'error'
      return
    }

    console.warn('[auth][recovery] sessão pronta para redefinição de senha')
  } catch (error) {
    console.warn('[auth][recovery] falha ao restaurar sessão de recuperação:', error?.message)
    mensagem.value = 'Não foi possível validar o link de recuperação. Solicite um novo e-mail.'
    tipoMensagem.value = 'error'
  }
}

// Validações
const senhaRules = [
  v => !!v || 'Senha é obrigatória',
  v => v.length >= 6 || 'Senha deve ter no mínimo 6 caracteres',
  v => /[A-Z]/.test(v) || 'Senha deve conter pelo menos uma letra maiúscula',
  v => /[0-9]/.test(v) || 'Senha deve conter pelo menos um número'
]

const confirmarSenhaRules = [
  v => !!v || 'Confirmação de senha é obrigatória',
  v => v === novaSenha.value || 'As senhas não conferem'
]

// Métodos
const redefinirSenha = async () => {
  const { valid } = await formRef.value.validate()
  
  if (!valid) return

  carregando.value = true
  mensagem.value = ''

  try {
    if (!recoverySessionReady.value) {
      mensagem.value = 'Aguardando validação do link de recuperação. Tente novamente em alguns segundos.'
      tipoMensagem.value = 'warning'
      return
    }

    const resultado = await updatePassword(novaSenha.value)
    
    if (resultado.success) {
      mensagem.value = 'Senha redefinida com sucesso! Redirecionando...'
      tipoMensagem.value = 'success'
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      mensagem.value = resultado.error || 'Erro ao redefinir senha. Tente novamente.'
      tipoMensagem.value = 'error'
    }
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    mensagem.value = 'Erro ao redefinir senha. Tente novamente.'
    tipoMensagem.value = 'error'
  } finally {
    carregando.value = false
  }
}

const voltarParaLogin = () => {
  router.push('/')
}

// Verificar se há um token de redefinição na URL
onMounted(() => {
  prepararSessaoRecuperacao()
})
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #111827 50%, #001F3F 100%);
  position: relative;
  overflow: hidden;
}

.reset-password-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 116, 217, 0.1) 0%, transparent 70%);
  animation: pulse-glow 4s ease-in-out infinite;
}

.logo-container {
  animation: scale-in 0.5s ease-out;
}

.logo-image {
  filter: drop-shadow(0 0 10px rgba(0, 116, 217, 0.3));
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
}

.glass {
  animation: fade-in 0.6s ease-out;
}

.text-secondary {
  color: var(--text-secondary);
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
