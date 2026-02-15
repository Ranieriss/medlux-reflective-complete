<template>
  <v-container fluid class="pa-6">
    <!-- Cabeçalho -->
    <v-row align="center" class="mb-6">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon size="36" color="primary" class="mr-3">mdi-chart-line</v-icon>
          Medições de Retrorrefletância
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">
          Registre e valide medições conforme normas ABNT
        </p>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="success"
          size="large"
          prepend-icon="mdi-plus-circle"
          @click="abrirDialogNovo"
          class="mr-2"
        >
          Nova Medição
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="large"
          prepend-icon="mdi-file-chart"
          @click="abrirRelatorioDashboard"
        >
          Relatórios
        </v-btn>
      </v-col>
    </v-row>

    <!-- Dashboard de Status -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="dashboard-card card-em-dia" elevation="2">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">Em Dia</p>
                <h2 class="text-h3 font-weight-bold">{{ stats.em_dia || 0 }}</h2>
              </div>
              <v-icon size="60" color="success" class="opacity-30">mdi-check-circle</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="dashboard-card card-atencao" elevation="2">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">Atenção (30 dias)</p>
                <h2 class="text-h3 font-weight-bold">{{ stats.atencao || 0 }}</h2>
              </div>
              <v-icon size="60" color="warning" class="opacity-30">mdi-alert</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="dashboard-card card-vencida" elevation="2">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">Vencidas</p>
                <h2 class="text-h3 font-weight-bold">{{ stats.vencidas || 0 }}</h2>
              </div>
              <v-icon size="60" color="error" class="opacity-30">mdi-close-circle</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="dashboard-card card-aprovacao" elevation="2">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis">Taxa de Aprovação</p>
                <h2 class="text-h3 font-weight-bold">{{ stats.media_aprovacao || 0 }}%</h2>
              </div>
              <v-icon size="60" color="info" class="opacity-30">mdi-chart-pie</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.busca"
              prepend-inner-icon="mdi-magnify"
              label="Buscar equipamento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="filtros.status"
              :items="statusOptions"
              label="Status Vencimento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="filtros.validacao"
              :items="validacaoOptions"
              label="Validação"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="filtros.tipo"
              :items="tipoEquipamentoOptions"
              label="Tipo Equipamento"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              block
              @click="aplicarFiltros"
              prepend-icon="mdi-filter"
            >
              Filtrar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabela de Medições -->
    <v-card elevation="2">
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="medicoes"
          :loading="loading"
          :items-per-page="10"
          class="elevation-0"
        >
          <!-- Código do Equipamento -->
          <template v-slot:item.equipamento_codigo="{ item }">
            <div class="d-flex align-center">
              <v-chip size="small" color="primary" variant="outlined" class="mr-2">
                {{ item.equipamento_codigo }}
              </v-chip>
              <span class="text-caption">{{ item.equipamento_nome }}</span>
            </div>
          </template>

          <!-- Data da Calibração -->
          <template v-slot:item.data_calibracao="{ item }">
            {{ formatarData(item.data_calibracao) }}
          </template>

          <!-- Próxima Calibração -->
          <template v-slot:item.proxima_calibracao="{ item }">
            <div v-if="item.proxima_calibracao">
              {{ formatarData(item.proxima_calibracao) }}
              <v-chip
                size="x-small"
                :color="getStatusColor(item.status_vencimento)"
                class="ml-2"
              >
                {{ item.dias_vencimento > 0 ? '+' : '' }}{{ item.dias_vencimento }} dias
              </v-chip>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Status Vencimento -->
          <template v-slot:item.status_vencimento="{ item }">
            <v-chip
              :color="getStatusColor(item.status_vencimento)"
              size="small"
              :prepend-icon="getStatusIcon(item.status_vencimento)"
            >
              {{ getStatusLabel(item.status_vencimento) }}
            </v-chip>
          </template>

          <!-- Status Validação -->
          <template v-slot:item.status_validacao="{ item }">
            <v-chip
              v-if="item.status_validacao"
              :color="getValidacaoColor(item.status_validacao)"
              size="small"
              :prepend-icon="getValidacaoIcon(item.status_validacao)"
            >
              {{ item.status_validacao }}
            </v-chip>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Valores -->
          <template v-slot:item.valor_medio="{ item }">
            <div v-if="item.valor_medio">
              <strong>{{ item.valor_medio }}</strong>
              <v-tooltip activator="parent" location="top">
                Referência: {{ item.valor_minimo_referencia }}<br>
                Aprovação: {{ item.percentual_aprovacao }}%
              </v-tooltip>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Ações -->
          <template v-slot:item.acoes="{ item }">
            <v-btn
              icon="mdi-file-pdf-box"
              size="small"
              color="error"
              variant="text"
              @click="gerarLaudoPDF(item)"
            >
              <v-icon>mdi-file-pdf-box</v-icon>
              <v-tooltip activator="parent" location="top">
                Gerar Laudo PDF (ICDVias)
              </v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-eye"
              size="small"
              color="info"
              variant="text"
              @click="visualizarDetalhes(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent" location="top">Ver Detalhes</v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-pencil"
              size="small"
              color="primary"
              variant="text"
              @click="editarMedicao(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">Editar</v-tooltip>
            </v-btn>

            <v-btn
              icon="mdi-delete"
              size="small"
              color="error"
              variant="text"
              @click="confirmarExclusao(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Excluir</v-tooltip>
            </v-btn>
          </template>

          <!-- Loading -->
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10" />
          </template>

          <!-- Sem dados -->
          <template v-slot:no-data>
            <div class="text-center py-12">
              <v-icon size="64" color="grey-lighten-2">mdi-chart-line-variant</v-icon>
              <p class="text-h6 mt-4 text-medium-emphasis">Nenhuma medição encontrada</p>
              <v-btn color="primary" class="mt-4" @click="abrirDialogNovo">
                Criar primeira medição
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog: Nova/Editar Medição -->
    <v-dialog v-model="dialogMedicao" max-width="1000px" persistent scrollable>
      <v-card>
        <v-card-title class="bg-primary">
          <span class="text-h5 text-white">
            <v-icon color="white" class="mr-2">mdi-clipboard-text</v-icon>
            {{ modoEdicao ? 'Editar Medição' : 'Nova Medição de Retrorrefletância' }}
          </span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-6" style="max-height: 600px;">
          <v-form ref="formMedicao" v-model="formValido">
            <v-row>
              <!-- Equipamento -->
              <v-col cols="12">
                <v-autocomplete
                  v-model="formMedicao.equipamento_id"
                  :items="equipamentos"
                  item-title="nome_completo"
                  item-value="id"
                  label="Equipamento *"
                  prepend-inner-icon="mdi-devices"
                  variant="outlined"
                  :rules="[rules.required]"
                  :loading="loadingEquipamentos"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip size="small" color="primary">{{ item.raw.codigo }}</v-chip>
                      </template>
                      <template v-slot:title>
                        {{ item.raw.nome }}
                      </template>
                      <template v-slot:subtitle>
                        {{ item.raw.tipo }} - {{ item.raw.localizacao }}
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>

              <!-- Dados da Medição -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formMedicao.data_calibracao"
                  label="Data da Medição *"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formMedicao.proxima_calibracao"
                  label="Próxima Medição *"
                  type="date"
                  prepend-inner-icon="mdi-calendar-clock"
                  variant="outlined"
                  :rules="[rules.required]"
                  hint="Sugestão: 12 meses após a medição"
                />
              </v-col>

              <!-- Tipo de Película/Material -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="formMedicao.tipo_pelicula"
                  :items="tipoPeliculaOptions"
                  label="Tipo de Película *"
                  prepend-inner-icon="mdi-layers"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formMedicao.cor_medicao"
                  :items="corOptions"
                  label="Cor *"
                  prepend-inner-icon="mdi-palette"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Geometria -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="formMedicao.geometria_medicao"
                  :items="geometriaOptions"
                  label="Geometria de Medição *"
                  prepend-inner-icon="mdi-angle-acute"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Técnico Responsável -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formMedicao.tecnico_responsavel"
                  label="Técnico Responsável *"
                  prepend-inner-icon="mdi-account-hard-hat"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Valores de Medição -->
              <v-col cols="12">
                <v-card variant="outlined" class="pa-4">
                  <v-card-title class="text-subtitle-1 pb-3">
                    <v-icon class="mr-2">mdi-numeric</v-icon>
                    Valores Medidos (cd/(lx·m²) ou mcd/lx)
                  </v-card-title>
                  <v-row>
                    <v-col
                      v-for="(valor, index) in formMedicao.valores_medicoes"
                      :key="index"
                      cols="6"
                      md="3"
                    >
                      <v-text-field
                        v-model.number="formMedicao.valores_medicoes[index]"
                        :label="`Medição ${index + 1}`"
                        type="number"
                        step="0.01"
                        variant="outlined"
                        density="compact"
                        :rules="[rules.required, rules.numeric]"
                      >
                        <template v-slot:append-inner>
                          <v-btn
                            v-if="formMedicao.valores_medicoes.length > 1"
                            icon="mdi-delete"
                            size="x-small"
                            color="error"
                            variant="text"
                            @click="removerMedicao(index)"
                          />
                        </template>
                      </v-text-field>
                    </v-col>

                    <v-col cols="12" class="text-center">
                      <v-btn
                        color="primary"
                        variant="outlined"
                        prepend-icon="mdi-plus"
                        @click="adicionarMedicao"
                        :disabled="formMedicao.valores_medicoes.length >= 10"
                      >
                        Adicionar Medição
                      </v-btn>
                      <span class="text-caption text-medium-emphasis ml-4">
                        {{ formMedicao.valores_medicoes.length }} / 10 medições
                      </span>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>

              <!-- Condições Ambientais -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formMedicao.temperatura_ambiente"
                  label="Temperatura (°C)"
                  type="number"
                  step="0.1"
                  prepend-inner-icon="mdi-thermometer"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formMedicao.umidade_relativa"
                  label="Umidade Relativa (%)"
                  type="number"
                  step="0.1"
                  prepend-inner-icon="mdi-water-percent"
                  variant="outlined"
                />
              </v-col>

              <!-- Observações -->
              <v-col cols="12">
                <v-textarea
                  v-model="formMedicao.observacoes"
                  label="Observações"
                  prepend-inner-icon="mdi-note-text"
                  variant="outlined"
                  rows="3"
                  auto-grow
                />
              </v-col>

              <!-- Resultado da Validação (calculado automaticamente) -->
              <v-col cols="12" v-if="resultadoValidacao">
                <v-alert
                  :type="resultadoValidacao.status_validacao === 'APROVADO' ? 'success' : 'error'"
                  prominent
                  icon="mdi-check-circle"
                >
                  <v-row align="center">
                    <v-col cols="12" md="3">
                      <div class="text-h6">{{ resultadoValidacao.status_validacao }}</div>
                    </v-col>
                    <v-col cols="12" md="9">
                      <div class="text-body-2">
                        <strong>Valor Médio:</strong> {{ resultadoValidacao.valor_medio }} |
                        <strong>Mínimo:</strong> {{ resultadoValidacao.valor_minimo_medido }} |
                        <strong>Máximo:</strong> {{ resultadoValidacao.valor_maximo_medido }} |
                        <strong>Referência ABNT:</strong> {{ resultadoValidacao.valor_minimo_referencia }} |
                        <strong>Taxa Aprovação:</strong> {{ resultadoValidacao.percentual_aprovacao }}%
                      </div>
                    </v-col>
                  </v-row>
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="grey"
            variant="outlined"
            @click="fecharDialog"
            :disabled="salvando"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-calculator"
            @click="calcularValidacao"
            :loading="calculando"
            :disabled="!formValido || salvando"
          >
            Calcular Validação
          </v-btn>
          <v-btn
            color="success"
            prepend-icon="mdi-content-save"
            @click="salvarMedicao"
            :loading="salvando"
            :disabled="!formValido || !resultadoValidacao"
          >
            Salvar Medição
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de notificações -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import calibracaoService from '@/services/calibracaoService'
import equipamentoService from '@/services/equipamentoService'

export default {
  name: 'CalibracoesLista',
  
  setup() {
    // Estados
    const loading = ref(false)
    const loadingEquipamentos = ref(false)
    const medicoes = ref([])
    const equipamentos = ref([])
    const stats = ref({})
    
    // Dialogs
    const dialogMedicao = ref(false)
    const modoEdicao = ref(false)
    const formValido = ref(false)
    const salvando = ref(false)
    const calculando = ref(false)
    
    // Form refs
    const formMedicao = ref(null)
    
    // Resultado da validação
    const resultadoValidacao = ref(null)
    
    // Formulário
    const formMedicaoInicial = {
      equipamento_id: null,
      data_calibracao: new Date().toISOString().split('T')[0],
      proxima_calibracao: '',
      tipo_pelicula: null,
      cor_medicao: null,
      geometria_medicao: null,
      valores_medicoes: [0, 0, 0, 0, 0],
      tecnico_responsavel: '',
      temperatura_ambiente: null,
      umidade_relativa: null,
      observacoes: '',
    }
    const formMedicaoData = ref({ ...formMedicaoInicial })
    
    // Filtros
    const filtros = ref({
      busca: '',
      status: null,
      validacao: null,
      tipo: null,
    })
    
    // Snackbar
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    })
    
    // Opções de Select
    const statusOptions = [
      { title: 'Em Dia', value: 'EM_DIA' },
      { title: 'Atenção (30 dias)', value: 'ATENCAO' },
      { title: 'Vencida', value: 'VENCIDA' },
      { title: 'Sem Medição', value: 'SEM_CALIBRACAO' },
    ]
    
    const validacaoOptions = [
      { title: 'Aprovado', value: 'APROVADO' },
      { title: 'Reprovado', value: 'REPROVADO' },
      { title: 'Indeterminado', value: 'INDETERMINADO' },
    ]
    
    const tipoEquipamentoOptions = [
      { title: 'Vertical (Placas)', value: 'vertical' },
      { title: 'Horizontal (Tintas)', value: 'horizontal' },
      { title: 'Tachas', value: 'tachas' },
      { title: 'Tachões', value: 'tachoes' },
    ]
    
    const tipoPeliculaOptions = [
      'Tipo I', 'Tipo II', 'Tipo III', 'Tipo IV', 
      'Tipo V', 'Tipo VII', 'Tipo VIII'
    ]
    
    const corOptions = [
      'Branco', 'Amarelo', 'Vermelho', 'Verde', 'Azul', 'Marrom'
    ]
    
    const geometriaOptions = [
      '0,2°/-4°', '15m/1,5°', '0,2°/0°', '0,2°/20°'
    ]
    
    // Headers da tabela
    const headers = [
      { title: 'Equipamento', key: 'equipamento_codigo', sortable: true },
      { title: 'Tipo', key: 'equipamento_tipo', sortable: true },
      { title: 'Data Medição', key: 'data_calibracao', sortable: true },
      { title: 'Próxima Medição', key: 'proxima_calibracao', sortable: true },
      { title: 'Status', key: 'status_vencimento', sortable: true },
      { title: 'Validação', key: 'status_validacao', sortable: true },
      { title: 'Valor Médio', key: 'valor_medio', sortable: true },
      { title: 'Ações', key: 'acoes', sortable: false, align: 'center' },
    ]
    
    // Regras de validação
    const rules = {
      required: value => !!value || 'Campo obrigatório',
      numeric: value => !isNaN(value) || 'Deve ser um número válido',
    }
    
    // Métodos
    const carregarMedicoes = async () => {
      loading.value = true
      try {
        const response = await calibracaoService.listarCalibracoes(filtros.value)
        medicoes.value = response
      } catch (error) {
        mostrarNotificacao('Erro ao carregar medições: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    const carregarStats = async () => {
      try {
        const response = await calibracaoService.obterEstatisticas()
        stats.value = response
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }
    
    const carregarEquipamentos = async () => {
      loadingEquipamentos.value = true
      try {
        const response = await equipamentoService.listar()
        equipamentos.value = response.map(eq => ({
          ...eq,
          nome_completo: `${eq.codigo} - ${eq.nome}`
        }))
      } catch (error) {
        mostrarNotificacao('Erro ao carregar equipamentos: ' + error.message, 'error')
      } finally {
        loadingEquipamentos.value = false
      }
    }
    
    const abrirDialogNovo = () => {
      modoEdicao.value = false
      formMedicaoData.value = { ...formMedicaoInicial }
      resultadoValidacao.value = null
      
      // Calcular próxima calibração (12 meses)
      const hoje = new Date()
      const proxima = new Date(hoje.setFullYear(hoje.getFullYear() + 1))
      formMedicaoData.value.proxima_calibracao = proxima.toISOString().split('T')[0]
      
      dialogMedicao.value = true
    }
    
    const fecharDialog = () => {
      dialogMedicao.value = false
      formMedicaoData.value = { ...formMedicaoInicial }
      resultadoValidacao.value = null
    }
    
    const adicionarMedicao = () => {
      if (formMedicaoData.value.valores_medicoes.length < 10) {
        formMedicaoData.value.valores_medicoes.push(0)
      }
    }
    
    const removerMedicao = (index) => {
      formMedicaoData.value.valores_medicoes.splice(index, 1)
    }
    
    const calcularValidacao = async () => {
      calculando.value = true
      try {
        const equipamentoSelecionado = equipamentos.value.find(
          eq => eq.id === formMedicaoData.value.equipamento_id
        )
        
        if (!equipamentoSelecionado) {
          throw new Error('Selecione um equipamento')
        }
        
        const resultado = await calibracaoService.calcularValidacao({
          tipo_equipamento: equipamentoSelecionado.tipo,
          tipo_pelicula: formMedicaoData.value.tipo_pelicula,
          tipo_material: null,
          cor: formMedicaoData.value.cor_medicao,
          geometria: formMedicaoData.value.geometria_medicao,
          valores_medicoes: formMedicaoData.value.valores_medicoes,
        })
        
        resultadoValidacao.value = resultado
        mostrarNotificacao('Validação calculada com sucesso!', 'success')
      } catch (error) {
        mostrarNotificacao('Erro ao calcular validação: ' + error.message, 'error')
      } finally {
        calculando.value = false
      }
    }
    
    const salvarMedicao = async () => {
      if (!formValido.value || !resultadoValidacao.value) {
        mostrarNotificacao('Preencha todos os campos e calcule a validação', 'warning')
        return
      }
      
      salvando.value = true
      try {
        const dados = {
          ...formMedicaoData.value,
          ...resultadoValidacao.value,
        }
        
        await calibracaoService.registrarCalibracao(dados)
        mostrarNotificacao('Medição salva com sucesso!', 'success')
        fecharDialog()
        carregarMedicoes()
        carregarStats()
      } catch (error) {
        mostrarNotificacao('Erro ao salvar medição: ' + error.message, 'error')
      } finally {
        salvando.value = false
      }
    }
    
    const gerarLaudoPDF = async (item) => {
      try {
        mostrarNotificacao('Gerando laudo em PDF...', 'info')
        await calibracaoService.gerarLaudoPDF(item.calibracao_id)
        mostrarNotificacao('Laudo gerado com sucesso!', 'success')
      } catch (error) {
        mostrarNotificacao('Erro ao gerar laudo: ' + error.message, 'error')
      }
    }
    
    const aplicarFiltros = () => {
      carregarMedicoes()
    }
    
    const mostrarNotificacao = (text, color = 'success') => {
      snackbar.value = { show: true, text, color }
    }
    
    // Helpers
    const formatarData = (data) => {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR')
    }
    
    const getStatusColor = (status) => {
      const colors = {
        'EM_DIA': 'success',
        'ATENCAO': 'warning',
        'VENCIDA': 'error',
        'SEM_CALIBRACAO': 'grey',
      }
      return colors[status] || 'grey'
    }
    
    const getStatusIcon = (status) => {
      const icons = {
        'EM_DIA': 'mdi-check-circle',
        'ATENCAO': 'mdi-alert',
        'VENCIDA': 'mdi-close-circle',
        'SEM_CALIBRACAO': 'mdi-help-circle',
      }
      return icons[status] || 'mdi-help-circle'
    }
    
    const getStatusLabel = (status) => {
      const labels = {
        'EM_DIA': 'Em Dia',
        'ATENCAO': 'Atenção',
        'VENCIDA': 'Vencida',
        'SEM_CALIBRACAO': 'Sem Medição',
      }
      return labels[status] || status
    }
    
    const getValidacaoColor = (validacao) => {
      const colors = {
        'APROVADO': 'success',
        'REPROVADO': 'error',
        'INDETERMINADO': 'warning',
      }
      return colors[validacao] || 'grey'
    }
    
    const getValidacaoIcon = (validacao) => {
      const icons = {
        'APROVADO': 'mdi-check-circle',
        'REPROVADO': 'mdi-close-circle',
        'INDETERMINADO': 'mdi-help-circle',
      }
      return icons[validacao] || 'mdi-help-circle'
    }
    
    // Lifecycle
    onMounted(() => {
      carregarMedicoes()
      carregarStats()
      carregarEquipamentos()
    })
    
    return {
      // Estados
      loading,
      loadingEquipamentos,
      medicoes,
      equipamentos,
      stats,
      
      // Dialogs
      dialogMedicao,
      modoEdicao,
      formValido,
      salvando,
      calculando,
      
      // Form
      formMedicao: formMedicaoData,
      resultadoValidacao,
      
      // Filtros
      filtros,
      statusOptions,
      validacaoOptions,
      tipoEquipamentoOptions,
      
      // Opções
      tipoPeliculaOptions,
      corOptions,
      geometriaOptions,
      
      // Headers
      headers,
      
      // Regras
      rules,
      
      // Snackbar
      snackbar,
      
      // Métodos
      abrirDialogNovo,
      fecharDialog,
      adicionarMedicao,
      removerMedicao,
      calcularValidacao,
      salvarMedicao,
      gerarLaudoPDF,
      aplicarFiltros,
      
      // Helpers
      formatarData,
      getStatusColor,
      getStatusIcon,
      getStatusLabel,
      getValidacaoColor,
      getValidacaoIcon,
    }
  }
}
</script>

<style scoped>
.dashboard-card {
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}

.card-em-dia {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.card-atencao {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.card-vencida {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.card-aprovacao {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.opacity-30 {
  opacity: 0.3;
}
</style>
