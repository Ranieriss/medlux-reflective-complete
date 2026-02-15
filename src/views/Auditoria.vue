<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2" color="primary">mdi-history</v-icon>
      Auditoria
    </h1>

    <v-card class="glass mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select v-model="filtros.entidade" :items="entidades" label="Entidade" clearable />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filtros.acao" :items="acoes" label="Ação" clearable />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="filtros.usuario" label="Usuário" clearable />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="glass">
      <v-data-table :headers="headers" :items="auditoriaFiltrada" :loading="carregando" :items-per-page="15">
        <template v-slot:item.created_at="{ item }">
          {{ formatarData(item.created_at) }}
        </template>
        
        <template v-slot:item.acao="{ item }">
          <v-chip :color="getCorAcao(item.acao)" size="small" variant="flat">
            {{ item.acao }}
          </v-chip>
        </template>
        
        <template v-slot:item.usuario="{ item }">
          <div v-if="item.usuario">
            <div class="font-weight-bold">{{ item.usuario.nome }}</div>
            <div class="text-caption">{{ item.usuario.email }}</div>
          </div>
          <span v-else class="text-grey">Sistema</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="visualizarDetalhes(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogDetalhes" max-width="700px">
      <v-card v-if="auditoriaS elecionada" class="glass">
        <v-card-title>Detalhes da Auditoria</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title>Ação</v-list-item-title>
              <v-list-item-subtitle>{{ auditoriaS elecionada.acao }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Entidade</v-list-item-title>
              <v-list-item-subtitle>{{ auditoriaS elecionada.entidade }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Data/Hora</v-list-item-title>
              <v-list-item-subtitle>{{ formatarData(auditoriaS elecionada.created_at) }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="auditoriaS elecionada.dados_novos">
              <v-list-item-title>Dados</v-list-item-title>
              <v-list-item-subtitle>
                <pre class="text-caption">{{ JSON.stringify(auditoriaS elecionada.dados_novos, null, 2) }}</pre>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogDetalhes = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import supabase from '@/services/supabase'
import { format, parseISO } from 'date-fns'

const auditoria = ref([])
const carregando = ref(false)
const dialogDetalhes = ref(false)
const auditoriaS elecionada = ref(null)

const filtros = ref({
  entidade: null,
  acao: null,
  usuario: null
})

const headers = [
  { title: 'Data/Hora', key: 'created_at' },
  { title: 'Usuário', key: 'usuario' },
  { title: 'Ação', key: 'acao' },
  { title: 'Entidade', key: 'entidade' },
  { title: 'Ações', key: 'actions', sortable: false }
]

const entidades = ['equipamentos', 'usuarios', 'vinculos']
const acoes = ['CREATE', 'UPDATE', 'DELETE']

const auditoriaFiltrada = computed(() => {
  let resultado = auditoria.value
  if (filtros.value.entidade) resultado = resultado.filter(a => a.entidade === filtros.value.entidade)
  if (filtros.value.acao) resultado = resultado.filter(a => a.acao === filtros.value.acao)
  if (filtros.value.usuario) resultado = resultado.filter(a => a.usuario?.nome?.toLowerCase().includes(filtros.value.usuario.toLowerCase()))
  return resultado
})

const getCorAcao = (acao) => {
  const cores = { CREATE: 'success', UPDATE: 'warning', DELETE: 'error' }
  return cores[acao] || 'grey'
}

const formatarData = (data) => {
  try {
    return format(parseISO(data), 'dd/MM/yyyy HH:mm:ss')
  } catch {
    return data
  }
}

const carregarAuditoria = async () => {
  carregando.value = true
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .select('*, usuario:usuarios(nome, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    auditoria.value = data
  } catch (error) {
    console.error('Erro ao carregar auditoria:', error)
  } finally {
    carregando.value = false
  }
}

const visualizarDetalhes = (item) => {
  auditoriaS elecionada.value = item
  dialogDetalhes.value = true
}

onMounted(carregarAuditoria)
</script>

<style scoped>
.glass {
  background: rgba(21, 25, 51, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
}
pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
