<template>
  <v-container fluid class="login-container">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="glass pa-6" elevation="24">
          <!-- Logo e Título -->
          <div class="text-center mb-8">
            <div class="logo-container mb-4">
              <v-icon size="80" color="primary" class="glow-primary">
                mdi-chart-box
              </v-icon>
            </div>
            <h1 class="text-h4 font-weight-bold mb-2">
              MEDLUX Reflective
            </h1>
            <p class="text-subtitle-1 text-secondary">
              Sistema de Gestão de Equipamentos
            </p>
          </div>

          <!-- Formulário de Login -->
          <v-form ref="formRef" @submit.prevent="handleLogin">
            <v-text-field
              v-model="email"
              label="E-mail"
              prepend-inner-icon="mdi-email"
              type="email"
              :rules="emailRules"
              :error-messages="erro"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              @input="erro = ''"
            />

            <v-text-field
              v-model="senha"
              label="Senha"
              prepend-inner-icon="mdi-lock"
              :type="mostrarSenha ? 'text' : 'password'"
              :append-inner-icon="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="senhaRules"
              :error-messages="erro"
              variant="outlined"
              density="comfortable"
              class="mb-6"
              @click:append-inner="mostrarSenha = !mostrarSenha"
              @input="erro = ''"
            />

            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="carregando"
              :disabled="carregando"
              block
              class="mb-4 glow-primary"
            >
              <v-icon left class="mr-2">mdi-login</v-icon>
              Entrar
            </v-btn>
          </v-form>

          <!-- Credenciais Demo -->
          <v-divider class="my-4" />
          
          <v-expansion-panels variant="accordion" class="mt-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-information</v-icon>
                Credenciais de Acesso Demo
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-caption">
                  <div class="mb-2">
                    <strong class="text-primary">Administrador:</strong><br>
                    E-mail: admin@medlux.com<br>
                    Senha: 2308
                  </div>
                  <div>
                    <strong class="text-accent">Técnico:</strong><br>
                    E-mail: joao.silva@medlux.com<br>
                    Senha: 1234
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const formRef = ref(null)
const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)
const erro = ref('')

// Validações
const emailRules = [
  v => !!v || 'E-mail é obrigatório',
  v => /.+@.+\..+/.test(v) || 'E-mail inválido'
]

const senhaRules = [
  v => !!v || 'Senha é obrigatória',
  v => v.length >= 4 || 'Senha deve ter no mínimo 4 caracteres'
]

// Métodos
const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  
  if (!valid) return

  carregando.value = true
  erro.value = ''

  try {
    const resultado = await authStore.login(email.value, senha.value)
    
    if (resultado.sucesso) {
      router.push('/dashboard')
    } else {
      erro.value = resultado.mensagem
    }
  } catch (error) {
    console.error('Erro no login:', error)
    erro.value = 'Erro ao realizar login. Tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #111827 50%, #001F3F 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
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

.glass {
  animation: fade-in 0.6s ease-out;
}

.text-secondary {
  color: var(--text-secondary);
}
</style>
