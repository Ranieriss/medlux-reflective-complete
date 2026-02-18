<template>
  <div>
    <!-- Cabeçalho -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
        Vínculos / Custódia
      </h1>
      
      <v-btn
        color="primary"
        size="large"
        class="glow-primary"
        @click="abrirDialogNovo"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        Novo Vínculo
      </v-btn>
    </div>

    <!-- Cards de Estatísticas -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="text-h6 text-primary mb-2">Vínculos Ativos</div>
            <div class="text-h3 font-weight-bold">{{ estatisticas.ativos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="text-h6 text-success mb-2">Encerrados</div>
            <div class="text-h3 font-weight-bold">{{ estatisticas.encerrados }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabela de Vínculos -->
    <v-card class="glass">
      <v-data-table
        :headers="headers"
        :items="vinculos"
        :loading="carregando"
        :items-per-page="10"
        class="elevation-0"
      >
        <!-- Equipamento -->
        <template v-slot:item.equipamento="{ item }">
          <div class="font-weight-bold">{{ item.equipamento?.codigo || 'N/A' }}</div>
          <div class="text-caption">{{ item.equipamento?.nome || '' }}</div>
        </template>

        <!-- Usuário -->
        <template v-slot:item.usuario="{ item }">
          <div class="font-weight-bold">{{ item.usuario?.nome || 'N/A' }}</div>
          <div class="text-caption">{{ item.usuario?.email || '' }}</div>
        </template>

        <!-- Data Início -->
        <template v-slot:item.data_inicio="{ item }">
          {{ formatarData(item.data_inicio) }}
        </template>

        <!-- Data Fim -->
        <template v-slot:item.data_fim="{ item }">
          {{ item.data_fim ? formatarData(item.data_fim) : '-' }}
        </template>

        <!-- Status -->
        <template v-slot:item.ativo="{ item }">
          <v-chip
            :color="item.ativo ? 'success' : 'grey'"
            size="small"
            variant="flat"
          >
            {{ item.ativo ? 'Ativo' : 'Encerrado' }}
          </v-chip>
        </template>

        <!-- Ações -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            @click="visualizarVinculo(item)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          
          <v-btn
            v-if="item.ativo"
            icon
            size="small"
            variant="text"
            color="warning"
            @click="encerrarVinculo(item)"
          >
            <v-icon>mdi-link-variant-off</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog Novo/Editar Vínculo -->
    <v-dialog v-model="dialogForm" max-width="600px" persistent>
      <v-card class="glass">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
          <span>Novo Vínculo</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValido">
            <v-row>
              <!-- Equipamento -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="vinculoForm.equipamento_id"
                  :items="equipamentosDisponiveis"
                  item-title="nome_completo"
                  item-value="id"
                  label="Equipamento *"
                  prepend-inner-icon="mdi-devices"
                  variant="outlined"
                  :rules="[regras.required]"
                />
              </v-col>

              <!-- Usuário -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="vinculoForm.usuario_id"
                  :items="usuarios"
                  item-title="nome"
                  item-value="id"
                  label="Usuário *"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :rules="[regras.required]"
                />
              </v-col>

              <!-- Data Início -->
              <v-col cols="12">
                <v-text-field
                  v-model="vinculoForm.data_inicio"
                  label="Data de Início *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  :rules="[regras.required]"
                />
              </v-col>

              <!-- Observações -->
              <v-col cols="12">
                <v-textarea
                  v-model="vinculoForm.observacoes"
                  label="Observações"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="fecharDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="salvando"
            @click="salvarVinculo"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Visualização -->
    <v-dialog v-model="dialogVisualizacao" max-width="600px">
      <v-card v-if="vinculoSelecionado" class="glass">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
          <span>Detalhes do Vínculo</span>
        </v-card-title>

        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title>Equipamento</v-list-item-title>
              <v-list-item-subtitle>{{ vinculoSelecionado.equipamento?.codigo }} - {{ vinculoSelecionado.equipamento?.nome }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Usuário</v-list-item-title>
              <v-list-item-subtitle>{{ vinculoSelecionado.usuario?.nome }} ({{ vinculoSelecionado.usuario?.email }})</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Data de Início</v-list-item-title>
              <v-list-item-subtitle>{{ formatarData(vinculoSelecionado.data_inicio) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="vinculoSelecionado.data_fim">
              <v-list-item-title>Data de Término</v-list-item-title>
              <v-list-item-subtitle>{{ formatarData(vinculoSelecionado.data_fim) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Status</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="vinculoSelecionado.ativo ? 'success' : 'grey'" size="small">
                  {{ vinculoSelecionado.ativo ? 'Ativo' : 'Encerrado' }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="vinculoSelecionado.observacoes">
              <v-list-item-title>Observações</v-list-item-title>
              <v-list-item-subtitle>{{ vinculoSelecionado.observacoes }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogVisualizacao = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      top
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import supabase from '@/services/supabase'
import { format, parseISO } from 'date-fns'

// State
const vinculos = ref([])
const equipamentosDisponiveis = ref([])
const usuarios = ref([])
const carregando = ref(false)
const dialogForm = ref(false)
const dialogVisualizacao = ref(false)
const formValido = ref(false)
const salvando = ref(false)
const formRef = ref(null)
const vinculoSelecionado = ref(null)

// Form
const vinculoForm = ref({
  equipamento_id: null,
  usuario_id: null,
  data_inicio: new Date().toISOString().split('T')[0],
  observacoes: ''
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Headers da tabela
const headers = [
  { title: 'Equipamento', key: 'equipamento', sortable: true },
  { title: 'Usuário', key: 'usuario', sortable: true },
  { title: 'Data Início', key: 'data_inicio', sortable: true },
  { title: 'Data Fim', key: 'data_fim', sortable: true },
  { title: 'Status', key: 'ativo', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' }
]

// Regras de validação
const regras = {
  required: v => !!v || 'Campo obrigatório'
}

// Computed
const estatisticas = computed(() => ({
  ativos: vinculos.value.filter(v => v.ativo).length,
  encerrados: vinculos.value.filter(v => !v.ativo).length
}))

// Functions
const carregarVinculos = async () => {
  carregando.value = true
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        equipamento:equipamentos(id, codigo, nome, modelo, fabricante),
        usuario:usuarios(id, nome, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    vinculos.value = data.map(v => ({
      ...v,
      equipamento: v.equipamento || {},
      usuario: v.usuario || {}
    }))

    console.log(`✅ ${data.length} vínculos carregados`)
  } catch (error) {
    console.error('❌ Erro ao carregar vínculos:', error)
    mostrarSnackbar('Erro ao carregar vínculos', 'error')
  } finally {
    carregando.value = false
  }
}

const carregarEquipamentosDisponiveis = async () => {
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('id, codigo, nome, modelo, fabricante')
      .eq('status', 'ativo')

    if (error) throw error

    equipamentosDisponiveis.value = data.map(e => ({
      ...e,
      nome_completo: `${e.codigo} - ${e.nome || e.modelo || 'Equipamento'}`
    }))
  } catch (error) {
    console.error('❌ Erro ao carregar equipamentos:', error)
  }
}

const carregarUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil')
      .eq('ativo', true)

    if (error) throw error
    usuarios.value = data
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error)
  }
}

const abrirDialogNovo = () => {
  vinculoForm.value = {
    equipamento_id: null,
    usuario_id: null,
    data_inicio: new Date().toISOString().split('T')[0],
    observacoes: ''
  }
  dialogForm.value = true
}

const salvarVinculo = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  salvando.value = true

  try {
    const payload = {
      equipamento_id: vinculoForm.value.equipamento_id,
      usuario_id: vinculoForm.value.usuario_id,
      data_inicio: vinculoForm.value.data_inicio,
      data_fim: vinculoForm.value.data_fim || null,
      observacoes: vinculoForm.value.observacoes || null,
      ativo: true,
      ...(vinculoForm.value.cautela_url !== undefined ? { cautela_url: vinculoForm.value.cautela_url || null } : {}),
      ...(vinculoForm.value.cautela_data_upload !== undefined
        ? { cautela_data_upload: vinculoForm.value.cautela_data_upload || null }
        : {}),
      ...(vinculoForm.value.cautela_data_entrega !== undefined
        ? { cautela_data_entrega: vinculoForm.value.cautela_data_entrega || null }
        : {}),
      ...(vinculoForm.value.cautela_tecnico_responsavel !== undefined
        ? { cautela_tecnico_responsavel: vinculoForm.value.cautela_tecnico_responsavel || null }
        : {}),
      ...(vinculoForm.value.cautela_treinamento_realizado !== undefined
        ? { cautela_treinamento_realizado: !!vinculoForm.value.cautela_treinamento_realizado }
        : {}),
      ...(vinculoForm.value.cautela_observacoes !== undefined
        ? { cautela_observacoes: vinculoForm.value.cautela_observacoes || null }
        : {})
    }

    const { data, error } = await supabase
      .from('vinculos')
      .insert([payload])
      .select()

    if (error) throw error

    mostrarSnackbar('Vínculo criado com sucesso!', 'success')
    await carregarVinculos()
    fecharDialog()
  } catch (error) {
    console.error('❌ Erro ao criar vínculo:', error)
    mostrarSnackbar(isRlsError(error) ? getMensagemErroRls() : `Erro ao criar vínculo: ${error.message}`, 'error')
  } finally {
    salvando.value = false
  }
}

const encerrarVinculo = async (vinculo) => {
  if (!confirm('Deseja realmente encerrar este vínculo?')) return

  try {
    const { error } = await supabase
      .from('vinculos')
      .update({
        ativo: false,
        data_fim: new Date().toISOString()
      })
      .eq('id', vinculo.id)

    if (error) throw error

    mostrarSnackbar('Vínculo encerrado com sucesso!', 'success')
    await carregarVinculos()
  } catch (error) {
    console.error('❌ Erro ao encerrar vínculo:', error)
    mostrarSnackbar(isRlsError(error) ? getMensagemErroRls() : `Erro ao encerrar vínculo: ${error.message}`, 'error')
  }
}

const visualizarVinculo = (vinculo) => {
  vinculoSelecionado.value = vinculo
  dialogVisualizacao.value = true
}

const formatarData = (data) => {
  if (!data) return '-'
  try {
    return format(parseISO(data), 'dd/MM/yyyy')
  } catch {
    return data
  }
}

const fecharDialog = () => {
  dialogForm.value = false
  formRef.value?.resetValidation()
}

const mostrarSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}


const isRlsError = (error) => error?.code === '42501' || error?.status === 403

const getMensagemErroRls = () =>
  'Permissão negada (RLS). Verifique se o usuário está como ADMIN no cadastro e se as policies do Supabase foram aplicadas.'

// Lifecycle
onMounted(async () => {
  await Promise.all([
    carregarVinculos(),
    carregarEquipamentosDisponiveis(),
    carregarUsuarios()
  ])
})
</script>

<style scoped>
.glass {
  background: rgba(21, 25, 51, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 255, 255, 0.1);
}

.glow-primary {
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.6),
              0 0 20px rgba(0, 255, 255, 0.4);
}
</style>
