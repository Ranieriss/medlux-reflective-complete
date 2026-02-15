<template>
  <div>
    <!-- Header -->
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2" color="primary">mdi-history</v-icon>
      Auditoria
    </h1>

    <!-- Filtros -->
    <v-card class="glass mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filtros.busca"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              placeholder="Usuário ou entidade"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filtros.entidade"
              label="Entidade"
              :items="entidades"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filtros.acao"
              label="Ação"
              :items="acoes"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="2">
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
            <v-text-field
              v-model="filtros.dataFim"
              label="Data Fim"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="1">
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

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="primary" class="mr-3">mdi-notebook</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ totalRegistros }}</div>
                <div class="text-caption text-secondary">Total de Registros</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="success" class="mr-3">mdi-plus-circle</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ contarAcao('INSERT') }}</div>
                <div class="text-caption text-secondary">Criações</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="warning" class="mr-3">mdi-pencil-circle</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ contarAcao('UPDATE') }}</div>
                <div class="text-caption text-secondary">Edições</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass">
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon size="40" color="error" class="mr-3">mdi-delete-circle</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ contarAcao('DELETE') }}</div>
                <div class="text-caption text-secondary">Exclusões</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Timeline de Auditoria -->
    <v-card class="glass">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-timeline-text</v-icon>
        Linha do Tempo
        <v-spacer />
        <v-btn
          icon="mdi-refresh"
          variant="text"
          @click="carregarAuditoria"
          :loading="carregando"
        />
      </v-card-title>

      <v-divider />

      <v-card-text v-if="!carregando && auditoriaFiltrada.length > 0" class="pa-6">
        <v-timeline side="end" density="compact" truncate-line="both">
          <v-timeline-item
            v-for="item in auditoriaFiltrada"
            :key="item.id"
            :dot-color="getAcaoColor(item.acao)"
            :icon="getAcaoIcon(item.acao)"
            size="small"
          >
            <template #opposite>
              <div class="text-caption text-secondary">
                {{ formatarDataHora(item.created_at) }}
              </div>
            </template>

            <v-card variant="tonal" :color="getAcaoColor(item.acao)" class="audit-card">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-chip
                    :color="getAcaoColor(item.acao)"
                    size="small"
                    variant="flat"
                    class="mr-2"
                  >
                    <v-icon start size="x-small">{{ getAcaoIcon(item.acao) }}</v-icon>
                    {{ formatarAcao(item.acao) }}
                  </v-chip>
                  <v-chip size="small" variant="outlined" class="mr-2">
                    {{ formatarEntidade(item.entidade) }}
                  </v-chip>
                  <v-spacer />
                  <v-btn
                    icon="mdi-eye"
                    size="x-small"
                    variant="text"
                    @click="visualizarDetalhes(item)"
                  />
                </div>

                <div class="text-body-2 mb-1">
                  <strong>Usuário:</strong> {{ item.usuario_nome || 'Sistema' }}
                </div>

                <div class="text-caption text-secondary">
                  <v-icon size="16">mdi-identifier</v-icon>
                  ID: {{ item.entidade_id ? item.entidade_id.substring(0, 8) : 'N/A' }}...
                </div>

                <div v-if="item.ip_address" class="text-caption text-secondary">
                  <v-icon size="16">mdi-ip</v-icon>
                  IP: {{ item.ip_address }}
                </div>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>

        <!-- Paginação -->
        <div class="text-center mt-6">
          <v-pagination
            v-model="paginaAtual"
            :length="totalPaginas"
            :total-visible="7"
            @update:model-value="carregarAuditoria"
          />
        </div>
      </v-card-text>

      <!-- Loading -->
      <v-card-text v-if="carregando" class="pa-6">
        <v-skeleton-loader type="list-item-avatar-three-line@5" />
      </v-card-text>

      <!-- No Data -->
      <v-card-text v-if="!carregando && auditoriaFiltrada.length === 0" class="text-center pa-8">
        <v-icon size="64" color="secondary" class="mb-4">mdi-history</v-icon>
        <p class="text-h6">Nenhum registro de auditoria encontrado</p>
        <p class="text-secondary">Aguarde as primeiras ações do sistema</p>
      </v-card-text>
    </v-card>

    <!-- Dialog Detalhes -->
    <v-dialog v-model="dialogDetalhes" max-width="800" scrollable>
      <v-card v-if="itemSelecionado">
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" :color="getAcaoColor(itemSelecionado.acao)">
            {{ getAcaoIcon(itemSelecionado.acao) }}
          </v-icon>
          Detalhes da Auditoria
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialogDetalhes = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <!-- Informações Básicas -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-subtitle class="pb-0">Informações Básicas</v-card-subtitle>
                <v-card-text>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">AÇÃO</div>
                      <v-chip :color="getAcaoColor(itemSelecionado.acao)" size="small">
                        {{ formatarAcao(itemSelecionado.acao) }}
                      </v-chip>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">ENTIDADE</div>
                      <div class="text-body-2">{{ formatarEntidade(itemSelecionado.entidade) }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">USUÁRIO</div>
                      <div class="text-body-2">{{ itemSelecionado.usuario_nome || 'Sistema' }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">DATA/HORA</div>
                      <div class="text-body-2">{{ formatarDataHora(itemSelecionado.created_at) }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">IP</div>
                      <div class="text-body-2">{{ itemSelecionado.ip_address || 'N/A' }}</div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-caption text-secondary mb-1">ID DA ENTIDADE</div>
                      <div class="text-body-2 font-mono">{{ itemSelecionado.entidade_id || 'N/A' }}</div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Dados Anteriores -->
            <v-col v-if="itemSelecionado.dados_anteriores" cols="12">
              <v-card variant="outlined">
                <v-card-subtitle class="pb-0">Dados Anteriores</v-card-subtitle>
                <v-card-text>
                  <pre class="json-view">{{ JSON.stringify(itemSelecionado.dados_anteriores, null, 2) }}</pre>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Dados Novos -->
            <v-col v-if="itemSelecionado.dados_novos" cols="12">
              <v-card variant="outlined">
                <v-card-subtitle class="pb-0">Dados Novos</v-card-subtitle>
                <v-card-text>
                  <pre class="json-view">{{ JSON.stringify(itemSelecionado.dados_novos, null, 2) }}</pre>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- User Agent -->
            <v-col v-if="itemSelecionado.user_agent" cols="12">
              <v-card variant="outlined">
                <v-card-subtitle class="pb-0">User Agent</v-card-subtitle>
                <v-card-text>
                  <div class="text-caption">{{ itemSelecionado.user_agent }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/services/supabase'

// State
const auditoria = ref([])
const carregando = ref(false)
const dialogDetalhes = ref(false)
const itemSelecionado = ref(null)
const paginaAtual = ref(1)
const itensPorPagina = 50
const totalRegistros = ref(0)
const realtimeSubscription = ref(null)

// Filtros
const filtros = ref({
  busca: '',
  entidade: null,
  acao: null,
  dataInicio: null,
  dataFim: null
})

// Options
const entidades = [
  { title: 'Equipamentos', value: 'equipamentos' },
  { title: 'Usuários', value: 'usuarios' },
  { title: 'Vínculos', value: 'vinculos' },
  { title: 'Calibrações', value: 'historico_calibracoes' }
]

const acoes = [
  { title: 'Criação', value: 'INSERT' },
  { title: 'Atualização', value: 'UPDATE' },
  { title: 'Exclusão', value: 'DELETE' }
]

// Computed
const auditoriaFiltrada = computed(() => {
  let resultado = [...auditoria.value]

  // Filtro de busca
  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    resultado = resultado.filter(a => 
      a.usuario_nome?.toLowerCase().includes(busca) ||
      a.entidade?.toLowerCase().includes(busca) ||
      a.entidade_id?.toLowerCase().includes(busca)
    )
  }

  // Filtro de entidade
  if (filtros.value.entidade) {
    resultado = resultado.filter(a => a.entidade === filtros.value.entidade)
  }

  // Filtro de ação
  if (filtros.value.acao) {
    resultado = resultado.filter(a => a.acao === filtros.value.acao)
  }

  // Filtro de data
  if (filtros.value.dataInicio) {
    resultado = resultado.filter(a => {
      const dataItem = format(parseISO(a.created_at), 'yyyy-MM-dd')
      return dataItem >= filtros.value.dataInicio
    })
  }

  if (filtros.value.dataFim) {
    resultado = resultado.filter(a => {
      const dataItem = format(parseISO(a.created_at), 'yyyy-MM-dd')
      return dataItem <= filtros.value.dataFim
    })
  }

  return resultado
})

const totalPaginas = computed(() => {
  return Math.ceil(totalRegistros.value / itensPorPagina)
})

// Methods
const carregarAuditoria = async () => {
  try {
    carregando.value = true

    // Carregar contagem total
    const { count } = await supabase
      .from('auditoria')
      .select('*', { count: 'exact', head: true })

    totalRegistros.value = count || 0

    // Carregar dados paginados
    const { data, error } = await supabase
      .from('auditoria')
      .select(`
        *,
        usuario:usuarios!auditoria_usuario_id_fkey(nome, email)
      `)
      .order('created_at', { ascending: false })
      .range((paginaAtual.value - 1) * itensPorPagina, paginaAtual.value * itensPorPagina - 1)

    if (error) throw error

    // Transform data
    auditoria.value = data.map(a => ({
      ...a,
      usuario_nome: a.usuario?.nome || null
    }))

    console.log('✅ Auditoria carregada:', auditoria.value.length, 'registros')
  } catch (error) {
    console.error('❌ Erro ao carregar auditoria:', error)
  } finally {
    carregando.value = false
  }
}

const visualizarDetalhes = (item) => {
  itemSelecionado.value = item
  dialogDetalhes.value = true
}

const limparFiltros = () => {
  filtros.value = {
    busca: '',
    entidade: null,
    acao: null,
    dataInicio: null,
    dataFim: null
  }
}

const contarAcao = (acao) => {
  return auditoria.value.filter(a => a.acao === acao).length
}

const formatarAcao = (acao) => {
  const acoes = {
    INSERT: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão'
  }
  return acoes[acao] || acao
}

const formatarEntidade = (entidade) => {
  const entidades = {
    equipamentos: 'Equipamentos',
    usuarios: 'Usuários',
    vinculos: 'Vínculos',
    historico_calibracoes: 'Calibrações'
  }
  return entidades[entidade] || entidade
}

const getAcaoColor = (acao) => {
  const colors = {
    INSERT: 'success',
    UPDATE: 'warning',
    DELETE: 'error'
  }
  return colors[acao] || 'grey'
}

const getAcaoIcon = (acao) => {
  const icons = {
    INSERT: 'mdi-plus-circle',
    UPDATE: 'mdi-pencil-circle',
    DELETE: 'mdi-delete-circle'
  }
  return icons[acao] || 'mdi-help-circle'
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
    return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
  } catch {
    return data
  }
}

// Realtime subscription
const setupRealtimeSubscription = () => {
  realtimeSubscription.value = supabase
    .channel('auditoria-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'auditoria'
      },
      (payload) => {
        console.log('🔄 Nova entrada de auditoria:', payload)
        carregarAuditoria()
      }
    )
    .subscribe()
}

// Lifecycle
onMounted(async () => {
  await carregarAuditoria()
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

.audit-card {
  border-left: 4px solid currentColor;
}

.json-view {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
