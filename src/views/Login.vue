<template>
  <v-container fluid class="login-container">
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
            <p class="text-subtitle-1 text-secondary mt-2">
              Sistema de Gestão de Equipamentos
            </p>
          </div>

          <v-alert
            v-if="!hasSupabaseEnv"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-medium mb-1">{{ supabaseEnvErrorMessage }}</div>
            <div class="text-caption">Configure <strong>VITE_SUPABASE_URL</strong> (https://&lt;project&gt;.supabase.co) e <strong>VITE_SUPABASE_ANON_KEY</strong> (JWT iniciando com eyJ...).</div>
            <div class="text-caption">Se estiver usando <strong>sb_publishable_...</strong> ou <strong>service_role</strong>, substitua pela chave anon/public correta.</div>
            <div class="text-caption">No Vercel: Project → Settings → Environment Variables (Production, Preview e Development) e faça novo deploy.</div>
          </v-alert>


          <v-expansion-panels
            v-if="diagnosticoDisponivel"
            variant="accordion"
            class="mb-4"
          >
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-stethoscope</v-icon>
                Diagnóstico Supabase
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-caption">
                  <div><strong>Hostname:</strong> {{ diagnosticoSupabase.hostname }}</div>
                  <div><strong>URL definida:</strong> {{ diagnosticoSupabase.urlDefinida ? 'sim' : 'não' }}</div>
                  <div><strong>Key definida:</strong> {{ diagnosticoSupabase.keyDefinida ? 'sim' : 'não' }}</div>
                  <div><strong>Fonte da key:</strong> {{ diagnosticoSupabase.fonteKey || 'não definida' }}</div>
                  <div><strong>Key mascarada:</strong> {{ diagnosticoSupabase.keyMascarada }}</div>
                  <div><strong>Env OK:</strong> {{ diagnosticoSupabase.envOk ? 'sim' : 'não' }}</div>
                  <div><strong>Supabase client:</strong> {{ diagnosticoSupabase.clientOk ? 'ok' : 'indisponível' }}</div>
                  <div><strong>Sessão:</strong> {{ diagnosticoSupabase.sessionStatus }}</div>
                  <div><strong>Perfil carregado:</strong> {{ diagnosticoSupabase.perfilStatus }}</div>
                  <div><strong>Teste trechos_medicao:</strong> {{ diagnosticoSupabase.trechosStatus }}</div>
                  <div><strong>Teste leituras_medicao:</strong> {{ diagnosticoSupabase.leiturasStatus }}</div>
                  <v-btn size="small" variant="text" class="mt-2" @click="executarDiagnostico">
                    Reexecutar diagnóstico
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>


          <v-alert
            v-if="mensagemStatus"
            :type="tipoMensagemStatus"
            variant="tonal"
            class="mb-4"
          >
            {{ mensagemStatus }}
          </v-alert>

          <v-alert
            v-if="erro"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <div class="font-weight-medium mb-1">{{ erro }}</div>
            <div class="text-caption">etapa: {{ etapaErro || 'n/a' }}</div>
            <div class="text-caption">status: {{ erroDetalhes.status ?? 'n/a' }}</div>
            <div class="text-caption">message: {{ erroDetalhes.message || 'n/a' }}</div>
            <div class="text-caption">code: {{ erroDetalhes.code || 'n/a' }}</div>
            <div v-if="precisaConfirmarEmail" class="text-caption mt-2">
              Dica: usuário precisa confirmar e-mail no Supabase.
            </div>
          </v-alert>

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

            <!-- Botão Esqueci a Senha -->
            <div class="text-center">
              <v-btn
                variant="text"
                color="primary"
                size="small"
                @click="abrirRecuperacaoSenha"
              >
                <v-icon class="mr-1" size="small">mdi-lock-reset</v-icon>
                Esqueci minha senha
              </v-btn>
            </div>
          </v-form>

          <!-- Dialog de Recuperação de Senha -->
          <v-dialog v-model="dialogRecuperacao" max-width="500px">
            <v-card class="glass">
              <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h5">
                  <v-icon class="mr-2" color="primary">mdi-lock-reset</v-icon>
                  Recuperar Senha
                </span>
                <v-btn icon variant="text" @click="dialogRecuperacao = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <p class="text-body-2 mb-4">
                  Digite seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
                </p>

                <v-form ref="formRecuperacaoRef" @submit.prevent="enviarRecuperacao">
                  <v-text-field
                    v-model="emailRecuperacao"
                    label="E-mail"
                    prepend-inner-icon="mdi-email"
                    type="email"
                    :rules="emailRules"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-form>

                <!-- Mensagem de sucesso/erro -->
                <v-alert
                  v-if="mensagemRecuperacao"
                  :type="tipoMensagemRecuperacao"
                  variant="tonal"
                  class="mt-4"
                >
                  {{ mensagemRecuperacao }}
                </v-alert>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn
                  variant="text"
                  @click="dialogRecuperacao = false"
                >
                  Cancelar
                </v-btn>
                <v-btn
                  color="primary"
                  :loading="enviandoRecuperacao"
                  :disabled="enviandoRecuperacao"
                  @click="enviarRecuperacao"
                >
                  <v-icon class="mr-2">mdi-email-send</v-icon>
                  Enviar Link
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

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
                    <strong class="text-main">Administrador:</strong><br>
                    E-mail: admin@medlux.com<br>
                    Senha: 2308
                  </div>
                  <div>
                    <strong class="text-secondary">Técnico:</strong><br>
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
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  hasSupabaseEnv,
  maskSupabaseKey,
  resetPassword,
  supabase,
  supabaseAnonKey,
  supabaseEnvErrorMessage,
  supabaseKeySource,
  supabaseUrl
} from '@/services/supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isDev = import.meta.env.DEV
const diagnosticoForcado = route.query.debugSupabase === '1'
const diagnosticoDisponivel = computed(() => isDev || diagnosticoForcado)
const diagnosticoSupabase = computed(() => ({
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'n/a',
  envOk: hasSupabaseEnv,
  clientOk: hasSupabaseEnv && !!supabase,
  urlDefinida: !!supabaseUrl,
  keyDefinida: !!supabaseAnonKey,
  fonteKey: supabaseKeySource,
  keyMascarada: maskSupabaseKey(supabaseAnonKey),
  sessionStatus: diagnosticoRuntime.value.session,
  perfilStatus: diagnosticoRuntime.value.perfil,
  trechosStatus: diagnosticoRuntime.value.trechos,
  leiturasStatus: diagnosticoRuntime.value.leituras
}))


// State
const formRef = ref(null)
const formRecuperacaoRef = ref(null)
const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)
const erro = ref('')
const etapaErro = ref('')
const erroDetalhes = ref({ status: null, message: '', code: null })
const precisaConfirmarEmail = ref(false)
const mensagemStatus = ref('')
const tipoMensagemStatus = ref('success')
const diagnosticoRuntime = ref({ session: 'Pendente', perfil: 'Pendente', trechos: 'Pendente', leituras: 'Pendente' })

// Recuperação de senha
const dialogRecuperacao = ref(false)
const emailRecuperacao = ref('')
const enviandoRecuperacao = ref(false)
const mensagemRecuperacao = ref('')
const tipoMensagemRecuperacao = ref('success')

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
  etapaErro.value = ''
  erroDetalhes.value = { status: null, message: '', code: null }
  precisaConfirmarEmail.value = false
  diagnosticoRuntime.value = { session: 'Executando...', perfil: 'Aguardando', trechos: 'Aguardando', leituras: 'Aguardando' }

  try {
    const resultado = await authStore.login(email.value, senha.value)
    
    if (resultado.sucesso) {
      await executarDiagnostico()
      router.push('/dashboard')
    } else {
      erro.value = resultado.mensagem
      etapaErro.value = resultado.etapa || 'Auth'
      erroDetalhes.value = resultado.detalhes || { status: null, message: '', code: null }
      precisaConfirmarEmail.value = !!resultado.precisaConfirmarEmail
      await executarDiagnostico()
    }
  } catch (error) {
    console.error('Erro no login:', error)
    erro.value = 'Erro ao realizar login. Tente novamente.'
    etapaErro.value = 'Auth'
    erroDetalhes.value = {
      status: error?.status ?? null,
      message: error?.message || 'Erro inesperado no login.',
      code: error?.code ?? null
    }
    precisaConfirmarEmail.value = false
    await executarDiagnostico()
  } finally {
    carregando.value = false
  }
}


const formatDiagError = (prefixo, error) => {
  const code = error?.code || 'n/a'
  const msg = error?.message || 'sem mensagem'
  return `${prefixo} (code=${code}): ${msg}`
}

const executarDiagnostico = async () => {
  if (!hasSupabaseEnv) {
    diagnosticoRuntime.value = {
      session: 'Env inválido',
      perfil: 'Env inválido',
      trechos: 'Env inválido',
      leituras: 'Env inválido'
    }
    return
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const authId = sessionData?.session?.user?.id

  if (sessionError) {
    diagnosticoRuntime.value = {
      session: formatDiagError('Falha na sessão', sessionError),
      perfil: 'Não executado',
      trechos: 'Não executado',
      leituras: 'Não executado'
    }
    return
  }

  diagnosticoRuntime.value.session = authId ? `ok (${authId})` : 'sem sessão ativa'

  if (!authId) {
    diagnosticoRuntime.value.perfil = 'Não executado (sem sessão)'
    diagnosticoRuntime.value.trechos = 'Não executado (sem sessão)'
    diagnosticoRuntime.value.leituras = 'Não executado (sem sessão)'
    return
  }

  let usuario = null
  let perfilError = null

  const perfilByUserId = await supabase
    .from('usuarios')
    .select('id, perfil, user_id, auth_user_id')
    .eq('user_id', authId)
    .maybeSingle()

  usuario = perfilByUserId.data
  perfilError = perfilByUserId.error

  if (perfilError && (perfilError.code === '42703' || (perfilError.message || '').toLowerCase().includes('user_id'))) {
    const perfilByAuthId = await supabase
      .from('usuarios')
      .select('id, perfil, user_id, auth_user_id')
      .eq('auth_user_id', authId)
      .maybeSingle()

    usuario = perfilByAuthId.data
    perfilError = perfilByAuthId.error
  }

  if (!usuario && !perfilError) {
    const perfilById = await supabase
      .from('usuarios')
      .select('id, perfil, user_id, auth_user_id')
      .eq('id', authId)
      .maybeSingle()

    usuario = perfilById.data
    perfilError = perfilById.error
  }

  diagnosticoRuntime.value.perfil = perfilError
    ? formatDiagError('Falha no perfil', perfilError)
    : usuario
      ? `ok (id=${usuario.id}, perfil=${usuario.perfil})`
      : 'sem cadastro em public.usuarios'

  const { error: trechosError } = await supabase.from('trechos_medicao').select('id').limit(1)
  diagnosticoRuntime.value.trechos = trechosError
    ? formatDiagError('Falha', trechosError)
    : 'ok'

  const { data: leiturasData, error: leiturasError } = await supabase
    .from('leituras_medicao')
    .select('id')
    .limit(5)

  diagnosticoRuntime.value.leituras = leiturasError
    ? formatDiagError('Falha', leiturasError)
    : `ok (${leiturasData?.length || 0} registro(s))`
}

// Recuperação de senha
const abrirRecuperacaoSenha = () => {
  dialogRecuperacao.value = true
  emailRecuperacao.value = ''
  mensagemRecuperacao.value = ''
}


onMounted(async () => {
  if (route.query.status === 'senha-atualizada') {
    mensagemStatus.value = 'Senha atualizada com sucesso. Faça login com sua nova senha.'
    tipoMensagemStatus.value = 'success'
    router.replace({ path: '/login' })
  }

  await executarDiagnostico()
})

const enviarRecuperacao = async () => {
  const { valid } = await formRecuperacaoRef.value.validate()
  
  if (!valid) return

  enviandoRecuperacao.value = true
  mensagemRecuperacao.value = ''

  try {
    // Chamar função real do Supabase
    const resultado = await resetPassword(emailRecuperacao.value)
    
    if (resultado.success) {
      mensagemRecuperacao.value = `Um link de recuperação foi enviado para ${emailRecuperacao.value}. Verifique sua caixa de entrada e spam.`
      tipoMensagemRecuperacao.value = 'success'
      
      // Fechar dialog após 4 segundos
      setTimeout(() => {
        dialogRecuperacao.value = false
      }, 4000)
    } else {
      mensagemRecuperacao.value = resultado.error || 'Erro ao enviar e-mail de recuperação. Verifique se o e-mail está cadastrado.'
      tipoMensagemRecuperacao.value = 'error'
    }
    
  } catch (error) {
    console.error('Erro ao enviar recuperação:', error)
    mensagemRecuperacao.value = 'Erro ao enviar e-mail de recuperação. Tente novamente.'
    tipoMensagemRecuperacao.value = 'error'
  } finally {
    enviandoRecuperacao.value = false
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
</style>
