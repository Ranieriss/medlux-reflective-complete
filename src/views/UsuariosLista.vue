<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
        Usuários
      </h1>
      <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="abrirDialogNovo">
        Novo Usuário
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card class="glass mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filtros.busca"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              placeholder="Nome ou e-mail"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.perfil"
              label="Perfil"
              :items="perfisUsuario"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtros.status"
              label="Status"
              :items="statusUsuario"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              variant="outlined"
              block
              size="large"
              @click="limparFiltros"
            >
              Limpar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Cards de Usuários -->
    <v-row v-if="!carregando && usuariosFiltrados.length > 0">
      <v-col
        v-for="usuario in usuariosFiltrados"
        :key="usuario.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="glass user-card" hover>
          <v-card-text>
            <!-- Header -->
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" size="64" class="mr-4">
                <span class="text-h5 text-white">{{ getInitials(usuario.nome) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-bold">{{ usuario.nome }}</div>
                <div class="text-caption text-secondary">{{ usuario.email }}</div>
              </div>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item @click="visualizarUsuario(usuario)">
                    <template #prepend>
                      <v-icon>mdi-eye</v-icon>
                    </template>
                    <v-list-item-title>Ver Detalhes</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="editarUsuario(usuario)">
                    <template #prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetarSenha(usuario)">
                    <template #prepend>
                      <v-icon>mdi-lock-reset</v-icon>
                    </template>
                    <v-list-item-title>Resetar Senha</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="confirmarExclusao(usuario)">
                    <template #prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title class="text-error">Excluir</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <!-- Info -->
            <v-divider class="mb-3" />

            <div class="mb-2">
              <v-chip
                :color="getPerfilColor(usuario.perfil)"
                size="small"
                variant="flat"
              >
                <v-icon start size="small">{{ getPerfilIcon(usuario.perfil) }}</v-icon>
                {{ formatarPerfil(usuario.perfil) }}
              </v-chip>
              <v-chip
                :color="usuario.ativo ? 'success' : 'error'"
                size="small"
                variant="flat"
                class="ml-2"
              >
                <v-icon start size="small">
                  {{ usuario.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
                {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
              </v-chip>
            </div>

            <!-- Dados de Contato -->
            <v-row dense class="mt-3">
              <v-col v-if="usuario.cpf" cols="12">
                <div class="d-flex align-center text-caption">
                  <v-icon size="16" class="mr-1" color="primary">mdi-card-account-details</v-icon>
                  <span>CPF: {{ formatarCPF(usuario.cpf) }}</span>
                </div>
              </v-col>
              <v-col v-if="usuario.telefone" cols="12">
                <div class="d-flex align-center text-caption">
                  <v-icon size="16" class="mr-1" color="success">mdi-phone</v-icon>
                  <span>{{ usuario.telefone }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="d-flex align-center text-caption">
                  <v-icon size="16" class="mr-1" color="warning">mdi-lock</v-icon>
                  <span class="mr-2">Senha:</span>
                  <v-chip 
                    size="x-small" 
                    color="grey-darken-2"
                    @click="verSenha(usuario)"
                    style="cursor: pointer;"
                  >
                    {{ senhaVisivel[usuario.id] ? usuario.senha_hash : '••••••••' }}
                    <v-icon size="14" class="ml-1">
                      {{ senhaVisivel[usuario.id] ? 'mdi-eye-off' : 'mdi-eye' }}
                    </v-icon>
                  </v-chip>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    @click="copiarSenha(usuario.senha_hash)"
                    class="ml-1"
                  >
                    <v-icon size="14">mdi-content-copy</v-icon>
                    <v-tooltip activator="parent" location="top">Copiar senha</v-tooltip>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
            
            <!-- Documentos (Foto e Cautela) -->
            <v-row dense class="mt-2" v-if="usuario.foto_url || usuario.cautela_url">
              <v-col cols="12">
                <v-divider class="mb-2" />
                <div class="text-caption text-medium-emphasis mb-2">Documentos:</div>
              </v-col>
              <v-col v-if="usuario.foto_url" cols="6">
                <v-btn
                  size="small"
                  color="info"
                  variant="tonal"
                  block
                  :href="usuario.foto_url"
                  target="_blank"
                  prepend-icon="mdi-camera"
                >
                  Ver Foto
                </v-btn>
              </v-col>
              <v-col v-if="usuario.cautela_url" cols="6">
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  block
                  :href="usuario.cautela_url"
                  target="_blank"
                  prepend-icon="mdi-file-document"
                >
                  Ver Cautela
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Stats -->
            <v-row dense class="mt-2">
              <v-col cols="12">
                <div class="d-flex align-center text-caption text-secondary">
                  <v-icon size="16" class="mr-1">mdi-calendar-clock</v-icon>
                  <span>Último acesso: {{ formatarDataHora(usuario.ultimo_acesso) || 'Nunca' }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="d-flex align-center text-caption text-secondary">
                  <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                  <span>Criado em: {{ formatarData(usuario.created_at) }}</span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="carregando">
      <v-col v-for="i in 6" :key="i" cols="12" md="6" lg="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- No Data -->
    <v-card v-if="!carregando && usuariosFiltrados.length === 0" class="glass">
      <v-card-text class="text-center pa-8">
        <v-icon size="64" color="secondary" class="mb-4">mdi-account-off</v-icon>
        <p class="text-h6">Nenhum usuário encontrado</p>
        <p class="text-secondary">Crie o primeiro usuário clicando no botão acima</p>
      </v-card-text>
    </v-card>

    <!-- Dialog Formulário -->
    <v-dialog v-model="dialogForm" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="primary">mdi-account</v-icon>
          {{ modoEdicao ? 'Editar Usuário' : 'Novo Usuário' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="fecharDialog" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValido" @submit.prevent="salvarUsuario">
            <v-row>
              <!-- Nome -->
              <v-col cols="12">
                <v-text-field
                  v-model="usuarioForm.nome"
                  label="Nome Completo *"
                  :rules="[v => !!v || 'Nome é obrigatório']"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                />
              </v-col>

              <!-- CPF -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="usuarioForm.cpf"
                  label="CPF *"
                  :rules="cpfRules"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-card-account-details"
                  placeholder="000.000.000-00"
                  maxlength="14"
                  @input="formatarCPFInput"
                />
              </v-col>

              <!-- Telefone -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="usuarioForm.telefone"
                  label="Telefone *"
                  :rules="telefoneRules"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone"
                  placeholder="(00) 00000-0000"
                  maxlength="15"
                  @input="formatarTelefoneInput"
                />
              </v-col>

              <!-- Email -->
              <v-col cols="12">
                <v-text-field
                  v-model="usuarioForm.email"
                  label="E-mail *"
                  type="email"
                  :rules="emailRules"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-email"
                  :disabled="modoEdicao"
                />
              </v-col>

              <!-- Senha -->
              <v-col cols="12">
                <v-text-field
                  v-model="usuarioForm.senha"
                  :label="modoEdicao ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'"
                  :type="mostrarSenha ? 'text' : 'password'"
                  :rules="modoEdicao ? [] : senhaRules"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="mostrarSenha = !mostrarSenha"
                  :hint="modoEdicao ? 'Deixe em branco para manter a senha atual' : 'Mínimo 4 caracteres'"
                  persistent-hint
                />
              </v-col>

              <!-- Perfil -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="usuarioForm.perfil"
                  label="Perfil *"
                  :items="perfisUsuario"
                  :rules="[v => !!v || 'Perfil é obrigatório']"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-shield-account"
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="usuarioForm.ativo"
                  label="Usuário Ativo"
                  color="success"
                  hide-details
                  inset
                />
              </v-col>

              <!-- Foto URL -->
              <v-col cols="12">
                <v-text-field
                  v-model="usuarioForm.foto_url"
                  label="URL da Foto do Usuário"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-camera"
                  placeholder="https://drive.google.com/..."
                  hint="Cole o link público da foto (Google Drive, Dropbox, etc.)"
                  persistent-hint
                />
              </v-col>

              <!-- Cautela URL -->
              <v-col cols="12">
                <v-text-field
                  v-model="usuarioForm.cautela_url"
                  label="URL da Cautela Assinada"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-file-document"
                  placeholder="https://drive.google.com/..."
                  hint="Cole o link público do termo de responsabilidade assinado"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="fecharDialog" :disabled="salvando">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="salvarUsuario"
            :loading="salvando"
            :disabled="!formValido"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Visualização -->
    <v-dialog v-model="dialogVisualizacao" max-width="600">
      <v-card v-if="usuarioSelecionado">
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="primary">mdi-eye</v-icon>
          Detalhes do Usuário
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialogVisualizacao = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <!-- Avatar e Nome -->
          <div class="text-center mb-6">
            <v-avatar color="primary" size="96" class="mb-4">
              <span class="text-h4 text-white">{{ getInitials(usuarioSelecionado.nome) }}</span>
            </v-avatar>
            <div class="text-h5 font-weight-bold">{{ usuarioSelecionado.nome }}</div>
            <div class="text-body-2 text-secondary">{{ usuarioSelecionado.email }}</div>
          </div>

          <!-- Status e Perfil -->
          <div class="text-center mb-6">
            <v-chip
              :color="getPerfilColor(usuarioSelecionado.perfil)"
              size="large"
              variant="flat"
              class="mr-2"
            >
              <v-icon start>{{ getPerfilIcon(usuarioSelecionado.perfil) }}</v-icon>
              {{ formatarPerfil(usuarioSelecionado.perfil) }}
            </v-chip>
            <v-chip
              :color="usuarioSelecionado.ativo ? 'success' : 'error'"
              size="large"
              variant="flat"
            >
              <v-icon start>
                {{ usuarioSelecionado.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
              {{ usuarioSelecionado.ativo ? 'Ativo' : 'Inativo' }}
            </v-chip>
          </div>

          <v-divider class="mb-4" />

          <!-- Informações -->
          <v-row>
            <v-col cols="12">
              <div class="text-caption text-secondary mb-1">ÚLTIMO ACESSO</div>
              <div class="text-body-1">
                {{ formatarDataHora(usuarioSelecionado.ultimo_acesso) || 'Nunca acessou' }}
              </div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-secondary mb-1">CRIADO EM</div>
              <div class="text-body-1">{{ formatarDataHora(usuarioSelecionado.created_at) }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-secondary mb-1">ATUALIZADO EM</div>
              <div class="text-body-1">{{ formatarDataHora(usuarioSelecionado.updated_at) }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Exclusão -->
    <v-dialog v-model="dialogExcluir" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Confirmar Exclusão
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <p>Tem certeza que deseja excluir este usuário?</p>
          <v-alert type="warning" variant="tonal" class="mt-4">
            Esta ação não pode ser desfeita! Todos os vínculos e históricos associados serão removidos.
          </v-alert>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogExcluir = false" :disabled="excluindo">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="excluirUsuario"
            :loading="excluindo"
          >
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Resetar Senha -->
    <v-dialog v-model="dialogResetSenha" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="warning">mdi-lock-reset</v-icon>
          Resetar Senha
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-text-field
            v-model="novaSenha"
            label="Nova Senha *"
            :type="mostrarNovaSenha ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="mostrarNovaSenha ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="mostrarNovaSenha = !mostrarNovaSenha"
            hint="Mínimo de 6 caracteres"
            persistent-hint
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogResetSenha = false" :disabled="resetandoSenha">
            Cancelar
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="confirmarResetSenha"
            :loading="resetandoSenha"
            :disabled="!novaSenha || novaSenha.length < 6"
          >
            Resetar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/services/supabase'
import { formatCPF, formatTelefone, unformatCPF, unformatTelefone, validarCPF, validarTelefone } from '@/utils/formatters'

// State
const usuarios = ref([])
const carregando = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const resetandoSenha = ref(false)
const dialogForm = ref(false)
const dialogVisualizacao = ref(false)
const dialogExcluir = ref(false)
const dialogResetSenha = ref(false)
const modoEdicao = ref(false)
const formValido = ref(false)
const formRef = ref(null)
const usuarioSelecionado = ref(null)
const usuarioParaExcluir = ref(null)
const usuarioParaResetSenha = ref(null)
const mostrarSenha = ref(false)
const mostrarNovaSenha = ref(false)
const novaSenha = ref('')
const realtimeSubscription = ref(null)
const senhaVisivel = ref({}) // Controla visibilidade por usuário

// Filtros
const filtros = ref({
  busca: '',
  perfil: null,
  status: null
})

// Form
const usuarioForm = ref({
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  senha: '',
  perfil: 'operador',
  ativo: true,
  foto_url: '',
  cautela_url: ''
})

// Options
const perfisUsuario = [
  { title: 'Administrador', value: 'administrador' },
  { title: 'Técnico', value: 'tecnico' },
  { title: 'Operador', value: 'operador' }
]

const statusUsuario = [
  { title: 'Ativo', value: true },
  { title: 'Inativo', value: false }
]

// Validation Rules
const emailRules = [
  v => !!v || 'E-mail é obrigatório',
  v => /.+@.+\..+/.test(v) || 'E-mail inválido'
]

const senhaRules = [
  v => !!v || 'Senha é obrigatória',
  v => v.length >= 4 || 'Senha deve ter no mínimo 4 caracteres'
]

const cpfRules = [
  v => !!v || 'CPF é obrigatório',
  v => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v) || 'CPF inválido'
]

const telefoneRules = [
  v => !!v || 'Telefone é obrigatório',
  v => /^\(\d{2}\) \d{5}-\d{4}$/.test(v) || 'Telefone inválido'
]


const formatarErroSupabase = (error) => {
  const status = error?.status || null
  const code = error?.code || null
  const hint = error?.hint || null
  const message = error?.message || 'Erro inesperado.'

  if (code === '23505') return 'E-mail já cadastrado'
  if (status === 403) return 'Sem permissão para esta ação'

  return `Erro: ${message} (status=${status || 'n/a'}, code=${code || 'n/a'}${hint ? `, hint=${hint}` : ''})`
}

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const usuariosFiltrados = computed(() => {
  let resultado = [...usuarios.value]

  // Filtro de busca
  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    resultado = resultado.filter(u => 
      u.nome?.toLowerCase().includes(busca) ||
      u.email?.toLowerCase().includes(busca)
    )
  }

  // Filtro de perfil
  if (filtros.value.perfil) {
    resultado = resultado.filter(u => u.perfil === filtros.value.perfil)
  }

  // Filtro de status
  if (filtros.value.status !== null) {
    resultado = resultado.filter(u => u.ativo === filtros.value.status)
  }

  return resultado
})

// Methods
const carregarUsuarios = async () => {
  try {
    carregando.value = true
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, cpf, telefone, senha_hash, perfil, ativo, foto_url, cautela_url, ultimo_acesso, created_at, updated_at')
      .order('nome')

    if (error) throw error

    usuarios.value = data || []
    console.log('✅ Usuários carregados:', usuarios.value.length)
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error)
    mostrarSnackbar(formatarErroSupabase(error), 'error')
  } finally {
    carregando.value = false
  }
}

const abrirDialogNovo = () => {
  modoEdicao.value = false
  usuarioForm.value = {
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    senha: '',
    perfil: 'tecnico',
    ativo: true,
    foto_url: '',
    cautela_url: ''
  }
  dialogForm.value = true
}

const editarUsuario = (usuario) => {
  modoEdicao.value = true
  usuarioForm.value = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cpf: formatCPF(usuario.cpf || ''),
    telefone: formatTelefone(usuario.telefone || ''),
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    foto_url: usuario.foto_url || '',
    cautela_url: usuario.cautela_url || ''
  }
  dialogForm.value = true
}

const salvarUsuario = async () => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    salvando.value = true

    // Preparar dados (remover formatação)
    const cpfLimpo = unformatCPF(usuarioForm.value.cpf)
    const telefoneLimpo = unformatTelefone(usuarioForm.value.telefone)

    if (modoEdicao.value) {
      // Update
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: usuarioForm.value.nome,
          cpf: cpfLimpo || null,
          telefone: telefoneLimpo || null,
          perfil: usuarioForm.value.perfil,
          ativo: usuarioForm.value.ativo,
          foto_url: usuarioForm.value.foto_url || null,
          cautela_url: usuarioForm.value.cautela_url || null
        })
        .eq('id', usuarioForm.value.id)

      if (error) throw error
      mostrarSnackbar('Usuário atualizado com sucesso!', 'success')
    } else {
      // Insert - senha será guardada como texto simples (em produção use bcrypt)
      const { error } = await supabase
        .from('usuarios')
        .insert([{
          nome: usuarioForm.value.nome,
          email: (usuarioForm.value.email || '').trim().toLowerCase(),
          cpf: cpfLimpo || null,
          telefone: telefoneLimpo || null,
          senha_hash: usuarioForm.value.senha, // TODO: Hash em produção
          perfil: usuarioForm.value.perfil,
          ativo: usuarioForm.value.ativo,
          foto_url: usuarioForm.value.foto_url || null,
          cautela_url: usuarioForm.value.cautela_url || null
        }])

      if (error) throw error
      mostrarSnackbar('Usuário criado com sucesso!', 'success')
    }

    fecharDialog()
    await carregarUsuarios()
  } catch (error) {
    console.error('❌ Erro ao salvar usuário:', error)
    if (error?.code === '23505') {
      mostrarSnackbar('E-mail já cadastrado', 'warning')
    } else {
      mostrarSnackbar(formatarErroSupabase(error), 'error')
    }
  } finally {
    salvando.value = false
  }
}

const visualizarUsuario = (usuario) => {
  usuarioSelecionado.value = usuario
  dialogVisualizacao.value = true
}

const resetarSenha = (usuario) => {
  usuarioParaResetSenha.value = usuario
  novaSenha.value = ''
  dialogResetSenha.value = true
}

const confirmarResetSenha = async () => {
  if (!usuarioParaResetSenha.value || !novaSenha.value) return

  try {
    resetandoSenha.value = true

    const { error } = await supabase
      .from('usuarios')
      .update({ senha_hash: novaSenha.value }) // TODO: Hash em produção
      .eq('id', usuarioParaResetSenha.value.id)

    if (error) throw error

    mostrarSnackbar('Senha resetada com sucesso!', 'success')
    dialogResetSenha.value = false
    usuarioParaResetSenha.value = null
    novaSenha.value = ''
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
    mostrarSnackbar(formatarErroSupabase(error), 'error')
  } finally {
    resetandoSenha.value = false
  }
}

const confirmarExclusao = (usuario) => {
  usuarioParaExcluir.value = usuario
  dialogExcluir.value = true
}

const excluirUsuario = async () => {
  if (!usuarioParaExcluir.value) return

  try {
    excluindo.value = true

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioParaExcluir.value.id)

    if (error) throw error

    mostrarSnackbar('Usuário excluído com sucesso!', 'success')
    dialogExcluir.value = false
    usuarioParaExcluir.value = null
    await carregarUsuarios()
  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error)
    mostrarSnackbar(formatarErroSupabase(error), 'error')
  } finally {
    excluindo.value = false
  }
}

const fecharDialog = () => {
  dialogForm.value = false
  if (formRef.value) {
    formRef.value.reset()
  }
}

const limparFiltros = () => {
  filtros.value = {
    busca: '',
    perfil: null,
    status: null
  }
}

const getInitials = (nome) => {
  if (!nome) return '??'
  const parts = nome.split(' ')
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatarPerfil = (perfil) => {
  const perfis = {
    administrador: 'Administrador',
    tecnico: 'Técnico',
    operador: 'Operador'
  }
  return perfis[perfil] || perfil
}

const getPerfilColor = (perfil) => {
  const colors = {
    administrador: 'error',
    tecnico: 'primary',
    operador: 'secondary'
  }
  return colors[perfil] || 'grey'
}

const getPerfilIcon = (perfil) => {
  const icons = {
    administrador: 'mdi-shield-crown',
    tecnico: 'mdi-account-wrench',
    operador: 'mdi-account-cog'
  }
  return icons[perfil] || 'mdi-account'
}

const formatarCPF = (cpf) => {
  if (!cpf) return '-'
  // Remove tudo que não é dígito
  const numeros = cpf.replace(/\D/g, '')
  // Formata: 000.000.000-00
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const verSenha = (usuario) => {
  senhaVisivel.value[usuario.id] = !senhaVisivel.value[usuario.id]
}

const copiarSenha = async (senha) => {
  try {
    await navigator.clipboard.writeText(senha)
    mostrarSnackbar('Senha copiada!', 'success')
  } catch (error) {
    console.error('Erro ao copiar senha:', error)
    mostrarSnackbar('Erro ao copiar senha', 'error')
  }
}

const formatarData = (data) => {
  if (!data) return '-'
  try {
    return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return data
  }
}

const formatarDataHora = (data) => {
  if (!data) return null
  try {
    return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return data
  }
}

const mostrarSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Realtime subscription
const setupRealtimeSubscription = () => {
  realtimeSubscription.value = supabase
    .channel('usuarios-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'usuarios'
      },
      (payload) => {
        console.log('🔄 Usuário atualizado em tempo real:', payload)
        carregarUsuarios()
      }
    )
    .subscribe()
}

// Formatação de CPF e Telefone
const formatarCPFInput = (event) => {
  const input = event.target
  const value = input.value
  const formatted = formatCPF(value)
  usuarioForm.value.cpf = formatted
  // Atualizar cursor
  setTimeout(() => {
    input.setSelectionRange(formatted.length, formatted.length)
  }, 0)
}

const formatarTelefoneInput = (event) => {
  const input = event.target
  const value = input.value
  const formatted = formatTelefone(value)
  usuarioForm.value.telefone = formatted
  // Atualizar cursor
  setTimeout(() => {
    input.setSelectionRange(formatted.length, formatted.length)
  }, 0)
}

const formatarCPFDisplay = (cpf) => {
  return formatCPF(cpf)
}

// Lifecycle
onMounted(async () => {
  await carregarUsuarios()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  if (realtimeSubscription.value) {
    supabase.removeChannel(realtimeSubscription.value)
  }
})
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
}

.user-card {
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
}
</style>
