<template>
  <v-container fluid class="pa-4">
    <div class="text-h6 font-weight-bold mb-4">
      <v-icon class="mr-2" color="primary">mdi-tune-vertical</v-icon>
      Critérios Normativos
    </div>

    <v-card class="glass pa-4">
      <v-tabs v-model="abaAtiva" color="primary" class="mb-4">
        <v-tab value="horizontal">Horizontal</v-tab>
        <v-tab value="vertical">Vertical</v-tab>
        <v-tab value="dispositivos">Dispositivos</v-tab>
      </v-tabs>

      <v-window v-model="abaAtiva">
        <v-window-item
          v-for="aba in abas"
          :key="aba.key"
          :value="aba.key"
        >
          <v-data-table
            :headers="aba.headers"
            :items="itensPorAba[aba.key]"
            :loading="loading"
            item-key="id"
            density="compact"
          >
            <template #item.valor_minimo="{ item }">
              <v-text-field
                v-model.number="item.valor_minimo"
                type="number"
                density="compact"
                :readonly="!authStore.isAdmin"
                @blur="atualizar(aba.table, item)"
              />
            </template>

            <template #item.ativo="{ item }">
              <v-switch
                v-model="item.ativo"
                :readonly="!authStore.isAdmin"
                @change="atualizar(aba.table, item)"
                inset
              />
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>

      <v-alert
        v-if="!authStore.isAdmin"
        class="mt-4"
        type="info"
        variant="tonal"
      >
        Apenas ADMIN pode editar critérios. Usuários não-admin possuem acesso somente de leitura.
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'

const authStore = useAuthStore()
const loading = ref(false)
const abaAtiva = ref('horizontal')

/**
 * IMPORTANTÍSSIMO:
 * - Vertical usa: public.norma_vertical
 * - Dispositivos usa: public.norma_dispositivos
 * (essas são as tabelas que você criou no Supabase)
 */
const abas = [
  {
    key: 'horizontal',
    table: 'norma_criterios_validacao',
    headers: [
      { title: 'Geometria', key: 'geometria' },
      { title: 'Material', key: 'material' },
      { title: 'Cor', key: 'cor' },
      { title: 'Momento', key: 'momento' },
      { title: 'Norma', key: 'norma_ref' },
      { title: 'Unidade', key: 'unidade' },
      { title: 'Valor Mínimo', key: 'valor_minimo' },
      { title: 'Ativo', key: 'ativo' }
    ]
  },
  {
    key: 'vertical',
    table: 'norma_vertical',
    headers: [
      { title: 'Classe', key: 'classe_pelicula' },
      { title: 'Ângulo Observação', key: 'angulo_observacao' },
      { title: 'Ângulo Entrada', key: 'angulo_entrada' },
      { title: 'Cor', key: 'cor' },
      { title: 'Norma', key: 'norma_ref' },
      { title: 'Unidade', key: 'unidade' },
      { title: 'Valor Mínimo', key: 'valor_minimo' },
      { title: 'Ativo', key: 'ativo' }
    ]
  },
  {
    key: 'dispositivos',
    table: 'norma_dispositivos',
    headers: [
      { title: 'Tipo Lente', key: 'tipo_lente' },
      { title: 'Ângulo Observação', key: 'angulo_observacao' },
      { title: 'Ângulo Entrada', key: 'angulo_entrada' },
      { title: 'Cor', key: 'cor' },
      { title: 'Norma', key: 'norma_ref' },
      { title: 'Unidade', key: 'unidade' },
      { title: 'Valor Mínimo', key: 'valor_minimo' },
      { title: 'Ativo', key: 'ativo' }
    ]
  }
]

const itensPorAba = ref({
  horizontal: [],
  vertical: [],
  dispositivos: []
})

const abasCarregadas = ref({
  horizontal: false,
  vertical: false,
  dispositivos: false
})

const carregarHorizontal = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('norma_criterios_validacao')
    .select('*')
    .order('id', { ascending: true })

  if (!error) {
    itensPorAba.value.horizontal = data
    abasCarregadas.value.horizontal = true
  }

  loading.value = false
}

const carregarVertical = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('norma_vertical')
    .select('*')
    .order('id', { ascending: true })

  if (!error) {
    itensPorAba.value.vertical = data
    abasCarregadas.value.vertical = true
  }

  loading.value = false
}

const carregarDispositivos = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('norma_dispositivos')
    .select('*')
    .order('id', { ascending: true })

if (!error) {
  itensPorAba.value[aba.key] = data
} else {
  itensPorAba.value[aba.key] = []
}
  }

  loading.value = false
}

const carregarAbaAtiva = async (aba) => {
  if (abasCarregadas.value[aba]) return

  if (aba === 'horizontal') {
    await carregarHorizontal()
    return
  }

  if (aba === 'vertical') {
    await carregarVertical()
    return
  }

  if (aba === 'dispositivos') {
    await carregarDispositivos()
  }
}

const atualizar = async (table, item) => {
  if (!authStore.isAdmin) return

  await supabase
    .from(table)
    .update({
      valor_minimo: item.valor_minimo,
      ativo: item.ativo
    })
    .eq('id', item.id)
}

onMounted(() => {
  carregarAbaAtiva(abaAtiva.value)
})

watch(abaAtiva, async (novaAba) => {
  await carregarAbaAtiva(novaAba)
})
</script>

<style scoped>
.glass {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
