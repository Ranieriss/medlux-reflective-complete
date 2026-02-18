<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
        Vínculos / Custódia
      </h1>
      <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="abrirDialogNovo">
        Novo Vínculo
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
              placeholder="Equipamento ou usuário"
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
              :items="statusVinculo"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.dataInicio"
              label="Data Início"
              type="date"
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

    <!-- Tabela de Vínculos -->
    <v-card class="glass">
      <v-data-table
        :headers="headers"
        :items="vinculosFiltrados"
        :loading="carregando"
        items-per-page="10"
        class="elevation-0"
      >
        <!-- Coluna Equipamento -->
        <template #item.equipamento="{ item }">
          <div class="py-2">
            <div class="font-weight-bold">{{ item.equipamento_codigo }}</div>
            <div class="text-caption text-secondary">{{ item.equipamento_nome }}</div>
          </div>
        </template>

        <!-- Coluna Usuário -->
        <template #item.usuario="{ item }">
          <div class="py-2">
            <div class="font-weight-bold">{{ item.usuario_nome }}</div>
            <div class="text-caption text-secondary">{{ item.usuario_email }}</div>
          </div>
        </template>

        <!-- Coluna Status -->
        <template #item.status="{ item }">
          <v-chip
            :color="item.ativo ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            <v-icon start size="small">
              {{ item.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            {{ item.ativo ? 'Ativo' : 'Finalizado' }}
          </v-chip>
        </template>

        <!-- Coluna Data Início -->
        <template #item.data_inicio="{ item }">
          {{ formatarData(item.data_inicio) }}
        </template>

        <!-- Coluna Data Fim -->
        <template #item.data_fim="{ item }">
          {{ item.data_fim ? formatarData(item.data_fim) : '-' }}
        </template>

        <!-- Coluna Duração -->
        <template #item.duracao="{ item }">
          {{ calcularDuracao(item) }}
        </template>

        <!-- Coluna Ações -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="info"
              @click="visualizarVinculo(item)"
            />
            <v-btn
              v-if="item.ativo"
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click="editarVinculo(item)"
            />
            <v-btn
              v-if="item.ativo"
              icon="mdi-close-circle"
              size="small"
              variant="text"
              color="error"
              @click="finalizarVinculo(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmarExclusao(item)"
            />
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center pa-8">
            <v-icon size="64" color="secondary" class="mb-4">mdi-link-variant-off</v-icon>
            <p class="text-h6">Nenhum vínculo encontrado</p>
            <p class="text-secondary">Crie o primeiro vínculo clicando no botão acima</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog Formulário -->
    <v-dialog v-model="dialogForm" max-width="800" persistent>
      <v-card>
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="primary">mdi-link-variant</v-icon>
          {{ modoEdicao ? 'Editar Vínculo' : 'Novo Vínculo' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="fecharDialog" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="formRef" v-model="formValido" @submit.prevent="salvarVinculo">
            <v-row>
              <!-- Equipamento -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="vinculoForm.equipamento_id"
                  label="Equipamento *"
                  :items="equipamentos"
                  item-title="display"
                  item-value="id"
                  :rules="[v => !!v || 'Equipamento é obrigatório']"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-devices"
                  :disabled="modoEdicao"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon>mdi-devices</v-icon>
                      </template>
                      <template #title>
                        <strong>{{ item.raw.codigo }}</strong> - {{ item.raw.nome }}
                      </template>
                      <template #subtitle>
                        {{ item.raw.tipo }} | {{ item.raw.localizacao || 'Sem localização' }}
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Usuário -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="vinculoForm.usuario_id"
                  label="Usuário Responsável *"
                  :items="usuarios"
                  item-title="display"
                  item-value="id"
                  :rules="[v => !!v || 'Usuário é obrigatório']"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :disabled="modoEdicao"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-avatar color="primary" size="40">
                          <span class="text-white">{{ item.raw.nome.substring(0, 2).toUpperCase() }}</span>
                        </v-avatar>
                      </template>
                      <template #title>
                        <strong>{{ item.raw.nome }}</strong>
                      </template>
                      <template #subtitle>
                        {{ item.raw.email }} | {{ item.raw.perfil }}
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Data Início -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="vinculoForm.data_inicio"
                  label="Data Início *"
                  type="date"
                  :rules="[v => !!v || 'Data de início é obrigatória']"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-start"
                />
              </v-col>

              <!-- Data Fim -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="vinculoForm.data_fim"
                  label="Data Fim (Opcional)"
                  type="date"
                  :min="vinculoForm.data_inicio"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-end"
                  clearable
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="vinculoForm.ativo"
                  label="Vínculo Ativo"
                  color="success"
                  hide-details
                  inset
                />
              </v-col>

              <!-- Observações -->
              <v-col cols="12">
                <v-textarea
                  v-model="vinculoForm.observacoes"
                  label="Observações"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
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
            @click="salvarVinculo"
            :loading="salvando"
            :disabled="!formValido"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Visualização -->
    <v-dialog v-model="dialogVisualizacao" max-width="700">
      <v-card v-if="vinculoSelecionado">
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="primary">mdi-eye</v-icon>
          Detalhes do Vínculo
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialogVisualizacao = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <!-- Status -->
            <v-col cols="12">
              <v-chip
                :color="vinculoSelecionado.ativo ? 'success' : 'error'"
                size="large"
                variant="flat"
              >
                <v-icon start>
                  {{ vinculoSelecionado.ativo ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
                {{ vinculoSelecionado.ativo ? 'Vínculo Ativo' : 'Vínculo Finalizado' }}
              </v-chip>
            </v-col>

            <!-- Equipamento -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-secondary mb-1">EQUIPAMENTO</div>
                  <div class="text-h6 font-weight-bold">{{ vinculoSelecionado.equipamento_codigo }}</div>
                  <div class="text-body-2">{{ vinculoSelecionado.equipamento_nome }}</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Usuário -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-secondary mb-1">USUÁRIO RESPONSÁVEL</div>
                  <div class="text-h6 font-weight-bold">{{ vinculoSelecionado.usuario_nome }}</div>
                  <div class="text-body-2">{{ vinculoSelecionado.usuario_email }}</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Datas -->
            <v-col cols="12" md="6">
              <div class="text-caption text-secondary mb-1">DATA INÍCIO</div>
              <div class="text-body-1">{{ formatarData(vinculoSelecionado.data_inicio) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-secondary mb-1">DATA FIM</div>
              <div class="text-body-1">
                {{ vinculoSelecionado.data_fim ? formatarData(vinculoSelecionado.data_fim) : 'Em andamento' }}
              </div>
            </v-col>

            <!-- Duração -->
            <v-col cols="12">
              <v-alert type="info" variant="tonal" density="compact">
                <strong>Duração:</strong> {{ calcularDuracao(vinculoSelecionado) }}
              </v-alert>
            </v-col>

            <!-- Observações -->
            <v-col v-if="vinculoSelecionado.observacoes" cols="12">
              <div class="text-caption text-secondary mb-1">OBSERVAÇÕES</div>
              <div class="text-body-2">{{ vinculoSelecionado.observacoes }}</div>
            </v-col>

            <!-- Timestamps -->
            <v-col cols="12">
              <v-divider class="mb-3" />
              <div class="text-caption text-secondary">
                Criado em: {{ formatarDataHora(vinculoSelecionado.created_at) }}
              </div>
              <div class="text-caption text-secondary">
                Atualizado em: {{ formatarDataHora(vinculoSelecionado.updated_at) }}
              </div>
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
          <p>Tem certeza que deseja excluir este vínculo?</p>
          <v-alert type="warning" variant="tonal" class="mt-4">
            Esta ação não pode ser desfeita!
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
            @click="excluirVinculo"
            :loading="excluindo"
          >
            Excluir
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
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/services/supabase'

// State
const vinculos = ref([])
const equipamentos = ref([])
const usuarios = ref([])
const carregando = ref(false)
const salvando = ref(false)
const excluindo = ref(false)
const dialogForm = ref(false)
const dialogVisualizacao = ref(false)
const dialogExcluir = ref(false)
const modoEdicao = ref(false)
const formValido = ref(false)
const formRef = ref(null)
const vinculoSelecionado = ref(null)
const vinculoParaExcluir = ref(null)
const realtimeSubscription = ref(null)

// Filtros
const filtros = ref({
  busca: '',
  status: null,
  dataInicio: null
})

// Form
const vinculoForm = ref({
  equipamento_id: null,
  usuario_id: null,
  data_inicio: format(new Date(), 'yyyy-MM-dd'),
  data_fim: null,
  observacoes: '',
  ativo: true
})

// Options
const statusVinculo = ['Ativo', 'Finalizado']

// Headers
const headers = [
  { title: 'Equipamento', key: 'equipamento', sortable: true },
  { title: 'Usuário', key: 'usuario', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Data Início', key: 'data_inicio', sortable: true },
  { title: 'Data Fim', key: 'data_fim', sortable: true },
  { title: 'Duração', key: 'duracao', sortable: false },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' }
]

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const vinculosFiltrados = computed(() => {
  let resultado = [...vinculos.value]

  // Filtro de busca
  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    resultado = resultado.filter(v => 
      v.equipamento_codigo?.toLowerCase().includes(busca) ||
      v.equipamento_nome?.toLowerCase().includes(busca) ||
      v.usuario_nome?.toLowerCase().includes(busca) ||
      v.usuario_email?.toLowerCase().includes(busca)
    )
  }

  // Filtro de status
  if (filtros.value.status) {
    const ativo = filtros.value.status === 'Ativo'
    resultado = resultado.filter(v => v.ativo === ativo)
  }

  // Filtro de data
  if (filtros.value.dataInicio) {
    resultado = resultado.filter(v => {
      const dataVinculo = format(parseISO(v.data_inicio), 'yyyy-MM-dd')
      return dataVinculo >= filtros.value.dataInicio
    })
  }

  return resultado
})

// Methods
const carregarVinculos = async () => {
  try {
    carregando.value = true
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        equipamento:equipamentos!vinculos_equipamento_id_fkey(id, codigo, nome, tipo, localizacao),
        usuario:usuarios!vinculos_usuario_id_fkey(id, nome, email, perfil)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data
    vinculos.value = data.map(v => ({
      ...v,
      equipamento_codigo: v.equipamento?.codigo || 'N/A',
      equipamento_nome: v.equipamento?.nome || 'N/A',
      usuario_nome: v.usuario?.nome || 'N/A',
      usuario_email: v.usuario?.email || 'N/A'
    }))

    console.log('✅ Vínculos carregados:', vinculos.value.length)
  } catch (error) {
    console.error('❌ Erro ao carregar vínculos:', error)
    mostrarSnackbar('Erro ao carregar vínculos', 'error')
  } finally {
    carregando.value = false
  }
}

const carregarEquipamentos = async () => {
  try {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('id, codigo, nome, tipo, localizacao, status')
      .eq('status', 'ativo')
      .order('codigo')

    if (error) throw error

    equipamentos.value = data.map(e => ({
      ...e,
      display: `${e.codigo} - ${e.nome}`
    }))
  } catch (error) {
    console.error('❌ Erro ao carregar equipamentos:', error)
  }
}

const carregarUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, ativo')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error

    usuarios.value = data.map(u => ({
      ...u,
      display: `${u.nome} (${u.email})`
    }))
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error)
  }
}

const abrirDialogNovo = () => {
  modoEdicao.value = false
  vinculoForm.value = {
    equipamento_id: null,
    usuario_id: null,
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_fim: null,
    observacoes: '',
    ativo: true
  }
  dialogForm.value = true
}

const editarVinculo = (vinculo) => {
  modoEdicao.value = true
  vinculoForm.value = {
    id: vinculo.id,
    equipamento_id: vinculo.equipamento_id,
    usuario_id: vinculo.usuario_id,
    data_inicio: format(parseISO(vinculo.data_inicio), 'yyyy-MM-dd'),
    data_fim: vinculo.data_fim ? format(parseISO(vinculo.data_fim), 'yyyy-MM-dd') : null,
    observacoes: vinculo.observacoes || '',
    ativo: vinculo.ativo
  }
  dialogForm.value = true
}

const salvarVinculo = async () => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    salvando.value = true

    const vinculoData = {
      equipamento_id: vinculoForm.value.equipamento_id,
      usuario_id: vinculoForm.value.usuario_id,
      data_inicio: vinculoForm.value.data_inicio,
      data_fim: vinculoForm.value.data_fim || null,
      observacoes: vinculoForm.value.observacoes || null,
      ativo: vinculoForm.value.ativo,
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

    let error
    if (modoEdicao.value) {
      // Update
      const result = await supabase
        .from('vinculos')
        .update(vinculoData)
        .eq('id', vinculoForm.value.id)
      error = result.error
    } else {
      // Insert
      const result = await supabase
        .from('vinculos')
        .insert([vinculoData])
      error = result.error
    }

    if (error) throw error

    mostrarSnackbar(
      modoEdicao.value ? 'Vínculo atualizado com sucesso!' : 'Vínculo criado com sucesso!',
      'success'
    )

    fecharDialog()
    await carregarVinculos()
  } catch (error) {
    console.error('❌ Erro ao salvar vínculo:', error)
    mostrarSnackbar(isRlsError(error) ? getMensagemErroRls() : 'Erro ao salvar vínculo', 'error')
  } finally {
    salvando.value = false
  }
}

const visualizarVinculo = (vinculo) => {
  vinculoSelecionado.value = vinculo
  dialogVisualizacao.value = true
}

const finalizarVinculo = async (vinculo) => {
  try {
    const { error } = await supabase
      .from('vinculos')
      .update({
        data_fim: format(new Date(), 'yyyy-MM-dd'),
        ativo: false
      })
      .eq('id', vinculo.id)

    if (error) throw error

    mostrarSnackbar('Vínculo finalizado com sucesso!', 'success')
    await carregarVinculos()
  } catch (error) {
    console.error('❌ Erro ao finalizar vínculo:', error)
    mostrarSnackbar(isRlsError(error) ? getMensagemErroRls() : 'Erro ao finalizar vínculo', 'error')
  }
}

const confirmarExclusao = (vinculo) => {
  vinculoParaExcluir.value = vinculo
  dialogExcluir.value = true
}

const excluirVinculo = async () => {
  if (!vinculoParaExcluir.value) return

  try {
    excluindo.value = true

    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('id', vinculoParaExcluir.value.id)

    if (error) throw error

    mostrarSnackbar('Vínculo excluído com sucesso!', 'success')
    dialogExcluir.value = false
    vinculoParaExcluir.value = null
    await carregarVinculos()
  } catch (error) {
    console.error('❌ Erro ao excluir vínculo:', error)
    mostrarSnackbar(isRlsError(error) ? getMensagemErroRls() : 'Erro ao excluir vínculo', 'error')
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
    status: null,
    dataInicio: null
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
  if (!data) return '-'
  try {
    return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return data
  }
}

const calcularDuracao = (vinculo) => {
  try {
    const inicio = parseISO(vinculo.data_inicio)
    const fim = vinculo.data_fim ? parseISO(vinculo.data_fim) : new Date()
    const dias = differenceInDays(fim, inicio)
    
    if (dias === 0) return 'Menos de 1 dia'
    if (dias === 1) return '1 dia'
    return `${dias} dias`
  } catch {
    return '-'
  }
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

// Realtime subscription
const setupRealtimeSubscription = () => {
  realtimeSubscription.value = supabase
    .channel('vinculos-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vinculos'
      },
      (payload) => {
        console.log('🔄 Vínculo atualizado em tempo real:', payload)
        carregarVinculos()
      }
    )
    .subscribe()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    carregarVinculos(),
    carregarEquipamentos(),
    carregarUsuarios()
  ])
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

.gap-1 {
  gap: 4px;
}
</style>
